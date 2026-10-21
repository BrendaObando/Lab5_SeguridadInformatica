# Design

## Context

UNA Chat es una aplicación Socket.IO pequeña: el cliente envía un objeto serializado, el servidor lo normaliza con `libs/unalib.js` y retransmite `nombre`, `color`, `mensaje` y `tipo`. Hoy el cliente compone nodos del DOM de forma segura, pero los mensajes tienen estilos mínimos, las imágenes tienen un máximo fijo de 400 px y los videos usan dimensiones fijas de 560×315 px. Las URL HTTP(S) que no son imagen admitida ni video válido de YouTube terminan indistinguibles de texto ordinario. Véase `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Conservar un único contrato de clasificación de mensajes en el servidor y extenderlo con un tipo explícito para enlace sin vista previa permitida.
- Mejorar la composición semántica y adaptable de los mensajes usando DOM seguro y CSS responsive, sin cambiar el transporte Socket.IO.
- Mantener el contenido no confiable fuera de HTML, `src` e `iframe` salvo las URL previamente validadas.

**Non-Goals:**

- Ampliar la lista de proveedores de video, formatos de imagen o esquemas permitidos.
- Descargar, analizar o almacenar archivos multimedia en el servidor.
- Añadir autenticación, persistencia de mensajes, reacciones o enlaces clicables.

## Decisions

### Clasificar enlaces no admitidos en la normalización compartida

`normalizeMessage` distinguirá una URL HTTP(S) que no satisface las reglas de imagen o YouTube mediante un tipo dedicado (por ejemplo, `unsupported-link`); `validateMessage` lo retransmitirá sin alterar el texto original normalizado. Esto permite que todos los clientes reciban la misma decisión y evita que cada UI vuelva a interpretar URLs.

Alternativa considerada: detectar el enlace solo en el navegador. Se descarta porque un cliente alternativo no recibiría la misma señal y duplicaría las reglas de seguridad.

### Usar nodos DOM y clases semánticas para la tarjeta de mensaje

El cliente creará una estructura de mensaje con elementos para autor, contenido, multimedia y aviso. Las clases CSS controlarán tipografía, espaciado, envoltura de texto, contraste y tamaños fluidos. Imágenes usarán límites relativos al contenedor y `height: auto`; el reproductor mantendrá una proporción mediante CSS sin imponer un ancho fijo.

Alternativa considerada: insertar plantillas HTML interpoladas. Se descarta porque debilita la defensa existente basada en `textContent` frente a inyección.

### Mostrar el aviso sin convertir el enlace en recurso activo

Para `unsupported-link`, la UI mostrará el valor como texto y un mensaje de validación cercano y perceptible. No creará `img`, `iframe` ni enlace navegable. El texto con esquemas no HTTP(S) o marcado seguirá siendo texto normal seguro; el aviso está reservado para URLs HTTP(S) que no tienen una previsualización permitida.

Alternativa considerada: rechazar y omitir el mensaje. Se descarta porque ocultaría la entrada al remitente y a otros participantes, además de no explicar la restricción.

## Risks / Trade-offs

- [Cambiar el valor de `tipo` puede afectar clientes que solo esperan `text`, `image` y `video`] → Mantener el tratamiento seguro por defecto de tipos desconocidos como texto y cubrir el nuevo tipo con pruebas de integración.
- [Recursos remotos pueden no cargar aunque la URL sea válida] → La UI conserva texto alternativo/título y no considera la carga remota como parte de la validación sintáctica.
- [Los avisos pueden aumentar el ruido visual] → Aplicar una jerarquía secundaria al aviso y asociarlo únicamente a enlaces HTTP(S) no permitidos.

## Migration Plan

1. Añadir la clasificación y pruebas unitarias sin alterar las reglas actuales de imagen y YouTube.
2. Adaptar la UI y las pruebas de integración/E2E para el nuevo tipo y los tamaños reducidos.
3. Desplegar junto con el servidor; los clientes que no reconozcan el tipo seguirán mostrando texto mediante su ruta segura por defecto.
4. Si aparece una regresión, revertir los estilos y la clasificación nueva; los mensajes continuarán mostrándose como texto como en la versión actual.
