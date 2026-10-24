const val = require('../libs/unalib');
const assert = require('assert');
describe('una-lib', function () {
  it('valida teléfonos con formato permitido', function () {
    assert.equal(val.is_valid_phone('8297-8547'), true);
    assert.equal(val.is_valid_phone('8297p-8547'), false);
  });
  it('acepta únicamente URLs HTTP(S) con extensión de imagen permitida', function () {
    assert.equal(val.is_valid_url_image('https://example.com/foto.png'), true);
    assert.equal(val.is_valid_url_image('https://example.com/foto.png?size=large'), true);
    assert.equal(val.is_valid_url_image('javascript:alert(1)'), false);
    assert.equal(val.is_valid_url_image('https://example.com/foto.svg'), false);
  });
  it('acepta URLs válidas de YouTube y obtiene el id', function () {
    const url = 'https://www.youtube.com/watch?v=qYwlqx-JLok';
    assert.equal(val.is_valid_yt_video(url), true);
    assert.equal(val.getYTVideoId(url), 'qYwlqx-JLok');
    assert.equal(val.is_valid_yt_video('https://example.com/watch?v=qYwlqx-JLok'), false);
  });
  it('clasifica imágenes y videos para mostrarlos sin HTML del usuario', function () {
    assert.deepEqual(val.normalizeMessage('https://example.com/foto.jpeg'), { type: 'image', value: 'https://example.com/foto.jpeg' });
    assert.deepEqual(val.normalizeMessage('https://youtu.be/qYwlqx-JLok'), { type: 'video', value: 'https://www.youtube.com/embed/qYwlqx-JLok' });
  });
  it('identifica enlaces HTTP(S) no permitidos sin convertirlos en recursos', function () {
    assert.deepEqual(val.normalizeMessage('https://example.com/articulo'), { type: 'unsupported-link', value: 'https://example.com/articulo' });
    assert.deepEqual(val.normalizeMessage('https://example.com/imagen.svg'), { type: 'unsupported-link', value: 'https://example.com/imagen.svg' });
  });
  it('preserva el script como texto y no lo convierte en marcado ejecutable', function () {
    const result = JSON.parse(val.validateMessage(JSON.stringify({ nombre: 'Eva', mensaje: "<script>alert('x')</script>", color: '#abcdef' })));
    assert.equal(result.tipo, 'text'); assert.equal(result.mensaje, "<script>alert('x')</script>");
    assert.deepEqual(val.normalizeMessage('javascript:alert(1)'), { type: 'text', value: 'javascript:alert(1)' });
  });
});
