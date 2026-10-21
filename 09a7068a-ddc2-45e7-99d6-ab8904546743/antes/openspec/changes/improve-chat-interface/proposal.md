# Proposal

## Why

La interfaz actual de UNA Chat presenta los mensajes como filas compactas y los recursos multimedia con dimensiones fijas, lo que dificulta la lectura y el consumo en pantallas pequeñas. Además, una URL no admitida se muestra como texto sin indicar al usuario que no fue reconocida como contenido compartible.

## What Changes

- Mejorar la jerarquía visual, el espaciado y el contraste de los mensajes para distinguir con claridad autor, contenido y recursos adjuntos.
- Adaptar la presentación de imágenes y videos para que conserve proporciones, respete el ancho disponible y se pueda visualizar cómodamente en distintos tamaños de pantalla.
- Detectar enlaces HTTP(S) que el chat no permite como imagen ni video de YouTube y comunicar de forma visible que no se pueden previsualizar, sin convertir contenido no confiable en HTML ejecutable.
- Mantener la clasificación existente de imágenes por extensión permitida y videos de YouTube válidos; los enlaces no admitidos seguirán sin incrustarse.

## Capabilities

### New Capabilities

- `chat-message-presentation`: Presentación accesible y adaptable de mensajes de texto, imágenes y videos dentro de UNA Chat.
- `chat-link-validation-feedback`: Retroalimentación visible y segura cuando un enlace HTTP(S) no puede compartirse como recurso multimedia permitido.

### Modified Capabilities

- Ninguna.

## Impact

- Afecta la estructura, estilos y lógica de renderizado en `index.html`.
- Requiere ampliar la normalización de mensajes en `libs/unalib.js` y el evento Socket.IO en `server.js` para transportar el estado de validación correspondiente.
- Requiere actualizar pruebas unitarias, de integración Socket.IO y E2E de Playwright para cubrir la presentación adaptable y el aviso de enlaces no permitidos.
