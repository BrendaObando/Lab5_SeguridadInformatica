// Supervised single-event check for the already deployed Render service.
// Secrets are read from an ignored local file and are never printed.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { parseArgs } = require('node:util');

const root = path.join(__dirname, '..');
const secretFile = path.join(root, '.env.sentry-test');
const evidenceDir = path.join(root, 'evidencias', 'lab7');
const origin = 'https://lab5-seguridadinformatica.onrender.com';

function readToken(text) {
  const token = text.match(/^SENTRY_TEST_TOKEN=([a-f0-9]{64})\r?$/m)?.[1];
  if (!token) throw new Error('El archivo privado no contiene un token valido. No copie su contenido al chat.');
  return token;
}

async function request(url, options = {}) {
  if (new URL(url).origin !== origin) throw new Error('Destino de prueba no permitido');
  return fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(90000) });
}

async function main() {
  const { values } = parseArgs({ options: { prepare: { type: 'boolean' }, send: { type: 'boolean' }, 'verify-disabled': { type: 'boolean' } } });
  if (Object.values(values).filter(Boolean).length !== 1) {
    throw new Error('Elegir solo una opcion: --prepare, --send o --verify-disabled');
  }
  if (values.prepare) {
    if (fs.existsSync(secretFile)) {
      readToken(fs.readFileSync(secretFile, 'utf8'));
      console.log('Archivo privado existente conservado. No se ha cambiado el token.');
      return;
    }
    fs.writeFileSync(secretFile, `# PRIVATE - copy only the token value into Render; never into chat or evidence.\nSENTRY_TEST_TOKEN=${randomBytes(32).toString('hex')}\n`, { flag: 'wx', mode: 0o600 });
    console.log('Archivo privado .env.sentry-test preparado; el token no se muestra.');
    return;
  }

  const token = readToken(fs.readFileSync(secretFile, 'utf8'));
  const before = await request(`${origin}/`);
  await before.arrayBuffer();
  if (before.status !== 200) throw new Error('El chat no esta disponible. No se envio la prueba.');
  if (values.send && fs.existsSync(path.join(evidenceDir, 'sentry-render-event.json'))) {
    throw new Error('Ya existe un registro de envio. Revisarlo antes de repetir un error de produccion.');
  }
  const startedAt = new Date().toISOString();
  const response = await request(`${origin}/__lab/sentry-test`, { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch (_) { body = {}; }
  const record = {
    service: origin,
    startedAt,
    finishedAt: new Date().toISOString(),
    mode: values.send ? 'controlled-error' : 'verify-disabled',
    httpStatus: response.status,
    eventId: /^[a-f0-9]{32}$/.test(body.eventId || '') ? body.eventId : null,
    sdkQueueFlushed: body.flushed === true,
    sentryCloudEventVerified: false,
    temporaryRouteAbsent: response.status === 404 && text.includes('Cannot POST /__lab/sentry-test'),
  };
  const after = await request(`${origin}/`);
  await after.arrayBuffer();
  record.chatStatusAfter = after.status;
  record.expectedResponse = values.send ? response.status === 500 && Boolean(record.eventId) : record.temporaryRouteAbsent;
  fs.mkdirSync(evidenceDir, { recursive: true });
  const name = values.send && record.expectedResponse ? 'sentry-render-event.json' : values['verify-disabled'] ? 'sentry-render-disabled.json' : 'sentry-render-attempt.json';
  fs.writeFileSync(path.join(evidenceDir, name), JSON.stringify(record, null, 2));
  console.log(JSON.stringify(record, null, 2));
  if (!record.expectedResponse || after.status !== 200) process.exitCode = 1;
}

if (require.main === module) main().catch(() => {
  console.error('La comprobacion no pudo completarse. Revisar disponibilidad y configuracion; no enviar secretos al chat.');
  process.exitCode = 1;
});
module.exports = { readToken };
