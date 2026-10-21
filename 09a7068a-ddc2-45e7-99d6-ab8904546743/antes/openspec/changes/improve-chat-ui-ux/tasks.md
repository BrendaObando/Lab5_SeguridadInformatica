# Tasks

## 1. Estructura y estilo de la conversación

- [x] 1.1 Reorganizar el documento cliente en regiones semánticas para cabecera, historial y compositor; verificar manualmente que autor, mensaje y acción de envío se identifican sin ambigüedad.
- [x] 1.2 Aplicar el sistema visual de tarjetas, tipografía, espaciado y contraste a los mensajes; verificar en el navegador que un mensaje de texto conserva autor y contenido legibles.
- [x] 1.3 Incorporar estados visuales para imagen, video y enlace no compatible sin cambiar su lógica de validación; verificar con las pruebas E2E que imagen y video se previsualizan y que el enlace no compatible no crea una previsualización.

## 2. Accesibilidad y vista adaptable

- [x] 2.1 Asociar etiquetas accesibles a los controles, añadir un foco visible y conservar el orden natural de teclado; verificar navegando con Tab hasta todos los campos y el botón de envío.
- [x] 2.2 Añadir reglas responsivas para que el compositor se reorganice correctamente en pantallas pequeñas; verificar en una vista de 375 px que no hay solapamiento y que el botón se puede usar.
- [x] 2.3 Ajustar o ampliar las pruebas E2E para los estados de interfaz y la vista reducida; verificar ejecutando `npm run test:e2e`.

## 3. Verificación integrada

- [x] 3.1 Ejecutar las pruebas unitarias e integración después del cambio visual; verificar con `npm test` y `npm run test:integration` que la clasificación segura no presenta regresiones.
- [x] 3.2 Realizar una comprobación manual de texto, imagen, video, enlace no compatible e intento de script; verificar que el flujo conserva el bloqueo de script y no muestra alertas.

## Workflow follow-up

- Aplicar el cambio con `$openspec-apply-change` cuando se apruebe esta propuesta.
- Archivar el cambio después de implementar y verificar todas las tareas.
