# Documentación Maestra: Plataforma de Torneos (SaaS Boutique)

**Cliente Inicial / Piloto:** Campeonato de la Estrella
**Desarrollado por:** Agencia Britos Berón
**Fecha de Última Actualización:** Mayo 2026

---

## 1. Visión del Producto y Modelo de Negocio

El proyecto nace como la piedra angular del modelo **"SaaS Boutique"** de la agencia Britos Berón. El objetivo no es vender código, sino vender un **servicio recurrente (suscripción mensual/por temporada)** a organizadores de ligas amateur.

### Propuesta de Valor Estratégica:
* **Percepción Artesanal:** El cliente siente que se le entrega una aplicación premium, desarrollada a medida, exclusiva para su marca. Esto justifica una suscripción de alto valor.
* **Control del Contacto:** Al no entregar el código fuente ni depender de plataformas de terceros genéricas, la agencia retiene al cliente. Cualquier cambio, nuevo torneo o expansión pasa exclusivamente por Britos Berón.
* **Escalabilidad Oculta:** Aunque el cliente lo percibe a medida, el código base ("Plantilla Maestra") está diseñado para ser clonado o escalado a múltiples torneos con mínimo esfuerzo técnico.

---

## 2. Arquitectura de Software

La aplicación está construida sobre un stack moderno, enfocado en alto rendimiento móvil, SEO y reactividad en tiempo real.

* **Frontend Framework:** [Next.js 14](https://nextjs.org/) utilizando el nuevo App Router (`/src/app`).
* **Lenguaje:** TypeScript (garantizando tipado estricto y reduciendo errores en producción).
* **Estilos e Interfaz:** Vanilla CSS nativo (`globals.css`). Diseño "Glassmorphism" premium, animaciones fluidas (60fps) y sistema de temas automáticos (Dark/Light Mode).
* **Backend y Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL).
* **Hosting y Despliegue:** [Vercel](https://vercel.com/) (Frontend) conectado directamente al repositorio de GitHub para Integración y Despliegue Continuo (CI/CD).

### Razones Técnicas de la Elección:
Se eligió Vercel sobre Netlify para aprovechar el **Server-Side Rendering (SSR)** nativo de Next.js. Esto permite que las rutas dinámicas generen metadatos (Open Graph) en el servidor. Gracias a esto, cuando un usuario comparte el enlace de un equipo en WhatsApp, el sistema carga el escudo y nombre específico de ese equipo, generando un altísimo impacto de marketing viral.

---

## 3. Circuito de Datos y Modelo Multitorneo

La base de datos relacional (Supabase) está arquitectada para soportar **escalabilidad horizontal**. Si el cliente mañana solicita agregar 2 o 3 torneos más en la misma plataforma, la estructura ya está preparada.

### Entidades Core (Base de Datos):
1. **`tournaments`**: Almacena los distintos torneos. *(Toda la app actual se filtra bajo una constante `TOURNAMENT_ID`)*.
2. **`teams`**: Equipos. Poseen una clave foránea `tournament_id` y a qué `zone` pertenecen.
3. **`players`**: Jugadores vinculados a su equipo.
4. **`matches`**: Partidos. Tienen relación con equipo local (`home_team_id`) y visitante (`away_team_id`), puntajes, estado (`pending`, `live`, `finished`) y ronda/fecha.
5. **`goals` & `cards`**: Entidades atómicas para registrar el minuto exacto, jugador y tipo de evento.

### Flujo de Datos:
1. **Lectura Frontend:** Los componentes cliente (`TeamDetailClient.tsx`, `FixtureScroll.tsx`) llaman a funciones de abstracción en `src/lib/supabase.ts`.
2. **Cálculo Automático:** Las tablas de posiciones, diferencia de goles (GF/GC) y ranking de Fair Play se calculan automáticamente en base al historial de partidos finalizados y tarjetas ingresadas. No hay necesidad de calcular tablas manualmente.
3. **Tiempo Real (Realtime):** Supabase Channels está suscrito a las tablas `matches`, `goals` y `cards`. Cuando el administrador actualiza un partido "EN VIVO", las pantallas de los usuarios se actualizan al instante sin necesidad de recargar la página.

---

## 4. Funcionalidades Clave de la Plataforma

* **PWA (Progressive Web App):** La aplicación incluye un `manifest.json` y un Service Worker. Permite a los usuarios "Instalar" la web como una app nativa en sus celulares iOS y Android (con icono de la liga en su pantalla de inicio).
* **Rutas Dinámicas Nativas (`/equipo/[id]`):** Sistema de fichas individuales por equipo que consolida el historial, estadísticas de partidos y goleadores del plantel.
* **Diseño Fluido y Adaptable:** Componentes de Interfaz de Usuario (UI) diseñados con el paradigma *Mobile-First*, optimizados para manejo con una sola mano (Bottom Navigation Bar) y prevención de rebotes excesivos de scroll (`overscroll-behavior-y: auto`).

---

## 5. Guía de Traspaso (Handoff) y Mantenimiento

Si otro desarrollador debe asumir el control o crear un nuevo clon para otro cliente, debe seguir esta guía:

### Árbol de Directorios Principal:
* `/src/app`: Rutas de la aplicación (Posiciones, Fair Play, Equipos).
* `/src/app/globals.css`: **Único archivo de verdad absoluta para el diseño.** Aquí se manejan los colores flúor, el modo claro/oscuro y las animaciones.
* `/src/components`: Módulos reutilizables (Tarjetas de partido, Carrusel, Navegación inferior).
* `/src/lib/supabase.ts`: Lógica de conexión a la base de datos.
* `.env.local`: Archivo crítico (no subido a GitHub) que debe contener `NEXT_PUBLIC_SUPABASE_URL` y la clave pública (Anon Key).

### Pasos para un Nuevo Cliente (Marca Blanca):
1. **Clonar Repositorio:** Copiar el código base.
2. **Nuevo Proyecto en Supabase:** Ejecutar los scripts SQL de creación de tablas.
3. **Ajuste de Identidad Visual:** 
   * Reemplazar `/public/logo.png`, `/public/bg.jpg` y favicon.
   * Cambiar nombres en `/src/app/layout.tsx` (Metadatos SEO).
   * Ajustar la paleta de colores `--ce-cyan` en `globals.css` al color principal del nuevo cliente.
4. **Despliegue:** Conectar el nuevo repo a un nuevo proyecto en Vercel.

---
*Este documento es un artefacto vivo. Todo cambio estructural grande en la arquitectura de datos o modelo de negocio debe reflejarse aquí.*
