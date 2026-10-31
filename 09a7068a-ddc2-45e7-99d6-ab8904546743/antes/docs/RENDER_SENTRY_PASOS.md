# Prueba de Sentry desde Render

## Prueba realizada

El evento d762e78ffa8b4feaac2dc570838bc54a se generó desde Render el 31 de octubre de 2026 y se confirmó en el proyecto una-chat, issue UNA-CHAT-1, entorno render. Las capturas sentry-error-render-confirmado.png y sentry-stacktrace-render.png documentan el mensaje y server.js:27:47. La ruta temporal ya se retiró del código local; los pasos de habilitación siguientes son el registro histórico de la prueba, no deben repetirse.

## Preparación ya automatizada

`node scripts/sentry-render-test.js --prepare` genera un token aleatorio de 64 caracteres hexadecimales en `.env.sentry-test`. Git ignora este archivo. Si ya existe, el comando lo conserva; nunca muestra el valor en la terminal.

## Pasos en Render

1. Abrir el servicio Lab5_SeguridadInformatica y entrar a Environment, luego Edit.
2. Conservar SENTRY_DSN con su valor actual y NODE_VERSION con su configuración actual.
3. Añadir SENTRY_ENVIRONMENT con valor render.
4. Añadir SENTRY_TEST_ENABLED con valor true.
5. Abrir el archivo local .env.sentry-test y copiar únicamente el valor a la derecha de SENTRY_TEST_TOKEN=. Pegarlo en la variable SENTRY_TEST_TOKEN de Render. No copiar el comentario ni el nombre de la variable como parte del valor.
6. Guardar y desplegar las variables. Esperar el despliegue correcto y el estado Live. No añadir variables OTEL ni credenciales de Grafana a este servicio.
7. Avisar que el despliegue está listo. No compartir el token ni capturas que lo muestren.

## Ejecución que hará el asistente

`node scripts/sentry-render-test.js --send` comprueba la disponibilidad, envía una sola petición protegida a la URL pública conocida y guarda estado, hora y eventId en evidencias/lab7/sentry-render-event.json. No transmite el token a otros hosts ni sigue redirecciones. El HTTP 500 es intencional; el chat debe continuar respondiendo 200 después.

## Comprobación en Sentry

En el proyecto una-chat, abrir Issues o Feed y buscar LAB7_ERROR_CONTROLADO_UNA_CHAT, seleccionando el entorno render y el intervalo de la prueba. Abrir el evento y correlacionar su ID con el registro local. Capturar mensaje, stack trace, entorno y hora sin credenciales. La respuesta del SDK no sustituye la verificación del panel.

## Retirar la prueba temporal

Después de capturar el evento, cambiar SENTRY_TEST_ENABLED a false y retirar SENTRY_TEST_TOKEN de Render. Conservar SENTRY_DSN y SENTRY_ENVIRONMENT. Guardar y desplegar. El asistente verificará el cierre con `node scripts/sentry-render-test.js --verify-disabled`, que debe obtener 404 de la ruta temporal y 200 de la página. Finalmente retirará el bloque temporal del código y actualizará las pruebas antes de publicar la limpieza.
