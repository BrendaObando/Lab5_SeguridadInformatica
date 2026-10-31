// Manual instrumentation: no chat payloads, credentials or user identifiers.
const enabled = process.env.OTEL_LOCAL_ENABLED === 'true' && !process.env.RENDER && Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
let sdk;
let api;
let logger;
let requests;
let errors;
let duration;
let messages;
if (enabled) {
  api = require('@opentelemetry/api');
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { resourceFromAttributes } = require('@opentelemetry/resources');
  const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
  const { BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
  const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
  const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-proto');
  sdk = new NodeSDK({
    autoDetectResources: false,
    resource: resourceFromAttributes({
      'service.name': process.env.OTEL_SERVICE_NAME || 'una-chat',
      'deployment.environment': 'local',
      'deployment.environment.name': 'local',
      'runtime.kind': process.env.RUNTIME_KIND || 'node',
    }),
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter(), exportIntervalMillis: 5000 })],
    logRecordProcessors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter(), scheduledDelayMillis: 1000 })],
  });
  sdk.start();
  logger = api.logs.getLogger('una-chat');
  const meter = api.metrics.getMeter('una-chat');
  requests = meter.createCounter('una_chat_http_requests', { description: 'Completed HTTP requests' });
  errors = meter.createCounter('una_chat_errors', { description: 'HTTP and message errors' });
  duration = meter.createHistogram('una_chat_http_duration', { unit: 's', description: 'HTTP duration in seconds' });
  messages = meter.createCounter('una_chat_messages', { description: 'Processed chat messages' });
}

function event(name, attributes = {}, failed = false) {
  if (!enabled) return;
  const spanContext = api.trace.getActiveSpan()?.spanContext();
  const safe = { ...attributes, 'deployment.environment': 'local', 'service.name': process.env.OTEL_SERVICE_NAME || 'una-chat' };
  logger.emit({ body: name, severityNumber: failed ? 17 : 9, severityText: failed ? 'ERROR' : 'INFO', attributes: safe });
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event: name, ...safe, trace_id: spanContext?.traceId, span_id: spanContext?.spanId }));
}

function processMessage(work) {
  if (!enabled) return work();
  return api.trace.getTracer('una-chat').startActiveSpan('chat.process_message', (span) => {
    try {
      const result = work();
      messages.add(1, { outcome: 'success' });
      event('chat.message.processed', { outcome: 'success' });
      span.setStatus({ code: api.SpanStatusCode.OK });
      return result;
    } catch (error) {
      errors.add(1, { operation: 'chat.message' });
      span.setStatus({ code: api.SpanStatusCode.ERROR, message: 'Message processing failed' });
      event('chat.message.failed', { outcome: 'error' }, true);
      throw error;
    } finally { span.end(); }
  });
}

function httpMiddleware(req, res, next) {
  if (!enabled) return next();
  // Only use known low-cardinality routes; never record a raw path/query.
  const routes = new Set(['/', '/api/messages', '/__lab/local-error']);
  const route = routes.has(req.path) ? req.path : 'other';
  api.trace.getTracer('una-chat').startActiveSpan(`${req.method} ${route}`, { kind: api.SpanKind.SERVER }, (span) => {
    const start = process.hrtime.bigint();
    res.once('finish', () => {
      const attributes = { 'http.request.method': req.method, 'http.route': route, 'http.response.status_code': res.statusCode };
      const seconds = Number(process.hrtime.bigint() - start) / 1e9;
      span.setAttributes(attributes);
      if (res.statusCode >= 500) {
        errors.add(1, { operation: 'http', 'http.route': route });
        span.setStatus({ code: api.SpanStatusCode.ERROR });
      }
      requests.add(1, attributes);
      duration.record(seconds, attributes);
      api.context.with(api.trace.setSpan(api.context.active(), span), () => event('http.response', { ...attributes, duration_seconds: seconds }, res.statusCode >= 500));
      span.end();
    });
    next();
  });
}

module.exports = { enabled, event, processMessage, httpMiddleware, shutdown: () => sdk ? sdk.shutdown() : Promise.resolve() };
