# Mapa Colaborativo de la Feria de Sevilla 2026

## Visión del proyecto

Una web colaborativa donde el mapa del **Real de la Feria de Sevilla** está dividido en una cuadrícula de celdas pequeñas, y cualquier persona puede "reclamar" un trozo subiendo una foto. Al final de la semana de feria, el mapa será un mosaico de fotos reales de la gente que vivió la feria 2026: sus casetas, sus trajes, sus rebujitos, sus farolillos.

Inspirado en **r/place** y **wplace.live**, pero hiperlocal y con fecha de caducidad: la semana de feria.

## Por qué tiene sentido este enfoque

- **Escala pequeña y manejable:** el Real son ~24 hectáreas, permite celdas muy detalladas (~5-10m por celda).
- **Urgencia natural:** la feria dura una semana, crea un momento concreto para participar.
- **Contexto perfecto:** la gente ya está subiendo fotos de la feria a sus redes, esto les da un sitio colectivo donde dejarlas.
- **Viralidad:** "reclamé el trozo donde está mi caseta" es infinitamente más compartible que "reclamé una celda en un barrio random".
- **Técnicamente factible:** menos celdas, menos área, menos usuarios simultáneos que un proyecto a escala ciudad.

## Alcance geográfico

El **Real de la Feria de Sevilla**, en el barrio de Los Remedios.

### Bounding box

- Esquina suroeste: `37.3670, -6.0110`
- Esquina noreste: `37.3725, -5.9895`

Rectángulo apaisado, más ancho que alto. Ampliado al oeste para incluir la Calle del Infierno (zona de atracciones), y al este para cubrir el Puente de las Delicias y la zona de Carlos y José. El puente forma parte del recorrido natural de muchos feriantes, y justo al otro lado del Guadalquivir está el puesto de gofres **Carlos y José**, un clásico de la mañana de feria al que la gente va a desayunar antes o después de entrar al Real. Que ese trozo también sea reclamable tiene mucho sentido: es parte de la experiencia feriante, no solo el recinto oficial.

### Zonas a incluir dentro del área jugable

- El Real de la Feria con sus calles (Pascual Márquez, Gitanillo de Triana, Antonio Bienvenida, Costillares, Juan Belmonte...).
- La Portada principal.
- La Calle del Infierno (zona de atracciones).
- El **Puente de las Delicias** y su entorno inmediato — acceso tradicional al Real.
- La zona al este del puente, donde se encuentra el puesto de gofres **Carlos y José**: punto de encuentro clásico y parte indisociable del ritual de la feria.

Fuera de la bounding box el mapa se ve pero no es interactuable.

## Sistema de celdas

- **Tamaño inicial:** 10×10 metros por celda (~2.400 celdas totales).
  - Ajustable: 5×5m si queremos más detalle, 20×20m si queremos menos celdas.
- **Estados:**
  - Vacía: transparente, borde sutil en albero al pasar el dedo/ratón.
  - Reclamada: la imagen del dueño como fondo a ~70% opacidad.
- **Interacción:**
  - Tap/click en celda vacía → bottom sheet para reclamarla.
  - Tap/click en celda reclamada → panel con la imagen en grande y el nombre del dueño.

### Detalle chulo: nombres de calles

Cuando una celda esté sobre una calle del Real, al reclamarla mostrar algo como:

> *"Has reclamado un trozo de calle Pascual Márquez"*

Mucho más evocador que coordenadas. Implementación simple: hardcodear las coordenadas aproximadas de cada calle principal del Real y comprobar en cuál cae la celda.

## Reglas de propiedad

- Un usuario puede reclamar **varias celdas** (sin límite en el MVP).
- Las celdas son **permanentes** durante la feria (no se roban, no caducan).
- Requiere **login** para reclamar.
- El dueño puede cambiar la imagen de su celda, no cederla.

## Estética y tono

Minimalista con **esencia sevillana y de feria**. Limpio, moderno, con personalidad sin caer en cliché.

### Paleta de colores

- **Albero** (`#D4A55A`) — tierra de la Maestranza y del propio Real. Color de acento principal.
- **Azulejo** (`#1E5F8E`) — azul sevillano para acentos secundarios.
- **Rojo feria** (`#A63D2A`) — rojo terroso de los farolillos y la portada, para detalles puntuales.
- **Blanco cal** (`#FAF7F2`) — fondos principales.
- **Negro suave** (`#1C1C1C`) — texto.
- **Gris claro** (`#E8E4DE`) — bordes y separadores.

### Tipografía

- Sans-serif moderna para UI: **Inter** o **DM Sans**.
- Serif con carácter para título/logo: **Fraunces** o **DM Serif Display**.

### Mapa base

- **CartoDB Positron** (gratis, sin registro). Look limpio y claro, muy parecido a Google Maps light.
- **No usar Google Maps** (términos de uso).

### Elementos de diseño

- Animaciones sutiles: hover, fade-in, transiciones suaves.
- Esquinas redondeadas 6-8px, no más.
- Sombras muy difusas, nunca marcadas.
- Iconografía minimalista (Lucide icons).
- Un guiño sutil a la feria: quizá un farolillo estilizado muy minimalista en el logo, o un patrón de lunares casi invisible en algún separador. Con mucho cuidado, sin pasarse.

## Mobile-first (prioridad absoluta)

**La mayoría de usuarios entrarán desde el móvil, estando en la feria.** El diseño se piensa primero para móvil.

### Requisitos móvil

- Mapa a pantalla completa, sin bordes ni headers que roben espacio.
- Header flotante translúcido arriba (logo + avatar/login).
- Controles de zoom del mapa ocultos, usar gestos nativos pinch-zoom.
- **Bottom sheet** (panel desde abajo) para acciones, no modales centrados.
- Botones con área táctil mínima **44×44px**.
- Feedback táctil inmediato al tap.
- Selector de imagen nativo que permita **cámara en vivo** (clave: la gente va a hacer la foto en el momento).
- Evitar hover states, usar `:active`.
- Probar en iPhone SE (375px) mínimo.

### Escritorio

Escala bien a pantallas grandes sin huecos raros. Máximo 480px de ancho en modales/paneles.

## Funcionalidad compartible

Al reclamar una celda, permitir al usuario **generar una imagen compartible** (tipo Instagram Story) con:

- La foto que subió.
- El nombre de la calle del Real donde cayó.
- Texto tipo "Yo estuve en la Feria de Sevilla 2026 🏮".
- URL de la web al pie.

Implementación simple con canvas o html-to-image. Esto es lo que va a hacer que la web se comparta sola.

## Contador público

En el header o esquina visible:

> *"X sevillanos han dejado su huella en la Feria 2026"*

Actualizado en tiempo real. Genera FOMO y sensación de comunidad.

## Stack técnico

- **Frontend:** React + Vite
- **Mapa:** Leaflet + react-leaflet con CartoDB Positron
- **Estilos:** CSS moderno con CSS variables para la paleta
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Hosting:** Vercel con deploy automático desde GitHub
- **Lenguaje:** JavaScript (no TypeScript)

## Esquema de datos (Supabase)

Tabla `celdas`:
- `id` (int, primary key)
- `lat_min`, `lat_max`, `lng_min`, `lng_max` (float)
- `owner_id` (uuid, ref auth.users)
- `owner_name` (text)
- `image_url` (text)
- `calle_real` (text, nullable — nombre de la calle del Real si aplica)
- `claimed_at` (timestamp)

Storage bucket: `celda-images` (lectura pública, escritura solo autenticados).

## Consideraciones técnicas

- **Rendimiento del grid:** con ~2.400 celdas, renderizar solo las visibles en el viewport usando canvas renderer de Leaflet.
- **Tiempo real:** Supabase Realtime para que los usuarios vean nuevas reclamaciones sin recargar. **Si no da tiempo a implementarlo antes de la feria, se sacrifica:** basta con refrescar al recargar la página.
- **Subida de imágenes:** máximo 2MB, tipos jpg/png/webp, comprimir en cliente antes de subir.
- **Pico de tráfico:** si funciona bien, puede haber cientos de usuarios simultáneos el sábado. Supabase free tier debería aguantar, pero probar con varios dispositivos antes del viernes.
- **Moderación:** suficiente con que pueda borrar manualmente desde el panel de Supabase. Añadir un botón pequeño de "reportar" en celdas ajenas.

## Plan por fases (MVP para llegar a la feria)

Scope agresivamente recortado para llegar a tiempo. Primero lo crítico, luego lo deseable.

### FASE 1 — Mapa base (1-2 sesiones)
Mapa centrado en el Real con Leaflet + CartoDB Positron. Rectángulo marcando la bounding box. Paleta en CSS variables. Header flotante minimalista. Responsive mobile-first desde el día 1.

### FASE 2 — Cuadrícula (1-2 sesiones)
Grid de celdas de 10×10m dentro de la bounding box. Tap/click muestra coordenadas en popup. Optimización de viewport visible.

### FASE 3 — Supabase conectado (1 sesión)
Tabla `celdas` creada. Leer celdas reclamadas de BD y pintarlas diferenciadas. Bucket de Storage configurado. Políticas RLS básicas.

### FASE 4 — Login (1 sesión)
Magic link de Supabase. Avatar/nombre en el header. Logout.

### FASE 5 — Reclamar con imagen (2 sesiones)
Flujo completo: tap en celda vacía → bottom sheet → selector de imagen (con cámara en móvil) → subida a Storage → guardar en BD → mapa se actualiza. Mostrar nombre de calle del Real.

### FASE 6 — Deploy a producción (1 sesión)
Subir a GitHub. Conectar Vercel. URL bonita. Probar desde varios dispositivos reales. Meta tags Open Graph para que se vea bien al compartir en WhatsApp/redes.

### ↑ HASTA AQUÍ EL MVP DE FERIA ↑

### FASE 7 — Compartible (si hay tiempo)
Generar imagen tipo Story al reclamar celda. Botón "Compartir".

### FASE 8 — Tiempo real (si hay tiempo)
Supabase Realtime para ver reclamaciones de otros al instante.

### FASE 9 — Pulido (si hay tiempo)
Contador de participantes, animaciones, favicon con farolillo, botón de reportar, página "Acerca de".

## Lo que NO quiero en el MVP

- No TypeScript.
- No frameworks pesados (Next.js, etc.).
- No leaderboard ni gamificación en el MVP.
- No chat ni comentarios.
- No moderación automática (borrado manual por mi parte es suficiente).
- No iconografía folklórica cliché (toreros, flamencas...). La esencia se transmite con paleta y sutileza.
- No Google Maps.
- No dependencias innecesarias.

## Sobre mí y cómo trabajar

Soy principiante. No soy desarrollador profesional. **Tengo poco tiempo antes de la feria.** Por favor:

- **Explica antes de implementar** cuando sea una decisión importante.
- **Avísame si algo puede salir caro** (excederme del plan gratis).
- **No añadas funcionalidad que no te haya pedido.** Mantén todo lo más simple posible.
- **Prioriza llegar a la feria** con algo que funcione sobre hacer algo perfecto.
- **Comenta el código** para que pueda entenderlo al releerlo.
- **Prueba siempre en móvil** (DevTools responsive mode al menos).
- Entre dos formas de hacer algo, **elige la más sencilla**, no la más "profesional".
- Si detectas que una fase va a llevar demasiado tiempo, **avísame y propón recortar scope**.

## Criterio de éxito del MVP

El viernes antes de la feria, desde mi móvil, puedo:

1. Abrir la URL pública.
2. Ver el mapa del Real con la cuadrícula.
3. Hacer login con email.
4. Tocar una celda vacía, hacer una foto con la cámara y reclamarla.
5. Ver mi foto en el mapa y compartir la URL con amigos.
6. Que un amigo abra la URL desde su móvil, haga lo mismo, y yo vea su foto al recargar.

Si eso funciona, es un éxito. Todo lo demás es bonus.

## Referencias útiles

- **wplace.live** — concepto similar a escala mundial.
- **r/place** — https://en.wikipedia.org/wiki/R/place
- **Leaflet docs** — https://leafletjs.com/reference.html
- **react-leaflet docs** — https://react-leaflet.js.org/
- **CartoDB Positron** — https://carto.com/help/building-maps/basemap-list/
- **Supabase docs** — https://supabase.com/docs

## Nombre del proyecto y tono de voz

**Nombre:** MiCachoDeFeria
**Tagline:** "Tu foto, tu cacho, tu feria."

### Tono de voz

Sevillano relajado con gracia, sin caer en caricatura. Directo, cariñoso, 
callejero. Ejemplos:
- "Entra" en vez de "Iniciar sesión"
- "¡Este cacho es tuyo!" en vez de "Celda reclamada"
- "Enséñanos tu feria" en vez de "Sube una imagen"
- "Ya hay 342 cachos pillados" como contador
- "Presume de cacho" en botón de compartir

Todos los textos de la interfaz deben seguir este tono. Nunca usar lenguaje 
corporativo frío ("procesando", "aceptar términos", "operación completada").