# Deploy en Vercel + Supabase — Hoy mismo

## PASO 1 — Crear proyecto Supabase (5 min)

1. Ir a https://supabase.com → New Project
2. Nombre: `campeonato-estrella` | Región: South America (São Paulo)
3. Una vez creado → SQL Editor → pegar y ejecutar `supabase/schema.sql`
4. Luego ejecutar `supabase/seed.sql` (carga los 24 equipos reales)
5. Copiar de Settings > API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## PASO 2 — Deploy en Vercel (3 min)

```bash
# En la carpeta del proyecto
npm install
```

1. Ir a https://vercel.com → New Project → Import desde GitHub (o drag & drop)
2. En Variables de Entorno agregar:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_ADMIN_PIN=estrella2024
   ```
3. Deploy → en 2 min tenés la URL (ej: `campeonato-estrella.vercel.app`)

## PASO 3 — Instalar la PWA en el celular

### Android:
- Abrir la URL en Chrome
- Menú → "Agregar a pantalla de inicio"

### iPhone:
- Abrir en Safari
- Compartir → "Agregar a pantalla de inicio"

## PASO 4 — Cargar fixture

Desde el SQL Editor de Supabase, insertar los partidos con fechas reales:

```sql
-- Ejemplo: partido Zona A
INSERT INTO matches (zone, round, match_date, home_team_id, away_team_id)
SELECT 'A', 1, '2025-11-03 10:00:00-03',
  (SELECT id FROM teams WHERE name = 'ATLETICO LUGANO'),
  (SELECT id FROM teams WHERE name = 'INTER');
```

## PINs de los equipos

| Zona | Equipo | PIN |
|------|--------|-----|
| A | ATLETICO LUGANO | 1001 |
| A | INTER | 1002 |
| A | SECTOR 32 | 1003 |
| A | PA LA BIRRA | 1004 |
| A | TORNADO | 1005 |
| A | JARDIN AMERICA | 1006 |
| A | ALMIRANTE | 1007 |
| A | TERCER TIEMPO | 1008 |
| B | VICIOS FC | 2001 |
| B | CALLE 10 | 2002 |
| B | SABUESOS | 2003 |
| B | FORESTAL | 2004 |
| B | PROGRESO | 2005 |
| B | MANCHESTER BOYS | 2006 |
| B | SUDAKAS FC | 2007 |
| B | LA RESAKA FC | 2008 |
| C | FALSO FUTBOL | 3001 |
| C | CASITA NUEVA F.C | 3002 |
| C | ROSARIO DE LA FRONTERA | 3003 |
| C | D.C LOS PUMAS | 3004 |
| C | 420 F.C | 3005 |
| C | GUEMES SFI | 3006 |
| C | LOS PUMAS 2.0 | 3007 |
| C | DEPORTIVO ENTUSIASMO | 3008 |

PIN del árbitro (admin): `estrella2024`

## Cambiar PIN de árbitro

En Vercel → Settings → Environment Variables → cambiar `NEXT_PUBLIC_ADMIN_PIN`

## Flujo en el día del partido

1. **Delegado** abre `/delegado` → ingresa su PIN → carga plantel (15 jugadores + números)
2. **Árbitro** abre `/arbitro` → ingresa PIN admin → selecciona partido → marca goles/tarjetas en tiempo real
3. Al cerrar el partido → la tabla y goleadores se actualizan automáticamente para todos
4. Todos los espectadores ven la tabla en `/` en tiempo real (Supabase Realtime)
