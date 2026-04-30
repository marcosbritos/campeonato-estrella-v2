# Plan de Implementación: PWA de Gestión de Torneos (Estilo Britos Berón)

Este documento detalla la arquitectura técnica, los cambios en base de datos y el flujo de usuario para transformar "Campeonato Estrella" en una PWA profesional que elimine los cuellos de botella operativos en la carga de datos de los partidos.

## Análisis y Conclusiones Comerciales

El modelo de negocio es excelente. Cobrar un 2% de la recaudación por partido ($4,800 ARS aprox. por partido * 12 partidos = $57,600 ARS por fin de semana por torneo). Si logramos digitalizar y automatizar el proceso sin fallas, escalar a 3 torneos te daría un ingreso recurrente muy atractivo sin esfuerzo operativo manual de tu parte. 

**Mejoras Clave Propuestas para Escalar:**
1. **Multitorneo:** Actualmente la base de datos asume un único torneo. Deberíamos preparar la arquitectura para soportar múltiples torneos de forma nativa sin tener que clonar el código.
2. **Offline-First Parcial:** En las canchas la señal suele ser mala. La PWA debe cargar rápido mediante caché y permitir al árbitro ver las listas pre-cargadas incluso con baja conexión.
3. **Cero Texto Libre:** Para evitar errores humanos (ej. "García" vs "Garcia "), todo debe ser con selectores dinámicos basados en la base de datos pre-cargada.

> [!IMPORTANT]
> ## User Review Required
> Necesito tu confirmación sobre los siguientes puntos antes de comenzar la codificación:
> 1. **Manejo de Jugadores Libres:** Si un jugador es expulsado o se lesiona y lo reemplazan, ¿se modifica la lista de 25 o la lista de 25 queda bloqueada para todo el torneo?
> 2. **Soporte Multitorneo:** ¿Quieres que apliquemos la lógica para que un mismo panel administre los 3 torneos (recomendado), o prefieres tener 3 bases de datos separadas?
> 3. **Modo Offline:** ¿El árbitro debe poder cargar datos sin internet y que se sincronicen cuando recupere la conexión, o asumimos que siempre habrá un mínimo de 3G/4G?

---

## 1. Modificaciones a la Estructura de Datos (Supabase)

Debemos modificar el esquema relacional (`supabase/schema.sql`) para soportar listas de buena fe y dorsales dinámicos.

### Nuevas Tablas y Cambios

- **`players` (Actualizado):**
  - Quitar `shirt_number` fijo.
  - Agregar: `last_name`, `dni`, `dob` (Date of Birth).
  - Mantener restricción de máximo 25 jugadores por equipo.

- **`match_rosters` (Nueva Tabla):**
  - Guarda qué jugador jugó qué partido y con qué número de camiseta.
  - Campos: `id`, `match_id`, `team_id`, `player_id`, `shirt_number`.

- **`matches` (Actualizado):**
  - Agregar campo `observations` (TEXT) para el reporte final del árbitro.

- **`cards` y `goals` (Actualizado):**
  - Se vinculan al `player_id` (y opcionalmente a la entrada del `match_rosters` para asegurar consistencia del dorsal).

---

## 2. Flujo Operativo (User Journey)

### A. Pre-partido (Vista Delegado)
1. El delegado ingresa a `/delegado` con su PIN.
2. Ve su "Lista de Buena Fe" (25 jugadores bloqueados).
3. Selecciona a los titulares y suplentes para la fecha actual, asignándoles un número de camiseta (Dropdown de 1 a 99).
4. El sistema valida que no haya dorsales repetidos.
5. Al guardar, se genera el registro en `match_rosters`.

### B. Post-partido (Vista Árbitro / Administrador)
1. El admin ingresa a la planilla digital del partido.
2. Interfaz en 3 pasos rápidos (Mobile-First):
   - **Paso 1 - Resultado Final:** Carga de goles locales y visitantes.
   - **Paso 2 - Goleadores:** Por cada gol indicado en el Paso 1, aparece un selector. Al abrirlo, muestra la lista de jugadores de ese equipo **con el número de camiseta que se les asignó en el pre-partido**.
   - **Paso 3 - Tarjetas y Sanciones:** Permite agregar Amarillas o Rojas seleccionando al jugador por su número/nombre.
   - **Paso 4 - Observaciones:** Campo de texto libre para reporte del árbitro.
3. Botón **"Finalizar Partido"**.

---

## 3. Automatización y Lógica de Negocio

La automatización es el núcleo del valor que aportas.
Al presionar "Finalizar Partido" (cambia `status` de `live` a `finished`):
1. **Posiciones:** La vista SQL `standings` recalculará instantáneamente puntos, goles y diferencia de goles.
2. **Goleadores:** La tabla pública de goleadores sumará los goles cargados.
3. **Sanciones:** Se actualizará un contador de tarjetas rojas/amarillas por jugador para la fase de Playoffs.
4. **Realtime:** Supabase emitirá un evento que actualizará las pantallas de cualquier espectador que esté viendo la página pública (sin que tengan que recargar).

---

## 4. Identidad Visual y PWA (Estética Britos Berón)

Mantendremos y elevaremos el esquema "Cyan Electric" actual, dándole un toque más premium, oscuro y minimalista.

- **UI Mobile-First:** Elementos grandes, botones "Bottom Sheet" para los menús de selección (en lugar de dropdowns nativos que son incómodos en mobile).
- **Glassmorphism:** Tarjetas translúcidas sobre fondos oscuros (Dark Mode nativo).
- **PWA Config:**
  - Optimizar `manifest.json` con íconos vectoriales y "theme_color" para que la barra del sistema operativo se mimetice con la App.
  - Mejorar el Service Worker (`sw.js`) para cachear recursos estáticos y que la app abra instantáneamente desde el inicio de Android/iOS.
  - Implementar un prompt automático de "Instalar App" para los delegados.

## Plan de Ejecución

1. **Fase 1 (Backend):** Modificar `supabase/schema.sql`, regenerar tipos y migrar la base de datos de desarrollo.
2. **Fase 2 (Delegado):** Construir la interfaz de armado de formación con asignación de dorsales.
3. **Fase 3 (Árbitro):** Construir el flujo de post-partido (Resultado, Goleadores, Tarjetas).
4. **Fase 4 (PWA & Diseño):** Pulido visual (estilo Britos Berón) y configuración estricta de PWA.
