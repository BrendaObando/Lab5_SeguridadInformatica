const { Sentry } = require('./instrument');
const path = require('path');
const { timingSafeEqual } = require('crypto');
const validation = require('./libs/unalib');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');

function createChatServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  // Temporary lab probe: disabled by default, protected, one use per process.
  const probeToken = process.env.SENTRY_TEST_TOKEN || '';
  if (process.env.SENTRY_TEST_ENABLED === 'true' && probeToken.length >= 32 && process.env.SENTRY_DSN) {
    let probeUsed = false;
    app.post('/__lab/sentry-test', async (req, res) => {
      res.set('Cache-Control', 'no-store');
      const supplied = Buffer.from(req.get('authorization') || '');
      const expected = Buffer.from(`Bearer ${probeToken}`);
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        return res.status(404).end();
      }
      if (probeUsed) return res.status(410).json({ error: 'Prueba ya utilizada' });
      probeUsed = true;
      const eventId = Sentry.captureException(new Error('LAB7_ERROR_CONTROLADO_UNA_CHAT'), {
        tags: { service: 'una-chat', lab: '7', controlled_test: 'true' },
      });
      try {
        const flushed = await Sentry.flush(5000);
        return res.status(500).json({ error: 'Error controlado del laboratorio 7', eventId, flushed });
      } catch (_) {
        return res.status(503).json({ error: 'No se pudo completar el envio de la prueba', eventId });
      }
    });
  }
  io.on('connection', (socket) => {
    socket.on('Evento-Mensaje-Server', (message) => {
      try {
        io.emit('Evento-Mensaje-Server', validation.validateMessage(message));
      } catch (error) {
        Sentry.captureException(error, { tags: { operation: 'chat.message' } });
        socket.emit('chat:error', { error: 'No se pudo procesar el mensaje' });
      }
    });
  });
  if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
  app.use((error, _req, res, _next) => {
    res.status(500).json({ error: 'Error interno del servidor' });
  });
  return { app, server, io };
}

if (require.main === module) {
  const { server } = createChatServer();
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`listening on *:${port}`));
}

module.exports = { createChatServer };
