# Arquitectura y Estado Final: PWA Campeonato de la Estrella

Este documento resume la arquitectura técnica actual del proyecto, el esquema de la base de datos, y provee una revisión crítica con recomendaciones para el futuro crecimiento (especialmente si se quiere transformar en un producto multi-torneo "Estilo Britos Berón").

## 1. Stack Tecnológico
- **Frontend / Framework:** Next.js 14 (App Router)
- **Despliegue:** Netlify (Static Export - `output: 'export'`)
- **Estilos:** CSS Modules y Tailwind-like utility classes customizadas (`globals.css`). Diseño "Glassmorphism" oscuro.
- **Base de Datos & Backend:** Supabase (PostgreSQL + REST API nativa).
- **PWA:** Archivo `manifest.json` y `sw.js` (Service Worker) para permitir instalación y acceso offline básico.
- **Hosting de Medios:** Las imágenes de equipos (escudos) y fotos del predio deben alojarse en un CDN o en el Storage de Supabase (actualmente usa URLs externas o locales).

## 2. Estructura de la Base de Datos (Supabase)

La base de datos relacional está optimizada para lectura rápida.

### Tablas Principales:
*   `tournaments`: Almacena información del torneo (ID, nombre, estado). Actualmente hay un ID *hardcodeado* (`11111111...`) que representa al "Campeonato de la Estrella".
*   `teams`: Equipos participantes. Relacionados al torneo. Campos: `name`, `zone` (A, B, C), `logo_url`.
*   `matches`: Partidos del fixture.
    *   Campos clave: `home_team_id`, `away_team_id`, `home_score`, `away_score`, `status` (pending, live, finished), `round` (fecha).
*   `players`: Jugadores registrados, vinculados a un `team_id`.
*   `goals`: Registro individual de goles. Vincula un `match_id`, un `player_id` y un `team_id`.
*   `cards`: Registro de tarjetas (amarillas/rojas). Vincula partido y jugador. Para el Fair Play, las rojas descuentan puntos extra.
*   `match_events`: (Opcional/Histórico) Registro minuto a minuto de lo que sucede en la cancha.

### Vistas SQL (Views):
Para evitar cálculos pesados en el frontend, se crearon vistas en Supabase que pre-calculan las tablas:
*   `standings_view`: Calcula puntos, partidos jugados, ganados, empatados, perdidos y diferencia de gol basándose en los resultados de `matches`.
*   `fair_play_view`: Calcula los puntos de Fair Play basándose en las tarjetas registradas en `cards`.

## 3. Flujo de Datos y Construcción (Build)

Al usar `output: 'export'` en Next.js, la aplicación se compila a archivos HTML/JS estáticos.
*   **Lectura (Usuarios):** Los usuarios interactúan con páginas estáticas hidratadas por React. Los datos se obtienen en el cliente (`useEffect` + `supabase-js`) directamente de la API de Supabase.
*   **Escritura (Admin):** El panel de administración (`/panel-admin`) permite actualizar resultados y estado de partidos. Al guardar, se impacta en Supabase.
*   **Realtime:** La tabla de posiciones y goles utiliza los WebSockets de Supabase (`supabase.channel`) para actualizar la pantalla al instante si hay cambios en la base de datos, ideal para la vista "EN VIVO" en la cancha.

---

## 4. Crítica Técnica y Oportunidades de Mejora

El proyecto actual es un "MVP" (Minimum Viable Product) sólido y visualmente muy atractivo para un solo torneo. Sin embargo, para escalarlo como un producto SaaS (Software as a Service) o marca blanca para otros predios, se deben resolver las siguientes deudas técnicas:

### A. Gestión de Múltiples Torneos (Multi-tenant)
**Estado Actual:** El ID del torneo está *hardcodeado* en el frontend (`const TOURNAMENT_ID = ...`). 
**Crítica:** Si Britos Berón consigue otro cliente (ej. "Torneo El Relámpago"), habría que duplicar todo el código fuente y crear otro repositorio en GitHub.
**Solución:** Implementar en Next.js la lectura del dominio o subdominio, o usar una ruta dinámica desde el inicio, para que una sola base de código pueda cargar el torneo A o el torneo B dinámicamente desde la base de datos.

### B. Panel de Administración y Seguridad
**Estado Actual:** El panel de administración está protegido por un PIN básico (frontend-only). Cualquiera que descubra el PIN o analice el código JS podría teóricamente interactuar con las rutas de Supabase si se expone la "anon key" sin políticas de seguridad de nivel de fila (RLS).
**Crítica:** Inseguro para producción a largo plazo o para abrirlo a que los propios veedores carguen datos.
**Solución:** 
1. Implementar **Supabase Auth** (email/password o Magic Link) para los administradores.
2. Activar **Row Level Security (RLS)** en PostgreSQL para asegurar que las tablas solo puedan ser modificadas (INSERT/UPDATE/DELETE) por usuarios autenticados con rol de administrador.

### C. Manejo de Imágenes
**Estado Actual:** Los escudos de los equipos (`logo_url`) apuntan a URLs aleatorias.
**Crítica:** Si esas URLs externas se caen, los logos desaparecen.
**Solución:** Crear un "Bucket" en Supabase Storage llamado `team-logos`. Permitir desde el panel de admin subir la imagen del escudo y guardar esa URL segura en la tabla `teams`.

### D. Rendimiento y "Vibraciones" en Mobile
**Estado Actual:** En dispositivos móviles, especialmente iOS (Safari), el comportamiento del "Pull to refresh" o el redimensionamiento automático de la barra de navegación del navegador causa "saltos" o vibraciones en layouts que usan `100vh`.
**Solución:** Cambiar el uso de `100vh` por `100dvh` (Dynamic Viewport Height) y ajustar el `overscroll-behavior` en el CSS global para estabilizar la experiencia nativa.

### E. Static Export vs Server Side Rendering (SSR)
**Estado Actual:** Netlify está usando Static Export. Por eso tuvimos problemas con la ruta dinámica `/equipo/[id]` y la pasamos a query params (`/equipo?id=...`).
**Crítica:** Para SEO y para compartir links específicos en WhatsApp (para que salga el escudo del equipo en la previsualización), los query params no son detectados por el bot de WhatsApp/Facebook.
**Solución:** Mover el despliegue a **Vercel** o habilitar el modo "Next.js SSR" en Netlify (usando `@netlify/plugin-nextjs`). Esto permite renderizar rutas dinámicas en el servidor, devolviendo metadatos únicos por equipo y un ruteo mucho más limpio.
