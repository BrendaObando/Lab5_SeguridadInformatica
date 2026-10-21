// Utilidades de validación y normalización para UNA Chat.

const IMAGE_EXTENSIONS = /\.(?:avif|bmp|gif|jpe?g|png|webp)$/i;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

function parseHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch (_) { return null; }
}

function getYouTubeVideoId(value) {
  const url = parseHttpUrl(value);
  if (!url || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
  let id = null;
  if (url.hostname.toLowerCase() === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0];
  else if (url.pathname === '/watch') id = url.searchParams.get('v');
  else { const parts = url.pathname.split('/').filter(Boolean); if (['embed', 'v', 'shorts'].includes(parts[0])) id = parts[1]; }
  return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : null;
}

function isValidImageUrl(value) {
  const url = parseHttpUrl(value);
  return Boolean(url && IMAGE_EXTENSIONS.test(url.pathname));
}

function isValidYouTubeUrl(value) { return Boolean(getYouTubeVideoId(value)); }

function normalizeMessage(message) {
  if (typeof message !== 'string') return { type: 'text', value: '' };
  const value = message.trim();
  if (isValidImageUrl(value)) return { type: 'image', value };
  const videoId = getYouTubeVideoId(value);
  if (videoId) return { type: 'video', value: `https://www.youtube.com/embed/${videoId}` };
  if (parseHttpUrl(value)) return { type: 'unsupported-link', value };
  // El cliente muestra este valor mediante textContent; nunca se interpreta como HTML.
  return { type: 'text', value };
}

function validateMessage(rawMessage) {
  let message;
  try { message = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage; } catch (_) { message = { mensaje: '' }; }
  const normalized = normalizeMessage(message && message.mensaje);
  return JSON.stringify({
    nombre: typeof message?.nombre === 'string' ? message.nombre.slice(0, 80) : 'Anónimo',
    color: /^#[0-9A-Fa-f]{6}$/.test(message?.color || '') ? message.color : '#000000',
    mensaje: normalized.value,
    tipo: normalized.type,
  });
}

module.exports = {
  is_valid_phone: (phone) => typeof phone === 'string' && /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(phone),
  is_valid_url_image: isValidImageUrl,
  is_valid_yt_video: isValidYouTubeUrl,
  getYTVideoId: getYouTubeVideoId,
  normalizeMessage,
  validateMessage,
};
