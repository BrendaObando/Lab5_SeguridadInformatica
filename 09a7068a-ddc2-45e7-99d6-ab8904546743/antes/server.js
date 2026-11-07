const { Sentry } = require('./instrument');
const telemetry = require('./telemetry');
const path = require('path');
const validation = require('./libs/unalib');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');

function createChatServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] } });
  app.use(telemetry.httpMiddleware);
  app.use(express.static(path.join(__dirname, 'dist')));
  const processMessage = (message) => telemetry.processMessage(() => validation.validateMessage(message));
  // HTTP adapter shares the exact processor and broadcast used by Socket.IO.
  // Render cannot enable these lab-only routes.
  if (!process.env.RENDER && process.env.UNA_CHAT_LOCAL_API === 'true') {
    app.post('/api/messages', express.json({ limit: '16kb' }), (req, res) => {
      if (!req.body || typeof req.body.mensaje !== 'string' || req.body.mensaje.length > 4096) {
        return res.status(400).json({ error: 'Se requiere mensaje de hasta 4096 caracteres' });
      }
      const result = processMessage(req.body);
      io.emit('Evento-Mensaje-Server', result);
      return res.status(200).json(JSON.parse(result));
    });
    app.post('/__lab/local-error', (_req, res) => {
      telemetry.event('lab.controlled_error', { outcome: 'error' }, true);
      return res.status(500).json({ error: 'LAB7_ERROR_LOCAL_CONTROLADO' });
    });
  }
  io.on('connection', (socket) => {
    socket.on('Evento-Mensaje-Server', (message) => {
      try {
        io.emit('Evento-Mensaje-Server', processMessage(message));
      } catch (error) {
        Sentry.captureException(error, { tags: { operation: 'chat.message' } });
        socket.emit('chat:error', { error: 'No se pudo procesar el mensaje' });
      }
    });
  });
  if (process.env.SENTRY_DSN) Sentry.setupExpressErrorHandler(app);
  app.use((error, _req, res, _next) => {
    if (error.status === 400 || error.status === 413) {
      return res.status(error.status).json({ error: error.status === 413 ? 'El cuerpo excede el limite permitido' : 'JSON invalido' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  });
  return { app, server, io };
}

if (require.main === module) {
  const { server, io } = createChatServer();
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`listening on *:${port}`));
  const shutdown = () => {
    io.close(async () => {
      await Promise.allSettled([telemetry.shutdown(), Sentry.close(5000)]);
      process.exit(0);
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

module.exports = { createChatServer };
