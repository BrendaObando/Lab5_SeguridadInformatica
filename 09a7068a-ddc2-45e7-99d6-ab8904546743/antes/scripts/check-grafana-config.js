const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');

function validate(config) {
  const checks = [];
  const check = (name, ok) => checks.push({ name, ok: Boolean(ok) });
  check('local_export_enabled', config.OTEL_LOCAL_ENABLED === 'true');
  check('local_http_adapter_enabled', config.UNA_CHAT_LOCAL_API === 'true');
  check('service_name_una_chat', config.OTEL_SERVICE_NAME === 'una-chat');
  check('protocol_http_protobuf', config.OTEL_EXPORTER_OTLP_PROTOCOL === 'http/protobuf');
  let endpoint;
  try { endpoint = new URL(config.OTEL_EXPORTER_OTLP_ENDPOINT); } catch (_) { /* Report shape only. */ }
  check('grafana_https_base_endpoint', endpoint?.protocol === 'https:' && endpoint.hostname.endsWith('.grafana.net') && endpoint.pathname.replace(/\/$/, '') === '/otlp' && !endpoint.username && !endpoint.password && !endpoint.search);
  let authorization;
  try {
    const headers = config.OTEL_EXPORTER_OTLP_HEADERS || '';
    const entry = headers.split(',').map((item) => item.trim()).find((item) => item.toLowerCase().startsWith('authorization='));
    authorization = entry && decodeURIComponent(entry.slice(entry.indexOf('=') + 1));
  } catch (_) { /* Never log malformed secret input. */ }
  const encoded = authorization?.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/)?.[1];
  const credential = encoded && Buffer.from(encoded, 'base64').toString('utf8');
  check('authorization_basic_shape', encoded && encoded.length % 4 === 0 && /^\d+:glc_[A-Za-z0-9_+/=-]{30,}$/.test(credential));
  check('render_disabled', !config.RENDER);
  return { ready: checks.every((item) => item.ok), checks, cloudReceptionVerified: false };
}

if (require.main === module) {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log(JSON.stringify({ ready: false, reason: 'missing_local_env_file', cloudReceptionVerified: false }, null, 2));
    process.exitCode = 1;
  } else {
    try {
      const result = validate(parseEnv(fs.readFileSync(envPath, 'utf8')));
      console.log(JSON.stringify(result, null, 2));
      if (!result.ready) process.exitCode = 1;
    } catch (_) {
      console.error('No se pudo validar el archivo local. No copiar su contenido al chat.');
      process.exitCode = 1;
    }
  }
}
module.exports = { validate };
