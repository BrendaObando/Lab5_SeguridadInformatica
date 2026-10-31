const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { io: connect } = require('socket.io-client');

async function main() {
  const output = path.join(__dirname, '..', 'evidencias', 'lab7');
  const received = [];
  const startedAt = new Date().toISOString();
  const receiver = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      received.push({ path: req.url, body: Buffer.concat(chunks), contentType: req.headers['content-type'] });
      res.writeHead(200, { 'Content-Type': 'application/x-protobuf' });
      res.end();
    });
  });
  await new Promise((resolve) => receiver.listen(0, '127.0.0.1', resolve));
  const portReservation = http.createServer();
  await new Promise((resolve) => portReservation.listen(0, '127.0.0.1', resolve));
  const port = portReservation.address().port;
  await new Promise((resolve) => portReservation.close(resolve));
  let stdout = ''; let stderr = '';
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), RENDER: '', SENTRY_DSN: '', OTEL_EXPORTER_OTLP_HEADERS: '', OTEL_LOCAL_ENABLED: 'true', UNA_CHAT_LOCAL_API: 'true', OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${receiver.address().port}`, OTEL_SERVICE_NAME: 'una-chat' },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const checks = [];
  let socket;
  try {
    const url = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 20000;
    while (!stdout.includes('listening on')) {
      if (child.exitCode !== null) throw new Error(`Application exited: ${stderr}`);
      if (Date.now() > deadline) throw new Error(`Startup timeout: ${stderr}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal((await fetch(url)).status, 200);
    socket = connect(url, { transports: ['websocket'], reconnection: false });
    await Promise.race([once(socket, 'connect'), new Promise((_, reject) => setTimeout(() => reject(new Error('Socket timeout')), 5000))]);
    const incoming = once(socket, 'Evento-Mensaje-Server');
    const secretPayload = 'PRIVATE_CHAT_PAYLOAD_NOT_FOR_LOGS';
    const response = await fetch(`${url}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'PRIVATE_NAME', mensaje: secretPayload }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).mensaje, secretPayload);
    assert.equal(JSON.parse((await incoming)[0]).mensaje, secretPayload);
    checks.push('PASS HTTP message uses real processor and reaches Socket.IO client');
    assert.equal((await fetch(`${url}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 400);
    assert.equal((await fetch(`${url}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(`${url}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensaje: 'x'.repeat(20000) }) })).status, 413);
    checks.push('PASS malformed JSON=400 and body over 16 KiB=413');
    assert.equal((await fetch(`${url}/__lab/local-error`, { method: 'POST' })).status, 500);
    assert.equal((await fetch(url)).status, 200);
    checks.push('PASS invalid body=400, controlled local error=500, app remains available=200');
    const exportDeadline = Date.now() + 18000;
    while (!['/v1/traces', '/v1/logs', '/v1/metrics'].every((signal) => received.some((item) => item.path === signal))) {
      if (Date.now() > exportDeadline) throw new Error(`Missing signals. Received: ${received.map((item) => item.path)}; stderr: ${stderr}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    checks.push('PASS real HTTP/protobuf OTLP exports received for logs, traces and metrics on local receiver');
    const records = stdout.split('\n').filter((line) => line.startsWith('{')).map((line) => JSON.parse(line));
    const log = records.find((item) => item.event === 'chat.message.processed');
    assert.match(log.trace_id, /^[a-f0-9]{32}$/);
    const idBytes = Buffer.from(log.trace_id, 'hex');
    assert.ok(received.some((item) => item.path === '/v1/traces' && item.body.includes(idBytes)));
    assert.ok(received.some((item) => item.path === '/v1/logs' && item.body.includes(idBytes)));
    checks.push('PASS the same trace_id occurs in chat log, OTLP log and exported trace');
    for (const privateValue of [secretPayload, 'PRIVATE_NAME']) {
      assert.ok(!stdout.includes(privateValue));
      assert.ok(!received.some((item) => item.body.includes(Buffer.from(privateValue))));
    }
    checks.push('PASS private message and name absent from logs and exported protobuf payloads');
    const record = { startedAt, finishedAt: new Date().toISOString(), scope: 'Local OTLP test receiver, not Grafana Cloud', checks, correlatedTraceId: log.trace_id, signals: received.map((item) => ({ path: item.path, bytes: item.body.length, contentType: item.contentType })), status: 'PASS' };
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'telemetry-local-verification.json'), JSON.stringify(record, null, 2));
    fs.writeFileSync(path.join(output, 'telemetry-local-app.ndjson'), stdout);
    console.log(JSON.stringify(record, null, 2));
  } finally {
    if (socket) socket.close();
    child.kill();
    await new Promise((resolve) => receiver.close(resolve));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
