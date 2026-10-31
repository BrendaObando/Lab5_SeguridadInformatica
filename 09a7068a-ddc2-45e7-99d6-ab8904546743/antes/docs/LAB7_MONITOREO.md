# Laboratorio 7 Monitoreo de UNA Chat

## Estado y alcance

La Parte 1 usa Render con autorización de la estudiante. El commit de Sentry 573897f fue publicado y se confirmó desplegado. El evento d762e78ffa8b4feaac2dc570838bc54a se recibió en Sentry, issue UNA-CHAT-1, entorno render. Las capturas muestran el mensaje, release y stack trace en server.js:27:47. La ruta temporal se retiró del código después de capturar estas evidencias.

La Parte 2 tiene instrumentación manual y exportadores OTLP HTTP/protobuf para las tres señales. `scripts/verify-lab7-telemetry.js` comprobó el transporte real a un receptor local, la correlación por trace_id y la ausencia del contenido privado. La recepción en Grafana Cloud sigue pendiente de credenciales.

La Parte 3 tiene Dockerfile, Compose y escenario Artillery preparados. Se construyó la imagen antes-chat y se verificaron cuatro mensajes reales dentro del contenedor en http://127.0.0.1:3000. No se ejecuta carga hasta confirmar también la recepción en Grafana.

## Arquitectura

El navegador se conecta por Socket.IO. El evento Evento-Mensaje-Server se procesa con libs/unalib.js y se retransmite a los clientes. El adaptador POST /api/messages utiliza ese mismo procesador y la misma difusión: medir GET / no mediría el procesamiento de mensajes.

El contrato HTTP local está en docs/local-api.openapi.yml. El adaptador requiere UNA_CHAT_LOCAL_API=true; Render siempre lo desactiva. Compose publica el puerto únicamente en 127.0.0.1.

## Logs métricas y trazas

Los logs son eventos individuales, por ejemplo chat.message.processed o http.response. Las métricas agregan solicitudes, errores y duración. Las trazas representan el recorrido de una operación con spans como POST /api/messages y chat.process_message.

Grafana permite consultar y visualizar; Loki almacena logs, Tempo almacena trazas y el backend de métricas compatible con Prometheus/Mimir almacena series. La aplicación local envía las tres señales directamente al gateway OTLP de Grafana Cloud. No se instala Grafana en el equipo.

Los recursos incluyen service.name=una-chat, deployment.environment=local y runtime.kind=node o docker. Los logs contienen trace_id, sin nombre, mensaje, token ni cabecera Authorization. Las rutas HTTP son etiquetas de cardinalidad acotada.

## Configuración local

Usar Node 24 para la instrumentación instalada, cuyos paquetes requieren al menos Node 22.15. Copiar .env.example a .env, archivo ignorado por Git. Para exportar realmente, configurar en ese archivo:

```dotenv
UNA_CHAT_LOCAL_API=true
OTEL_LOCAL_ENABLED=true
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_ENDPOINT=
OTEL_EXPORTER_OTLP_HEADERS=
OTEL_SERVICE_NAME=una-chat
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=local
RUNTIME_KIND=node
```

El endpoint y las cabeceras deben copiarse del stack propio en Grafana Cloud, sección OpenTelemetry. El endpoint base normalmente termina en /otlp. Los exportadores agregan /v1/logs, /v1/metrics y /v1/traces. No poner credenciales en .env.example, comandos registrados ni capturas.

Arrancar desde PowerShell:

```powershell
node --env-file=.env server.js
```

Visitar http://localhost:3000, enviar varios mensajes y generar el fallo local por POST /__lab/local-error. Esa ruta devuelve 500 intencionalmente. Conservar el inicio y fin de la prueba e identificar el intervalo en Grafana. Durante estas pruebas no se necesita SENTRY_DSN local; Sentry y el SDK local no se inicializan simultáneamente para evitar conflictos de proveedores.

## Consultas en Grafana Cloud

En Explore, elegir Loki y usar inicialmente:

```logql
{service_name="una-chat", deployment_environment="local"}
```

Para una traza concreta, filtrar usando el identificador real del log:

```logql
{service_name="una-chat"} |= "TRACE_ID_REAL"
```

Según la normalización del stack, deployment_environment puede estar en metadatos estructurados; en ese caso usar `{service_name="una-chat"} | deployment_environment="local"`. Confirmar los nombres en el explorador de etiquetas antes de obtener capturas.

En Tempo, buscar por TraceQL:

```traceql
{ resource.service.name = "una-chat" && resource.deployment.environment = "local" }
```

En Prometheus/Mimir, comprobar primero los nombres disponibles. Los nombres habituales tras la traducción OTLP son:

```promql
sum(increase(una_chat_http_requests_total{service_name="una-chat"}[5m]))
sum(rate(una_chat_http_requests_total{service_name="una-chat"}[1m]))
sum(increase(una_chat_errors_total{service_name="una-chat"}[5m]))
histogram_quantile(0.50, sum by (le) (rate(una_chat_http_duration_seconds_bucket{service_name="una-chat"}[1m])))
histogram_quantile(0.95, sum by (le) (rate(una_chat_http_duration_seconds_bucket{service_name="una-chat"}[1m])))
```

Los histogramas pueden llegar como histogramas nativos en ciertos stacks; adaptar la consulta al tipo observado. Estas consultas están preparadas, no se presentan como consultas ya ejecutadas. Filtrar runtime_kind=docker y el intervalo de carga cuando esas etiquetas estén disponibles. Para contar solo los mensajes, filtrar http_route="/api/messages".

## Docker

```powershell
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
docker compose logs --since 5m chat
```

Compose carga las variables de .env en el host y pasa únicamente la lista explícita al contenedor. No copia el archivo de secretos a la imagen. La imagen usa node:24-bookworm-slim, npm ci --omit=dev, usuario node y puerto 3000. El origen de telemetría continúa siendo local y runtime.kind cambia a docker.

La prueba funcional muestra una conversación real y el contenedor en ejecución. La evidencia está en docker-functional-verification.json y chat-docker-local.png. Falta confirmar en Grafana una traza con sus spans y un log que comparta trace_id antes de dar por completada esta parte.

## Artillery

El archivo load/artillery.yml apunta exclusivamente a http://127.0.0.1:3000. Contiene duration:60, arrivalRate:5 y una sola solicitud POST /api/messages por usuario, sin pausas ni bucles: 60 x 5 = 300 solicitudes previstas. El cuerpo incluye mensaje, nombre de prueba y color; el adaptador local no requiere autenticación.

Después de confirmar Docker y Grafana:

```powershell
npx artillery run --output evidencias/lab7/artillery-report.json load/artillery.yml
```

Registrar inicio y fin UTC y local, reporte completo, http.requests, http.request_rate, http.codes.*, errores, http.response_time.p50 y p95. La tasa de llegada de usuarios no garantiza por sí sola la tasa real de solicitudes. Las peticiones pendientes pueden prolongar la ejecución después de 60 segundos.

Comparar el total observado con 300 y explicar errores, tiempos de espera o limitaciones del generador según el reporte real. No hay reporte de carga ni resultados de latencia mientras esa ejecución esté pendiente.

## Evidencias pendientes

Sentry: verificar el despliegue de la limpieza y retirar las variables temporales de Render. Grafana: las tres señales del stack real, intervalo, entorno local y correlación. Docker: completar la comprobación de telemetría en Grafana. Artillery: cuenta, ejecución local, reporte y gráficos del mismo intervalo.

## Referencias

- https://grafana.com/docs/grafana-cloud/send-data/otlp/send-data-otlp/
- https://opentelemetry.io/docs/languages/js/
- https://www.artillery.io/docs/reference/test-script
- https://www.artillery.io/docs/reference/reported-metrics
- https://cronitor.io/docs/uptime-monitoring
- https://docs.sentry.io/platforms/javascript/guides/express/
