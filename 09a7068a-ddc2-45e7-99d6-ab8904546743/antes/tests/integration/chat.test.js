const { io: createClient } = require('socket.io-client');
const { createChatServer } = require('../../server');

describe('integración Socket.IO: backend y una-lib', () => {
  let server; let io; let port;
  beforeAll((done) => {
    ({ server, io } = createChatServer());
    server.listen(0, () => { port = server.address().port; done(); });
  });
  // io.close también cierra el HTTP server asociado; cerrarlo dos veces produce un error.
  afterAll(() => new Promise((resolve) => io.close(resolve)));

  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      const client = createClient(`http://127.0.0.1:${port}`, { transports: ['websocket'], forceNew: true });
      const timeout = setTimeout(() => { client.close(); reject(new Error('Tiempo de espera de Socket.IO')); }, 3000);
      client.on('connect', () => client.emit('Evento-Mensaje-Server', JSON.stringify({ nombre: 'Prueba', color: '#123456', mensaje: message })));
      client.on('Evento-Mensaje-Server', (reply) => { clearTimeout(timeout); client.close(); resolve(JSON.parse(reply)); });
      client.on('connect_error', reject);
    });
  }

  test('acepta y clasifica una URL de imagen válida', async () => {
    await expect(sendMessage('https://example.com/evidencia.png')).resolves.toMatchObject({ tipo: 'image', mensaje: 'https://example.com/evidencia.png' });
  });
  test('acepta y transforma una URL válida de video', async () => {
    await expect(sendMessage('https://youtu.be/qYwlqx-JLok')).resolves.toMatchObject({ tipo: 'video', mensaje: 'https://www.youtube.com/embed/qYwlqx-JLok' });
  });
  test('no interpreta un script: lo devuelve como texto seguro', async () => {
    await expect(sendMessage('<script>alert(1)</script>')).resolves.toMatchObject({ tipo: 'text', mensaje: '<script>alert(1)</script>' });
  });
});
