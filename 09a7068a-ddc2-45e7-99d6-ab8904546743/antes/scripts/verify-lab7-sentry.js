// Local SDK verification with an in-memory transport. No cloud event is sent.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { io: connect } = require('socket.io-client');

const output = path.join(__dirname, '..', 'evidencias', 'lab7');
const results = { startedAt: new Date().toISOString(), scope: 'local SDK, in-memory transport; NOT Sentry Cloud', checks: [] };
const envelopes = [];
delete process.env.SENTRY_DSN;
const { Sentry, sanitizeEvent } = require('../instrument');
process.env.SENTRY_DSN = 'https://public@example.invalid/1';
process.env.SENTRY_ENVIRONMENT = 'local';
process.env.SENTRY_TEST_ENABLED = 'true';
process.env.SENTRY_TEST_TOKEN = randomBytes(32).toString('hex');
Sentry.init({
  dsn: process.env.SENTRY_DSN, environment: 'local', sendDefaultPii: false,
  defaultIntegrations: false, beforeSend: sanitizeEvent,
  transport: () => ({
    send: async (envelope) => { envelopes.push(envelope); return { statusCode: 200 }; },
    flush: async () => true,
  }),
});
const { createChatServer } = require('../server');

async function chatRoundTrip(url) {
  const client = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket timeout')), 5000);
      client.on('connect', () => client.emit('Evento-Mensaje-Server', JSON.stringify({ nombre: 'Lab7', mensaje: 'Prueba local', color: '#123456' })));
      client.on('Evento-Mensaje-Server', (raw) => {
        clearTimeout(timer);
        try { assert.equal(JSON.parse(raw).mensaje, 'Prueba local'); resolve(); } catch (error) { reject(error); }
      });
      client.on('connect_error', (error) => { clearTimeout(timer); reject(error); });
    });
  } finally { client.close(); }
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const { server, io } = createChatServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(url)).status, 200);
    results.checks.push('PASS GET / = 200');
    await chatRoundTrip(url);
    results.checks.push('PASS Socket.IO chat before controlled error');
    for (const authorization of ['', 'Bearer invalid']) {
      assert.equal((await fetch(`${url}/__lab/sentry-test`, { method: 'POST', headers: { authorization } })).status, 404);
    }
    assert.equal(envelopes.length, 0);
    results.checks.push('PASS missing/invalid token = 404; zero events');
    const headers = { authorization: `Bearer ${process.env.SENTRY_TEST_TOKEN}` };
    const response = await fetch(`${url}/__lab/sentry-test`, { method: 'POST', headers });
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.match(body.eventId, /^[a-f0-9]{32}$/);
    assert.equal(body.flushed, true);
    const event = envelopes.flatMap((envelope) => envelope[1]).find((item) => item[0].type === 'event')[1];
    assert.equal(event.exception.values[0].value, 'LAB7_ERROR_CONTROLADO_UNA_CHAT');
    assert.ok(event.exception.values[0].stacktrace.frames.length);
    assert.equal(event.environment, 'local');
    assert.equal(event.tags.controlled_test, 'true');
    results.checks.push('PASS SDK event: controlled message, stack trace, local environment and tags');
    assert.equal((await fetch(`${url}/__lab/sentry-test`, { method: 'POST', headers })).status, 410);
    results.checks.push('PASS second authorized probe = 410');
    await chatRoundTrip(url);
    results.checks.push('PASS chat remains operational after controlled error');
    const clean = sanitizeEvent({ user: { email: 'private' }, extra: { mensaje: 'private' }, breadcrumbs: [], request: { method: 'POST', url: 'http://localhost/test?token=private', headers: { authorization: 'private' }, data: 'private' } });
    assert.ok(!JSON.stringify(clean).includes('private'));
    results.checks.push('PASS sanitizer removes user, extra, breadcrumbs, query, headers and body');
  } finally { await new Promise((resolve) => io.close(resolve)); }
  process.env.SENTRY_TEST_ENABLED = 'false';
  const disabled = createChatServer();
  await new Promise((resolve) => disabled.server.listen(0, '127.0.0.1', resolve));
  try {
    assert.equal((await fetch(`http://127.0.0.1:${disabled.server.address().port}/__lab/sentry-test`, { method: 'POST' })).status, 404);
    results.checks.push('PASS disabled probe is not registered (404)');
  } finally { await new Promise((resolve) => disabled.io.close(resolve)); }
  await Sentry.close(2000);
  results.finishedAt = new Date().toISOString();
  results.status = 'PASS';
  fs.writeFileSync(path.join(output, 'sentry-local-verification.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
