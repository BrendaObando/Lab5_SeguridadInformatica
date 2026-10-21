# Design

## Context

La interfaz actual se sirve desde un único documento HTML y recibe mensajes mediante Socket.IO. La validación y clasificación de enlaces se realizan antes de renderizar: el cliente debe continuar mostrando texto con APIs seguras y solo crear elementos multimedia cuando el mensaje ya fue identificado como permitido. La motivación del cambio está en `proposal.md`; los comportamientos requeridos se definen en `specs/chat-interface-experience/spec.md`.

## Goals / Non-Goals

**Goals:**

- Organizar el chat como una superficie clara: cabecera informativa, historial escaneable y compositor fácilmente localizable.
- Comunicar con estilo consistente los estados de mensaje de texto, imagen, video y enlace no compatible.
- Mejorar la experiencia en móvil, teclado y lectores de pantalla sin cambiar el flujo de envío actual.

**Non-Goals:**

- No rediseñar el protocolo de mensajes ni añadir autenticación, persistencia o perfiles de usuario.
- No permitir nuevas fuentes de contenido ni modificar las reglas de seguridad de URLs y scripts.
- No incorporar un framework visual ni una dependencia adicional para el cambio.

## Decisions

### Mantener HTML semántico y CSS nativo

La mejora se concentrará en la estructura semántica existente y sus estilos: regiones identificables, etiquetas explícitas, estados de foco y reglas responsivas. Esto conserva el proyecto pequeño y permite comprobar la interfaz directamente en las pruebas E2E. Se descarta incorporar un framework de componentes porque añade complejidad y dependencias para una única vista.

### Modelar los mensajes como tarjetas de contenido con variaciones

Cada mensaje conservará autor, contenido y, cuando corresponda, el estado de previsualización. Las variaciones visuales serán para texto, multimedia validada y enlace no compatible; compartirán una base visual para no ocultar la procedencia del mensaje. Se descarta separar el contenido por pantallas, pues el historial debe conservar el contexto de conversación.

### Preservar el límite entre presentación y validación

La capa de interfaz consumirá el tipo de contenido que ya entrega la aplicación y creará elementos de imagen o video solo para tipos permitidos. Para los enlaces no compatibles mostrará texto e indicación de estado. Se descarta validar nuevamente o usar inserción HTML dinámica, ya que duplicaría reglas y elevaría el riesgo de XSS.

### Diseñar primero para el compositor visible

En pantallas grandes el compositor puede usar una distribución compacta; en anchos reducidos se apilarán sus campos y el botón ocupará un espacio fácil de pulsar. Los estilos de foco no se eliminarán y el orden de tabulación seguirá el orden visual. Se descarta depender exclusivamente de efectos hover porque no sirven para teclado ni pantallas táctiles.

## Risks / Trade-offs

- [Un estilo más rico puede restar contraste] → Usar una paleta de alto contraste y comprobar texto, foco y mensajes de estado sobre cada fondo.
- [Las previsualizaciones grandes pueden dominar el historial] → Limitar su ancho y altura y mantenerlas dentro de la tarjeta del mensaje.
- [Una refactorización del marcado puede romper los selectores de pruebas] → Actualizar las pruebas E2E para verificar comportamientos y roles visibles, no detalles decorativos frágiles.
- [Cambios de presentación podrían afectar la evidencia del laboratorio] → Conservar los flujos de imagen, video y bloqueo de scripts antes de actualizar las capturas.

## Migration Plan

1. Aplicar la estructura y estilos de interfaz en el cliente, sin alterar el contrato de Socket.IO.
2. Ejecutar las pruebas unitarias, de integración y E2E existentes; ampliar las E2E para los estados y la vista reducida.
3. Probar manualmente los flujos de texto, imagen, video, enlace no compatible e intento de script.
4. Si surge una regresión, revertir el cambio del documento cliente; no hay datos almacenados ni migraciones de servidor involucradas.
