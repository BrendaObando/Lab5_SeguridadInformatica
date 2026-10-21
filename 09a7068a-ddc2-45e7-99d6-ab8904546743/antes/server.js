const path = require('path');
const validation = require('./libs/unalib');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');

function createChatServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
  io.on('connection', (socket) => {
    socket.on('Evento-Mensaje-Server', (message) => {
      io.emit('Evento-Mensaje-Server', validation.validateMessage(message));
    });
  });
  return { app, server, io };
}

if (require.main === module) {
  const { server } = createChatServer();
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`listening on *:${port}`));
}

module.exports = { createChatServer };
