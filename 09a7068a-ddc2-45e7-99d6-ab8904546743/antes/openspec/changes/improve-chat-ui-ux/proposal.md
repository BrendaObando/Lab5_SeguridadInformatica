## Why

La aplicación de chat ya valida los contenidos enviados, pero su presentación puede ser más clara y agradable para que las personas identifiquen fácilmente los mensajes, el área para escribir y el estado de los enlaces multimedia. Una interfaz más coherente y responsiva reduce confusiones al probar imágenes, videos y enlaces no permitidos.

## What Changes

- Renovar la experiencia visual del chat con una jerarquía clara entre encabezado, conversación y área de composición.
- Mejorar la legibilidad y diferenciación de los mensajes, incluyendo los mensajes con imágenes, videos o enlaces no compatibles.
- Añadir estados de interfaz comprensibles, controles accesibles y adaptación para pantallas pequeñas.
- Conservar el comportamiento de seguridad existente: el texto se renderiza de forma segura y los enlaces solo se muestran como contenido multimedia cuando pasan la validación.

## Capabilities

### New Capabilities

- `chat-interface-experience`: Presenta una interfaz de conversación intuitiva, responsiva y accesible, con retroalimentación visual clara para texto, multimedia permitida y enlaces no compatibles.

### Modified Capabilities

Ninguna.

## Impact

- Archivos previstos: `index.html` y, si es necesario para metadatos de presentación, los recursos cliente ya existentes.
- No se modifican el protocolo de Socket.IO, las reglas de validación del servidor ni las dependencias.
- Se ampliarán las pruebas E2E de la interfaz para comprobar la disposición responsiva, los indicadores visuales y que se preserve la visualización segura de multimedia.
