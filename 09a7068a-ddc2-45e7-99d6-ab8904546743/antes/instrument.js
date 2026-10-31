// CommonJS: initialize before Express and Socket.IO are imported.
const Sentry = require('@sentry/node');

function sanitizeEvent(event) {
  // Keep stack traces and operational tags, never chat payloads or credentials.
  delete event.user;
  delete event.extra;
  delete event.breadcrumbs;
  if (event.request) {
    const { method, url } = event.request;
    event.request = { method, url: url && url.split(/[?#]/)[0] };
  }
  return event;
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || (process.env.RENDER ? 'render' : 'local'),
    sendDefaultPii: false,
    tracesSampleRate: 0,
    enableLogs: false,
    beforeSend: sanitizeEvent,
  });
}

module.exports = { Sentry, sanitizeEvent };
