# Spec Delta

## Purpose

Informa de forma clara y segura cuando UNA Chat no puede generar una vista previa para un enlace compartido.

## ADDED Requirements

### Requirement: Detección de enlaces sin vista previa permitida
El sistema SHALL identificar una URL HTTP(S) como enlace no permitido para vista previa cuando no cumpla las reglas vigentes para una imagen admitida ni para un video válido de YouTube.

#### Scenario: Enlace HTTPS de un sitio no admitido
- **WHEN** un usuario envía una URL HTTPS que no es una imagen admitida ni un video válido de YouTube
- **THEN** el mensaje se clasifica como enlace sin vista previa permitida

#### Scenario: Imagen con extensión no admitida
- **WHEN** un usuario envía una URL HTTP(S) de un recurso con una extensión de imagen no admitida
- **THEN** el mensaje se clasifica como enlace sin vista previa permitida

### Requirement: Aviso visible de enlace no permitido
El cliente SHALL mostrar junto al mensaje clasificado un aviso visible que indique que el enlace no está permitido para vista previa y SHALL conservar el valor enviado como contenido no incrustado.

#### Scenario: Aviso al recibir un enlace no permitido
- **WHEN** el cliente recibe un mensaje clasificado como enlace sin vista previa permitida
- **THEN** muestra un aviso de validación visible y no crea un elemento de imagen ni de reproductor de video

### Requirement: Manejo seguro de contenido no permitido
El cliente SHALL insertar el valor de enlaces no permitidos y contenido con esquemas no HTTP(S) como texto, sin interpretarlo como marcado HTML ejecutable.

#### Scenario: Contenido con script o esquema peligroso
- **WHEN** un usuario envía texto que contiene marcado de script o una URL con un esquema no HTTP(S)
- **THEN** el cliente lo presenta como texto y no ejecuta código ni incrusta un recurso
