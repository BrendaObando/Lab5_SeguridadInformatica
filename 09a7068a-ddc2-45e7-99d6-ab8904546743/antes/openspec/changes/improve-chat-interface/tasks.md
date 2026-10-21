# Tasks

## 1. Clasificación segura de enlaces

- [x] 1.1 Extender `normalizeMessage` y `validateMessage` para identificar URLs HTTP(S) que no son imágenes admitidas ni videos válidos de YouTube como `unsupported-link`, conservando el texto normalizado; verificar con `npm test`.
- [x] 1.2 Ampliar `test/test.js` con casos de URL HTTPS no admitida, extensión de imagen no permitida y esquemas no HTTP(S), verificando que los dos primeros reciban el tipo nuevo y que el contenido peligroso siga siendo texto seguro; verificar con `npm test`.
- [x] 1.3 Actualizar las pruebas de integración Socket.IO para confirmar que el tipo `unsupported-link` viaja del servidor al cliente sin alterar las clasificaciones existentes de imagen, video y texto; verificar con `npm run test:integration`.

## 2. Presentación adaptable de mensajes

- [x] 2.1 Reestructurar el renderizado de mensajes en `index.html` con nodos DOM y clases semánticas para autor, contenido, multimedia y aviso, manteniendo `textContent` para valores no confiables; verificar manualmente que un script enviado no se interpreta como HTML.
- [x] 2.2 Aplicar estilos responsive para legibilidad, envoltura de texto, separación de mensajes y contraste, y para que imágenes y reproductores de video se adapten al contenedor sin desbordamiento horizontal; verificar en viewport estrecho del navegador.
- [x] 2.3 Renderizar el tipo `unsupported-link` con el texto original y un aviso visible de que no puede previsualizarse, sin crear `img`, `iframe` ni enlace activo; verificar con una URL HTTPS no permitida en la interfaz.
- [x] 2.4 Actualizar las pruebas E2E de Playwright para cubrir mensajes de texto largos, imágenes y videos en viewport estrecho, además del aviso y ausencia de incrustación para enlaces no permitidos; verificar con `npm run test:e2e`.

## 3. Verificación integrada

- [x] 3.1 Ejecutar `npm test`, `npm run test:integration` y `npm run test:e2e`, y corregir cualquier regresión en la clasificación segura, visualización multimedia o aviso de enlaces no permitidos.
