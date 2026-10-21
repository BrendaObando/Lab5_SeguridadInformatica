# Spec Delta

## Purpose

Proporcionar una conversación clara y agradable que ayude a las personas a enviar, interpretar y verificar de forma segura texto y contenido multimedia.

## ADDED Requirements

### Requirement: Jerarquía de conversación legible
La interfaz SHALL separar visualmente el encabezado, el historial de mensajes y el área de composición, manteniendo los mensajes legibles y agrupados como unidades de conversación.

#### Scenario: Visualización de un mensaje de texto
- **WHEN** una persona envía o recibe un mensaje de texto válido
- **THEN** el mensaje se presenta en una tarjeta legible dentro del historial sin ocultar el autor ni el contenido

#### Scenario: Área de composición disponible
- **WHEN** una persona revisa el historial de mensajes
- **THEN** puede identificar sin ambigüedad los campos de nombre, mensaje y la acción para enviarlo

### Requirement: Retroalimentación para contenido de enlaces
La interfaz SHALL diferenciar el contenido multimedia permitido de un enlace no compatible, preservando el texto original y evitando una previsualización para este último.

#### Scenario: Imagen o video permitido
- **WHEN** un mensaje contiene una URL validada de imagen o video
- **THEN** el historial presenta la previsualización correspondiente junto con la identificación del mensaje

#### Scenario: Enlace no compatible
- **WHEN** un mensaje contiene una URL HTTP o HTTPS que no es multimedia permitido
- **THEN** la interfaz muestra el texto original y una indicación clara de que el enlace no se previsualiza

### Requirement: Interacción accesible y responsiva
La interfaz SHALL conservar un flujo utilizable con teclado, foco visible y etiquetas asociadas a los controles, tanto en pantallas amplias como en pantallas pequeñas.

#### Scenario: Navegación por teclado
- **WHEN** una persona navega hasta los campos y el botón de envío mediante teclado
- **THEN** cada control tiene una etiqueta accesible y un indicador de foco perceptible

#### Scenario: Vista en pantalla pequeña
- **WHEN** el ancho disponible es reducido
- **THEN** los controles de composición se reorganizan sin superponerse ni dejar inaccesible la acción de envío
