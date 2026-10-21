# Spec Delta

## Purpose

Define una presentación clara, accesible y adaptable para los mensajes y recursos multimedia compartidos en UNA Chat.

## ADDED Requirements

### Requirement: Mensajes legibles y estructurados
El cliente SHALL presentar cada mensaje con autor y contenido visualmente diferenciados, texto que se ajuste al ancho disponible y separación suficiente entre mensajes, sin requerir desplazamiento horizontal en vistas reducidas.

#### Scenario: Mensaje de texto en una vista reducida
- **WHEN** un usuario recibe un mensaje de texto largo en una pantalla angosta
- **THEN** el autor y el contenido permanecen legibles dentro del ancho de la conversación sin desbordamiento horizontal

#### Scenario: Diferenciación de mensajes consecutivos
- **WHEN** el cliente recibe varios mensajes consecutivos
- **THEN** cada mensaje conserva una separación visual y un autor distinguible del contenido

### Requirement: Previsualización adaptable de imágenes
El cliente SHALL mostrar una imagen validada dentro de su mensaje conservando su proporción y limitando su tamaño al espacio disponible, con texto alternativo que identifique el recurso compartido.

#### Scenario: Imagen en pantalla estrecha
- **WHEN** el cliente recibe una URL de imagen permitida en una pantalla más estrecha que la imagen
- **THEN** la imagen se ajusta al ancho disponible, permanece visible y no causa desplazamiento horizontal

### Requirement: Previsualización adaptable de videos
El cliente SHALL mostrar un video de YouTube validado en un reproductor con proporción visual consistente, ancho adaptable y un título accesible que identifique el video compartido.

#### Scenario: Video en pantalla estrecha
- **WHEN** el cliente recibe un video válido de YouTube en una pantalla estrecha
- **THEN** el reproductor se ajusta al ancho disponible sin desbordamiento horizontal y sigue siendo visible
