# CLAUDE.md — Tiro a Puerta Challenge: Mundial 2026

> Este archivo es leído automáticamente por Claude Code al abrir el proyecto. Contiene el contexto esencial que Claude Code necesita para trabajar de forma consistente y útil. Mantener actualizado.

---

## Qué es este proyecto

**Tiro a Puerta Challenge: Mundial 2026** (nombre tentativo) es una plataforma web de quiniela tipo "survivor pool" ambientada en la Copa Mundial de la FIFA 2026.

**Mecánica en una frase:** cada día con partidos, los usuarios eligen UN solo jugador; si ese jugador registra al menos un tiro a puerta, sobreviven al día. No pueden repetir jugadores.

**Estado del proyecto:** en fase de setup / desarrollo inicial. Inicio desde cero. Deadline duro: 11 de junio de 2026 (inicio del Mundial).

---

## Documentos de referencia (LEER ANTES DE TRABAJAR)

Estos documentos son la **fuente de verdad** del proyecto. Claude Code debe consultarlos antes de tomar decisiones importantes y NO inventar comportamiento que los contradiga.

- **`docs/game-rules.md`** — Reglas completas del juego. Mecánica, definiciones, casos borde, criterios de desempate. Ante cualquier duda sobre cómo debe comportarse el juego, esta es la referencia inapelable.
- **`docs/database-schema.md`** — Schema de la base de datos (Postgres/Supabase). Tablas, constraints, índices, RLS. Cualquier cambio al schema debe actualizarse en este documento en la misma PR.
- **`AGENTS.md`** (raíz del proyecto) — Guía oficial de Next.js 15 para agentes de código. Incluye patrones actualizados, APIs correctas y mejores prácticas del framework. Claude Code debe respetar estas guías al escribir código de Next.js.

Si Claude Code va a implementar algo que toca las reglas del juego o el schema, debe leer los documentos relevantes PRIMERO y citar qué sección está aplicando. Para código de Next.js, AGENTS.md es la referencia autoritativa.

---

## Stack técnico

- **Frontend/full-stack:** Next.js 15 con App Router + TypeScript
- **React Compiler:** activado (optimizaciones automáticas de memoization)
- **UI:** Tailwind CSS + shadcn/ui
- **Base de datos:** Supabase (Postgres + Auth + Realtime + Storage)
- **Autenticación:** Supabase Auth (email+password, Google OAuth, Apple OAuth)
- **Emails transaccionales:** Resend
- **Cron jobs:** Vercel Cron Jobs
- **Monitoreo de errores:** Sentry
- **Analytics:** Vercel Analytics
- **Deploy:** Vercel Pro ✅ — `tiroapuerta.mx` (dominio propio, crons activos)
- **Supabase:** Plan Pro ✅ — Custom Domain `auth.tiroapuerta.mx` (Google OAuth muestra dominio propio)
- **Control de versiones:** GitHub con PRs obligatorias a `main` (main protegido)

### Restricción sobre el stack

**No agregar librerías nuevas sin consultar al usuario.** Si Claude Code piensa que necesita una librería que no está en `package.json`, debe proponerla y explicar por qué antes de instalarla.

### Nota sobre React Compiler

React Compiler está activado en este proyecto. Aplica optimizaciones automáticas (equivalentes a `useMemo`, `useCallback`, `React.memo`) en tiempo de build. Esto es bueno para performance y reduce boilerplate.

**Si aparecen bugs raros de rendering** (componentes que no re-renderizan cuando deberían, o actualizaciones de estado que no se reflejan), considerar si pueden estar relacionados al compiler. Para descartarlo, se puede desactivar temporalmente en `next.config.ts` y verificar si el bug persiste. Si el bug es causado por el compiler, reportar el comportamiento y resolver con patrón alternativo compatible.

---

## Estructura de carpetas

```
/
├── CLAUDE.md               # Este archivo: contexto general del proyecto
├── AGENTS.md               # Guía de Next.js 15 para agentes (provisto por Next.js)
├── app/                    # Next.js App Router
│   ├── (auth)/             # Rutas de autenticación (login, signup)
│   ├── (game)/             # Rutas del juego (dashboard, pick, leaderboard)
│   ├── api/                # API routes (incluyendo cron jobs)
│   └── layout.tsx
├── components/             # Componentes React reutilizables
│   ├── ui/                 # Componentes shadcn/ui
│   └── game/               # Componentes específicos del juego
├── lib/                    # Lógica de negocio y utilidades
│   ├── supabase/           # Clientes de Supabase (browser, server)
│   ├── game/               # Lógica del juego (evaluación de picks, etc.)
│   ├── email/              # Templates y envío de emails (Resend)
│   └── utils/              # Utilidades generales
├── docs/                   # Documentación del proyecto
│   ├── game-rules.md
│   └── database-schema.md
├── supabase/               # Migraciones y config de Supabase
│   └── migrations/
├── tests/                  # Tests críticos
│   └── game/               # Tests de lógica del juego
└── public/                 # Assets estáticos
```

Al momento de crear este CLAUDE.md, el proyecto acaba de inicializarse con `create-next-app`. Algunas de las carpetas de arriba (`components/`, `lib/`, `docs/`, `supabase/`, `tests/`) se crean conforme sean necesarias. La estructura es una guía inicial; Claude Code puede sugerir cambios si hay una razón concreta, pero debe proponerlo antes de reestructurar.

---

## Perfil del usuario (quien habla con Claude Code)

**Nivel técnico:** principiante. Está aprendiendo mientras construye el proyecto.

**Implicaciones de trabajo para Claude Code:**

1. **Explicar lo que se está haciendo.** No solo entregar código; explicar qué hace y por qué.
2. **Comentarios generosos en el código.** Especialmente en lógica no obvia.
3. **Proponer antes de decidir.** Cuando haya varias formas de hacer algo, explicar las opciones y recomendar una.
4. **Corregir malas prácticas.** Si el usuario pide algo que es mala práctica o inseguro, explicarlo y ofrecer alternativa. No solo obedecer.
5. **Explicar cada librería nueva.** Antes de instalar algo, decir qué es, para qué sirve, y si hay alternativas.
6. **Preguntar ante decisiones importantes.** Arquitectura, estructura de datos, flujos de usuario, seguridad. No asumir.
7. **Avanzar solo en tareas rutinarias.** Boilerplate, fixes pequeños, ajustes de estilo no requieren consulta.
8. **Paciencia con preguntas básicas.** Es parte del proceso de aprendizaje del usuario.

---

## Idioma y convenciones

**Código:** inglés en todo (variables, funciones, clases, archivos, commits).

**Documentación y comentarios:** el usuario escribe en español, pero todo el código y docstrings del proyecto van en inglés para consistencia con el estándar de la industria.

**Conversación con el usuario:** en español, tono profesional pero cercano (tuteo).

### Naming conventions

- **Archivos y carpetas:** `kebab-case` (ej: `user-picks.ts`, `game-rules.tsx`).
- **Componentes React:** `PascalCase` (ej: `PickSelector`, `Leaderboard`).
- **Variables y funciones:** `camelCase` (ej: `getUserPick`, `isUserAlive`).
- **Constantes:** `SCREAMING_SNAKE_CASE` (ej: `PICK_DEADLINE_BUFFER_MINUTES`).
- **Tablas y columnas de DB:** `snake_case` (ej: `user_picks`, `match_day_id`). Ya documentado en `database-schema.md`.
- **Tipos e interfaces TypeScript:** `PascalCase` (ej: `UserPick`, `MatchDay`).

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add pick selection page
fix: correct deadline calculation for matches in extra time
docs: update game rules with edge case for suspended matches
refactor: extract pick evaluation logic to lib/game/evaluate-pick.ts
test: add unit tests for tiebreaker logic
```

Tipos permitidos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`.

### Pull Requests

- **Todo cambio va por PR**, ni siquiera cambios triviales se hacen directo en `main`.
- Descripción del PR debe incluir: qué cambia, por qué, y si toca reglas del juego o schema, referencia específica al documento relevante.
- Siempre revisar la propia PR antes de mergear (checklist mental: ¿tests pasan? ¿docs actualizados? ¿no hay console.log olvidados?).

---

## Testing

**Estrategia:** tests críticos solamente durante MVP. No tests exhaustivos en todo.

**Tests obligatorios (no-negociables):**

- Lógica de evaluación de picks (`lib/game/evaluate-pick.ts` o similar).
- Lógica de supervivencia/eliminación.
- Cálculo de desempate (goles acumulados).
- Validación de deadlines (no permitir picks fuera de ventana).
- Validación de "no repetir jugador".
- Manejo de casos borde: partido suspendido, partido cancelado, jugador que no jugó.

**Tests opcionales pero recomendados:**

- Componentes UI críticos (selector de pick, leaderboard).
- Integración con Supabase Auth.

**Framework de tests:** Vitest (compatible con Next.js 15, rápido, moderno). Para tests de integración con Supabase: usar una instancia de test de Supabase o mocks.

---

## Reglas importantes (NO negociables)

Estas reglas son fundamentales. Claude Code debe respetarlas sin excepción:

1. **Las reglas del juego son inapelables.** Si hay duda sobre mecánica, consultar `docs/game-rules.md`. NO inventar comportamiento. Si el documento no cubre un caso, preguntar al usuario.

2. **Schema y documentación sincronizados.** Cualquier cambio al schema de DB debe reflejarse en `docs/database-schema.md` en la misma PR. Si no se actualiza el doc, el cambio no está completo.

3. **Validación en backend, siempre.** La DB tiene constraints (unique picks, deadlines); respétalos. El frontend puede validar para UX, pero la autoridad final es el backend. Nunca asumir que el frontend "ya validó".

4. **Row Level Security (RLS) activado siempre.** En Supabase, ninguna tabla con datos de usuarios debe tener RLS desactivado en producción. Si hay dudas, revisar `database-schema.md` sección 6.

5. **No guardar secretos en el código.** Variables sensibles (API keys, tokens) van en `.env.local` (no commiteado) y en variables de entorno de Vercel. `.env.example` se mantiene en el repo con nombres de variables pero sin valores.

6. **Zona horaria oficial = CDMX.** Todos los cálculos de "día de pick" y deadlines se hacen en `America/Mexico_City`. Se almacena en UTC, se muestra en local del usuario. Ver `game-rules.md` sección 6.

7. **No modificar datos históricos.** Una vez que un pick está `is_locked = TRUE`, no se modifica salvo por apelación humana aprobada (ver `admin_appeals` en schema). `pick_history` es append-only.

8. **Transacciones para operaciones críticas.** Crear un pick, evaluar resultados de un día, etc. deben ser transaccionales. Una falla parcial corrompe estado.

---

## Decisiones pendientes

El proyecto tiene decisiones abiertas que todavía no están resueltas. Si Claude Code necesita que estas decisiones estén tomadas para avanzar, debe preguntar al usuario:

- ~~**Modelo económico y premios.**~~ Resuelto: $1,000 MXN entrada, $150,000 MXN premio, Top 5 con premios.
- ~~**Criterios de desempate secundarios.**~~ Resuelto: tiros totales acumulados.
- ~~**Diseño visual y branding.**~~ Resuelto: Dirección 3 implementada.
- ~~**T&C y aviso de privacidad.**~~ Resuelto: página `/terms` con 21 secciones + aviso de privacidad LFPDPPP.
- **Estructura legal.** Operan como personas físicas (Elías Hale, Daniel Occelli, Víctor Bensimon). Sin estructura SEGOB (friends & family). Pendiente: emails `privacidad@tiroapuerta.mx` y `contacto@tiroapuerta.mx` referenciados en T&C.

---

## Comandos útiles

```bash
# Desarrollo local
npm run dev

# Tests
npm run test

# Build de producción
npm run build

# Seeds de Premier League (correr en este orden)
npm run seed:pl:teams      # 20 equipos → tabla teams
npm run seed:pl:players    # planteles → tabla players (requiere teams)
npm run seed:pl:matches    # fixture → tablas match_days + matches (requiere teams)

# Invocar los workers manualmente (con npm run dev activo)
curl http://localhost:3000/api/cron/sync-live-matches   # sincroniza stats en vivo
curl http://localhost:3000/api/cron/evaluate-picks      # lockea picks y evalúa resultados

# ⚠️ En local los crons NO corren solos — hay que invocarlos a mano.
# Durante una prueba en vivo: correr sync-live-matches cada ~60s mientras el partido está activo,
# luego correr evaluate-picks una vez que el partido esté finished.
```

### Reset manual de usuario de prueba (solo para testing)

⚠️ Fix manual exclusivo para pruebas. No existe en la app ni aplica a usuarios reales.

**Regla clave:** `evaluate-picks` solo procesa días con `is_processed = FALSE`. Si un día ya fue procesado, el cron lo ignora — los picks de ese día no vuelven a evaluarse aunque se limpien en la DB.

#### Opción A — Forzar "survived" directamente (recomendada)

Usar cuando el jugador elegido genuinamente no tiró (Hudson-Odoi, Bruno Fernandes, etc.) y queremos que el usuario siga vivo para pruebas. No requiere correr el cron después.

```sql
-- Revive al usuario (ajusta days_survived y total_goals_accumulated según el estado real)
UPDATE user_status SET
  is_alive                   = TRUE,
  eliminated_on_match_day_id = NULL,
  elimination_reason         = NULL
WHERE user_id = (SELECT id FROM users WHERE username = 'elias_test');

-- Fuerza "survived" en el pick del día (reemplaza la fecha)
UPDATE user_picks SET
  result                = 'survived',
  shots_on_target_count = 1,
  goals_scored          = 0,
  processed_at          = NOW(),
  is_locked             = TRUE
WHERE user_id = (SELECT id FROM users WHERE username = 'elias_test')
  AND match_day_id = (SELECT id FROM match_days WHERE match_date = 'YYYY-MM-DD');

-- El día ya tiene is_processed = TRUE — déjalo así para que el cron no lo retoque.
```

#### Opción B — Re-evaluar el día desde cero

Usar cuando queremos que `evaluate-picks` procese el día de nuevo (ej: cambiamos el pick a un jugador que sí tiró).

```sql
-- Revive al usuario
UPDATE user_status SET
  is_alive                   = TRUE,
  eliminated_on_match_day_id = NULL,
  elimination_reason         = NULL
WHERE user_id = (SELECT id FROM users WHERE username = 'elias_test');

-- Limpia el resultado del pick del día (reemplaza la fecha)
UPDATE user_picks SET
  result                = NULL,
  shots_on_target_count = NULL,
  goals_scored          = NULL,
  processed_at          = NULL,
  is_locked             = FALSE
WHERE user_id = (SELECT id FROM users WHERE username = 'elias_test')
  AND match_day_id = (SELECT id FROM match_days WHERE match_date = 'YYYY-MM-DD');

-- ⚠️ OBLIGATORIO: desmarcar el día o evaluate-picks lo saltará
UPDATE match_days
SET is_processed = FALSE
WHERE match_date = 'YYYY-MM-DD';
```

Después correr el cron:

```bash
curl http://localhost:3000/api/cron/evaluate-picks
```

### Comportamiento validado: jugador no convocado

Si el jugador elegido no tiene fila en `player_match_stats` para su partido (no convocado, no en banca, no jugó), el evaluador lo trata como `void_did_not_play` con `elimination_reason = player_did_not_play`. **El usuario queda eliminado.** Esto es correcto según `game-rules.md §4.2 E3` y §7.5. Validado el 27 de abril con C. Hudson-Odoi (Nottingham Forest, no convocado vs Sunderland).

### Notas sobre los scripts de seed

- Los seeds de PL usan `group_letter = 'X'` como placeholder (campo obligatorio para el Mundial).
- `seed-pl-matches.ts` tiene una constante `COMPETITION_START_DATE` que filtra desde qué fecha seedear. Actualmente `'2026-04-22'` (inicio de pruebas con PL).
- El script borra y re-crea `pick_history`, `user_picks`, `player_match_stats`, `matches` y `match_days` antes de insertar. **No correr en producción con datos reales.**
- Scripts utilitarios de prueba en `scripts/` con prefijo `_` o nombre descriptivo (`insert-test-picks.ts`, `_query-db.ts`). Son desechables, no se usan en producción.

---

## Cosas que Claude Code NO debe hacer

- ~~No hacer commits directamente a `main`. Siempre PR.~~ *(El usuario trabaja solo — push directo a `main` es aceptable. Pendiente desactivar branch protection en GitHub settings.)*
- No instalar librerías sin consultar.
- No modificar `docs/game-rules.md` ni `docs/database-schema.md` sin confirmación explícita del usuario.
- No desactivar RLS en Supabase.
- No hardcodear datos de prueba en código de producción (usar fixtures de tests o seed scripts).
- No usar `any` en TypeScript salvo en casos excepcionales justificados. Preferir tipos explícitos o `unknown`.
- No ignorar errores silenciosamente (`try { } catch {}` vacío es inaceptable).
- No generar código que contradiga las reglas del juego sin consultar.

---

## Cómo Claude Code debería arrancar cada sesión

Al abrir el proyecto, Claude Code idealmente:

1. Lee este CLAUDE.md.
2. Si la tarea toca reglas del juego, lee también `docs/game-rules.md`.
3. Si la tarea toca base de datos, lee también `docs/database-schema.md`.
4. Si hay dudas sobre alcance o enfoque de la tarea, pregunta antes de avanzar.
5. Ejecuta la tarea explicando qué hace y por qué.

---

## Historial de versiones

- **v1.0 (abril 2026):** versión inicial del CLAUDE.md. Stack y convenciones definidos. Proyecto en fase de arranque.
- **v1.1 (abril 2026):** agregado AGENTS.md a la lista de documentos de referencia; añadida sección sobre React Compiler (activado en setup inicial); pequeño ajuste a la estructura de carpetas.
- **v1.2 (abril 2026):** integración API-Football completada (cliente, tipos, seeds PL, worker de sync); comandos útiles actualizados; decisión de proveedor de datos removida de pendientes (ya resuelta: API-Football); nota importante sobre zona horaria CDMX.
- **v1.3 (abril 2026):** prueba en vivo con Premier League superada el 22 de abril — worker sincroniza `player_match_stats` en tiempo real (Haaland: 1 tiro + 1 gol confirmados en DB). Pipeline API-Football → Supabase 100% funcional.
- **v1.4 (abril 2026):** loop completo del juego verificado en vivo. Cron `evaluate-picks` implementado: lock de picks, evaluación de resultados (survived/eliminated/void_*), actualización de `user_status`. Fix al trigger `validate_pick_timing`. elias_test sobrevivió, El_Conde eliminado — prueba 100% exitosa.
- **v1.5 (abril 2026):** sistema de picks completo (tarea 5). Página `/pick` con navegación por día, picks por adelantado (hasta 3 días), tarjetas de partido desplegables, filtro por posición, countdown de deadline, panel de confirmación sticky (mobile-first), jugadores quemados con 🚫. Dos RLS fixes (SECURITY DEFINER en `log_pick_history`, FOR DELETE explícita en `user_picks`). Fix en `evaluate-picks`: no infla stats de usuarios eliminados con pre-picks futuros.
- **v1.6 (abril 2026):** mecánica central completa. `/my-picks` (privado): historial de picks con badges de estado, stats post-evaluación, jugadores quemados. `/leaderboard` (público sin auth): tabla ordenada por vivos → goles → días, fila propia resaltada. Nav funcional con tab bar y highlight activo (`NavLinks` client component). Fix: `/pick` muestra nav de días aunque hoy no tenga partidos. Fix: `/my-picks` agregado a `PROTECTED_ROUTES` (bug pre-existente). Pendiente en leaderboard: "pick de hoy" por usuario post-deadline (§10.1).
- **v1.7 (abril 2026):** tracker en vivo del pick (tarea 6.6). Componente `LiveMatchStats` en `/pick` y `/dashboard`: marcador, badge EN VIVO parpadeante, tiros a puerta, goles, minutos jugados, indicador de supervivencia ✅/⚠️ (visible aunque el jugador no haya sido convocado). Fix dashboard: query de match day por fecha en lugar de por ventana de picks (antes desaparecía durante el partido).
- **v1.8 (abril 2026):** validación de caso borde — jugador no convocado (sin fila en `player_match_stats`) resulta en eliminación correcta (`void_did_not_play` / `player_did_not_play`). Confirmado el 27 de abril con C. Hudson-Odoi. Aclaración importante documentada: en local, `evaluate-picks` debe invocarse manualmente después del partido; sin esa llamada el pick queda pendiente indefinidamente.
- **v1.9 (abril 2026):** minuto real del partido en el tracker en vivo. Columna `match_minute INTEGER` agregada a `matches` (migración `20260427000000`). Worker `sync-live-matches` escribe `fixture.status.elapsed` en cada sync; `LiveMatchStats` lo lee directo de DB. Eliminada la función `getApproxMinute` del cliente.
- **v2.0 (abril 2026):** documentación del comportamiento de `is_processed` en resets de prueba. Snippet de reset expandido a dos opciones: Opción A (forzar `survived` directo, sin re-evaluar — para jugadores que genuinamente no tiraron) y Opción B (limpiar pick + desmarcar día + re-correr cron). Tarea 8 iniciada: diseño visual mobile-first con Claude Design en progreso.
- **v2.1 (abril 2026):** diseño Login D implementado desde bundle de Claude Design. Sistema de diseño de marca establecido: fuentes, paleta CSS vars, `TPMark` SVG, keyframes globales.
- **v2.2 (abril 2026):** dashboard rediseñado con los 4 escenarios del juego. Nav inferior fijo con iconos SVG (`nav-links.tsx`). Game layout simplificado a shell oscuro + bottom nav. `DashboardPickCard` (Client Component) maneja countdown (urgente) y polling de stats en vivo (60s). `LogoutButton` restyled para dark mode. Animación `tpUrgentPulse` añadida a globals.css. Sistema de diseño de marca establecido: fuentes (Bebas Neue, Archivo, Archivo Narrow, JetBrains Mono) añadidas a `app/layout.tsx` como CSS variables; paleta y keyframes globales en `globals.css`; componente `TPMark` (balón Telstar SVG, Dirección 3) en `components/brand/tp-mark.tsx` — reutilizable en todas las pantallas. Login page completamente rediseñada con la identidad visual aprobada. Flujo de exportación Claude Design → bundle tar → implementación en Next.js establecido y funcional.
- **v2.3 (abril 2026):** `/pick` rediseñado (tarea 8). Bundle Claude Design Pick importado. `pick-day-nav.tsx` rediseñado: header oscuro con Bebas Neue y flechas cuadradas. `pick-match-card.tsx` reescrito: cards oscuras por partido (`#11162A`), badge EN VIVO parpadeante con minuto real, score en vivo, countdown inline con colores, 2 columnas de jugadores con position badges POR/DEF/MED/DEL (colores propios), player row con estados: selected (verde), burned (tachado), locked (candado). Tipo `MatchData` expandido con `match_minute`, `home_score`, `away_score`. `pick-client.tsx` rediseñado: `PickConfirmedCard` (planeado o bloqueado + `LiveMatchStats` integrado), position filter chips estilo píldoras con punto de color, confirm panel sticky oscuro con CTA signature (gradiente azul + borde gold). `pick/page.tsx`: container cambiado a dark full-bleed (sin `max-w-3xl` blanco), query de matches expandida.
- **v2.4 (abril 2026):** `/my-picks` rediseñado. Diseño propio (sin bundle Claude Design). Cards oscuras `#181C36` con borde izquierdo de color según resultado (verde/rojo/gold/dim). Header: "Mis Picks" en Bebas Neue + pill roja de jugadores quemados. Por card: día/fecha en gold JetBrains Mono, nombre en Bebas Neue 21px, position badge con colores, team name, stats de tiro/goles (verde si >0, gold si gol) solo post-evaluación. Status badge en JetBrains Mono (SOBREVIVISTE/ELIMINADO/EN ESPERA parpadeante/PENDIENTE/ANULADO). Empty state con CTA azul-gold.
- **v2.5 (abril 2026):** `/leaderboard` rediseñado. Diseño propio. Header: "Ranking" en Bebas Neue + pills de conteo (participantes/vivos/eliminados). Columnas: # · Jugador · Días · Goles · Estado. Fila líder (#1): gradiente dorado, borde dorado, nombre en `#E8C766`, número Bebas Neue 24px con glow. Fila usuario actual: gradiente azul, borde dorado, badge "TÚ". Eliminados separados con divisor "ELIMINADOS" + opacity 55%. Días en verde, goles en gold, badge ● VIVO / ✕ ELIM. en JetBrains Mono.
- **v2.6 (abril 2026):** barra de marca global en game layout. `app/(game)/layout.tsx` ahora incluye header superior fijo con `TPMark` (44px, con halo) + "TIRO A PUERTA / CHALLENGE" centrado, gradiente azul sutil, borde inferior. El logo es `<Link href="/dashboard">` — clickeable en todas las pestañas. Dashboard: TPMark eliminado del header de página (ya está en el layout), badge MEX·USA·CAN y saludo/logout en una sola fila `space-between`. Pick: padding del nav de fecha ajustado a 16px para alinear con el brand bar.
- **v2.7 (abril 2026):** `/signup` rediseñado con identidad visual Dirección 3. Mismo lenguaje visual que login: fondo oscuro `#0B0D18`, overlay grid, halo dorado, esquinas HUD. `TPMark` 72px (vs 92px en login para dar espacio a más campos). 3 campos: email (EmailIcon), username (UserIcon + hint de formato), password (toggle show/hide con EyeIcon/EyeOffIcon). 2 `DarkCheckbox` custom (controlled, checkmark dorado): `over_18_confirmed` (requerido) y `marketing_emails_opt_in` (opcional con hint). CTA signature (gradiente azul + borde dorado) "Crear cuenta". `OAuthButtons` FUERA del `<form>` (evita nested form). Link "¿Ya tienes cuenta?" en dorado. Validación en cliente con estado blurred. Build ✅ limpio.
- **v2.8 (abril 2026):** `LiveMatchStats` rediseñado con identidad Dirección 3. Eliminados todos los estilos Tailwind/blancos. Panel oscuro `rgba(0,0,0,0.3)` con borde sutil, integrado visualmente dentro de `PickConfirmedCard`. Score en Bebas Neue 20px. Stats (tiros/goles/minutos) en Bebas Neue 28px con glow de color (verde tiros, dorado goles). Badges de estado (EN VIVO / FINALIZADO / SUSPENDIDO) en JetBrains Mono con bordes de color. Survival indicator en JetBrains Mono uppercase. Timestamp de sync dim 9px.
- **v2.9 (abril 2026):** `/reset-password` y `/update-password` rediseñados con identidad Dirección 3. Mismo lenguaje visual que login/signup: fondo oscuro, grid overlay, halo dorado, HUD corners, `TPMark` 72px. Reset: campo email con EmailIcon, estado de éxito verde, link "← Volver al login". Update: dos campos password con LockIcon + toggle show/hide (EyeIcon), estado de éxito verde. CTA signature en ambos. Build ✅ limpio.
- **v3.0 (abril 2026):** responsividad desktop. Game layout centra contenido a `max-width: 480px`. Brand bar fondo full-width, contenido centrado. Confirm panel del pick corregido a 480px. Auth pages ya tenían 460px. En desktop el contenido aparece centrado como app mobile con fondo oscuro de borde a borde.
- **v3.1 (abril/mayo 2026):** primer deploy en Vercel. App en producción en `tiro-a-puerta.vercel.app`. 5 variables de entorno configuradas. Crons desactivados temporalmente (`vercel.json` con array vacío) por limitación del plan Hobby — reactivar al upgradear a Pro antes del Mundial. Página raíz `/` redirige a `/login`. Sistema de aprobación manual verificado en producción (`/admin/approvals`). Usuarios de prueba (`elias_test` admin, `El_Conde`) listos para pruebas con socios este fin de semana con PL.
- **v3.2 (mayo 2026):** fix de producción: Supabase Site URL corregido a `https://tiro-a-puerta.vercel.app` — los links de confirmación de email apuntaban a `localhost:3000`. Redirect URLs actualizadas en Supabase Auth para incluir wildcard de producción y localhost. Páginas de auth restantes rediseñadas con identidad Dirección 3: `/verify-email` (ícono de sobre, card con hint de spam, link al login) y `/complete-profile` (campo username, 2 DarkCheckbox, CTA "Continuar al desafío", nota de "Autenticado con Google"). Todas las pantallas de auth ahora tienen diseño consistente.
- **v3.3 (mayo 2026):** sesión 1 de mayo. Upgrade a Vercel Pro — crons reactivados (`* * * * *`) en `vercel.json`. Fixes en `/pick`: nombres de jugadores truncados correctamente (`minWidth: 0` en columnas del grid), entidades HTML decodificadas (`decodeHtml` en `pick-match-card.tsx` — nombres tipo `O&apos;Brien` corregidos). UX: scroll suave al top al confirmar pick (`window.scrollTo` en `handleConfirm`). Nuevo desempate secundario: `total_shots_accumulated` reemplaza a `days_survived` en `user_status` (migración `20260501000000`, cron `evaluate-picks` actualizado, leaderboard columnas # · Jugador · Goles · Tiros · Estado). `game-rules.md §5.3` y `database-schema.md` actualizados. Pendiente: desactivar branch protection en GitHub (`main` es push directo — usuario trabaja solo).

- **v3.4 (mayo 2026):** sesión 2 de mayo — bugs de cron encontrados en prueba en vivo Arsenal vs Fulham. **Fix 1:** `matches.update()` en `sync-live-matches` no tenía manejo de errores — fallaba silenciosamente dejando partidos atascados como `live`. **Fix 2:** safety net de force-finish a las 4 horas desde kickoff en `sync-live-matches` — si el partido sigue `live` en DB más de 4h, se marca `finished` automáticamente (cubre partidos de eliminación con tiempo extra + penales). **Fix 3:** `evaluate-picks` podía marcar `is_processed = TRUE` antes de evaluar picks de partidos tardíos — ahora verifica que no queden picks bloqueados sin resultado antes de cerrar el día (crítico para días del Mundial con partidos de 1pm a 10pm). **Fix UX:** indicador de supervivencia en `DashboardPickCard` ahora tiene 4 estados: reloj azul (partido no empieza), triángulo dorado (en vivo sin tiro), palomita verde (tiro confirmado), X roja (eliminado). **Backfill:** `total_shots_accumulated` en `user_status` no incluía históricos anteriores al 1 mayo (columna nueva) — corregido con UPDATE de backfill. **⚠️ Pendiente importante para el Mundial:** cuando se cargue el fixture completo, verificar que los crons `sync-live-matches` y `evaluate-picks` corran correctamente día a día — los horarios varían mucho (hasta 9h entre primer y último partido del día). La lógica ya es correcta pero hay que validar con datos reales.

- **v3.5 (mayo 2026):** sesión 3 de mayo — dos bugs críticos encontrados en prueba en vivo MU vs Liverpool. **Bug 1 — Límite de API-Football agotado:** `SYNC_WINDOW_HOURS = 24` causaba que todos los partidos terminados ayer se siguieran consultando hoy cada minuto (`N partidos × 2 llamadas × 60 min × 24h` supera los 7,500 req/día del plan PRO). Fix: reducir a `SYNC_WINDOW_HOURS = 2` — suficiente para correcciones tardías de la API. **Bug 2 — Dashboard congelado en "POR INICIAR":** `DashboardPickCard` solo iniciaba polling cuando `initialMatchStatus === 'live'`; si arrancaba como `'scheduled'` (partido no empezado), el intervalo nunca se activaba y la tarjeta quedaba pegada para siempre. Fix: fetch inmediato al montar el componente + polling mientras `status !== 'finished'`. Además, el SSR solo traía datos del partido si `effective_deadline <= now` — removida esa condición para siempre traer el status real. **⚠️ Nota operativa:** el límite de API-Football resetea a medianoche UTC. Si el cron falla por rate limit durante el día, los partidos en vivo no se actualizan — usar Opción A del reset manual para proteger usuarios afectados.

- **v5.1 (mayo 2026):** sesión 15 de mayo (continuación) — feature de alerta de alineaciones. **Nuevo cron `check-lineups`** (`app/api/cron/check-lineups/route.ts`): cada 5 min busca partidos con kickoff en los próximos 50 minutos y `lineups_notified = FALSE`. Llama a API-Football `/fixtures/lineups` — si lineups no disponibles aún, skip y reintenta próxima corrida. Si disponibles: extrae Starting XI, cruza contra `user_picks` no bloqueados, y si el jugador elegido no es titular, manda email de alerta. **Nuevo template** `substitute-warning.ts`: banner dorado "TU JUGADOR NO ES TITULAR", nombre del jugador, partido, hora CDMX, CTA "Cambiar mi pick" → `/pick?date=`. **Nuevo método** `getFixtureLineups()` en `lib/api-football/client.ts` + tipos `ApiLineupPlayer`/`ApiLineupTeam`. **Migración** `20260515000001`: columna `lineups_notified BOOLEAN` en `matches` (idempotencia). `vercel.json` actualizado (`*/5 * * * *`). Presupuesto: ~18 llamadas/día en día más pesado del Mundial (6 partidos), negligible vs 7,500 límite. 7mo email del sistema.

- **v5.0 (mayo 2026):** sesión 15 de mayo — 3 bugfixes de beta. **Fix 1 — Usuarios no aprobados visibles en el juego:** `user_status` se crea al signup (trigger `handle_new_user`) antes de la aprobación del admin. El leaderboard mostraba usuarios no aprobados y `evaluate-picks` los eliminaba por `no_pick` aunque no podían jugar. Fix: leaderboard filtra `users!inner` + `.eq('users.is_approved', true)`; `evaluate-picks` Phase A y Phase B filtran `aliveUserIds` contra lista de usuarios aprobados. `send-pick-reminders` ya filtraba correctamente. **Fix 2 — Porcentajes de Rivales sumaban >100%:** `Math.round` individual en cada porcentaje podía dar sumas >100 (ej. 38+25+25+13=101). Fix: método del residuo más grande (largest remainder) — `Math.floor` en cada valor, sobrantes distribuidos a los de mayor parte decimal. Siempre suma 100. **Fix 3 — Minutos jugados desfasados en vivo:** `player_match_stats.minutes_played` (API-Football `stats.games.minutes`) se actualiza con ~5 min de retraso vs `matches.match_minute` (minuto real). Un titular en el minuto 58 mostraba 53 min. Fix: nueva columna `is_substitute BOOLEAN` en `player_match_stats` (migración `20260515000000`), worker `sync-live-matches` ahora escribe `stats.games.substitute`. `LiveMatchStats`: titulares en vivo → `match_minute` (preciso); suplentes en vivo → `minutes_played` (con desfase pero rango correcto); partido terminado → `minutes_played` (dato final). `database-schema.md` actualizado.

- **v4.9 (mayo 2026):** sesión 13 de mayo (fix) — bug crítico de checkboxes en signup y complete-profile. **Bug:** `DarkCheckbox` tenía `<label htmlFor={id}>` con el `<input id={id}>` anidado dentro del mismo label — doble-toggle: cada click toggleaba el checkbox dos veces (on→off). El checkbox se veía visualmente marcado (React state `true`) pero el `<input>` real mandaba `false` en el FormData. Resultado: el servidor rechazaba con "Debes aceptar los Términos y Condiciones" o "Debes confirmar que eres mayor de 18 años" a pesar de tener ambos checkboxes marcados. Reportado por usuario `pabach` en `/complete-profile` (flujo Google OAuth). **Fix:** quitar `htmlFor` del `<label>` (innecesario — el input ya está dentro del label). Corregido en `signup-form.tsx` y `complete-profile-form.tsx`.

- **v4.8 (mayo 2026):** sesión 13 de mayo (continuación) — Términos y Condiciones + Aviso de Privacidad. **Página `/terms`** (nueva): 13 secciones de T&C (organizadores, elegibilidad, costo $1,000 MXN, premios $150,000 MXN, fuente de datos, conducta, sanciones, apelaciones, propiedad intelectual, limitación de responsabilidad, cancelación, legislación) + 8 secciones de Aviso de Privacidad LFPDPPP (responsable, datos recabados, finalidades, derechos ARCO, transferencias a terceros, cookies, seguridad). Diseño Dirección 3 (card oscura con secciones en gold). **Checkbox obligatorio** "Acepto los Términos y Condiciones" en `/signup` y `/complete-profile` con link dorado que abre `/terms` en nueva pestaña. `DarkCheckbox` ahora soporta `linkHref`/`linkLabel`. **Validación en servidor:** `signUp` y `completeProfile` verifican aceptación de T&C. **Columna `terms_accepted_at`** (`TIMESTAMPTZ`) en `public.users` — migración `20260513000000` + backfill de usuarios existentes. Trigger `handle_new_user` actualizado (migración `20260513000001`) para escribir timestamp desde metadata. `database-schema.md` actualizado. Organizadores: Elías Hale, Daniel Occelli, Víctor Bensimon (personas físicas, sin SEGOB — friends & family).

- **v4.7 (mayo 2026):** sesión 13 de mayo — Supabase Custom Domain, flyer, múltiples admins, reglas en perfil. **Upgrade a Supabase Pro** — plan activo. **Custom Domain `auth.tiroapuerta.mx`** configurado: CNAME en Cloudflare (DNS only) + TXT de verificación `_acme-challenge.auth`. Activado en Supabase Dashboard → Settings → General → Custom Domains. **Google OAuth redirect URI** actualizada en Google Cloud Console: `https://auth.tiroapuerta.mx/auth/v1/callback`. El popup de Google ahora muestra `auth.tiroapuerta.mx` en lugar del subdominio críptico de Supabase. Pendiente cosmético de v3.8 resuelto. **Flyer promocional** (`public/flyer.html`): diseño 1080x1920px (Instagram story) con identidad Dirección 3, logo TPMark, portería con balón, premio $150,000 MXN, premios Top 5, 3 pasos, CTA `tiroapuerta.mx`, cupo limitado. **Múltiples admins:** `notifyAdminOfNewSignup` en `lib/auth/actions.ts` ahora acepta `ADMIN_EMAIL` con emails separados por comas — envía en paralelo. Socios (bensiman, danieloccelli11) añadidos como `is_admin = TRUE` en DB. **Reglas del juego en `/profile`:** card colapsable con 8 reglas clave + bloque "Autoridad de Tiro a Puerta" (API como fuente de verdad inapelable). **Modelo económico decidido:** premio $150,000 MXN al ganador, premios para Top 5, entrada $1,000 MXN.

- **v4.6 (mayo 2026):** sesión 12 de mayo — profile, PWA, safe areas, Rivales. **`/profile`:** nuevo 5to tab "Perfil" en nav inferior. Página con 4 secciones: avatar de iniciales + badge VIVO/ELIMINADO, card "Tu cuenta" (username editable inline, email readonly, proveedor), card "Preferencias" (toggle marketing con update optimista), card "Zona de peligro" (cerrar sesión + eliminar cuenta placeholder). Server Actions `updateUsername` y `updateMarketingOptIn` en `lib/profile/actions.ts`. `LogoutButton` removido del dashboard — logout solo en profile. **PWA:** `manifest.json` con `display: standalone`, íconos 192/512px del balón Telstar, `apple-touch-icon.png` 180px, `app/icon.png` reemplaza favicon de Vercel. Chrome Android ofrece "instalar app" automáticamente; Safari iOS funciona con "Agregar a pantalla de inicio". **Safe areas iOS:** `viewport-fit: cover` + `env(safe-area-inset-top)` en brand bar + `env(safe-area-inset-bottom)` en nav — fix notch/Dynamic Island y home indicator. **Rivales 🔥:** nueva pestaña en `/my-picks` con distribución de picks del día en barras horizontales con porcentajes. Revelación progresiva por partido (filtra `effective_deadline <= now`). Navegación por día con flechas. Solo muestra jugadores elegidos, nunca identidad de usuarios. Porcentajes sobre picks hechos (opción A). Top 3 destacados visualmente (dorado/azul/verde). Pills de "X picks revelados" + "N partidos por revelar". Empty states para sin partidos, picks no revelados, nadie hizo pick. **Cleanup:** `/health-check` eliminado (ya no necesario en producción). Jugadores quemados en dashboard descartado (ya cubierto en `/my-picks` y `/pick`).

- **v4.4 (mayo 2026):** sesión 11 de mayo (cierre) — fixes de emails, unit tests, leaderboard y dashboard. **Fix email de eliminación:** `sendEliminationEmails` usaba `select("id, name")` pero la columna es `display_name` — jugador aparecía como "undefined" en el email. Dos líneas corregidas. **Fix nombre de remitente:** `EMAIL_FROM` actualizado de `no-reply@tiroapuerta.mx` a `Tiro a Puerta <no-reply@tiroapuerta.mx>` en Vercel y `.env.local` — los emails ahora muestran "Tiro a Puerta" como remitente. **Unit tests:** Vitest instalado (`vitest ^4.1.6`), scripts `test` y `test:watch` en `package.json`. Lógica core `evaluatePickResult` extraída a `lib/game/evaluate-pick.ts` (función pura, sin DB). 10 tests en `tests/game/evaluate-pick.test.ts`: survived (3 casos), eliminated (2), void_did_not_play (2), void_cancelled_match (2), pass-through (1). `evaluate-picks` cron ahora importa la función pura. **Leaderboard:** pills de conteo (participantes/vivos/eliminados) reemplazados por una sola pill "X% vivos" — no mostrar nunca el número total de participantes. Top 50 con helper `ensureCurrentUser<T>()`: si el usuario actual está fuera del top 50, su fila se agrega al final con su puesto real. **Dashboard:** card de supervivencia ("ESTÁS VIVO") ahora muestra posición en el ranking (#N en Bebas Neue 36px dorado con glow) y porcentaje de usuarios vivos ("X% vivos" en JetBrains Mono 9px). Query adicional de `user_status` ordenada por criterios de ranking para calcular posición real. **Fixture PL verificado:** comparación completa del fixture restante contra API-Football — cero discrepancias tras el re-seed de la sesión anterior.

- **v4.3 (mayo 2026):** sesión 11 de mayo (continuación) — evaluación por partido y fix de fixture PL. **Evaluación per-match:** `evaluate-picks` refactorizado a dos fases. Fase A (`evaluatePicksForFinishedMatches`): evalúa picks en cuanto su partido individual termina, sin esperar al día completo — crítico para días del Mundial con hasta 6 partidos de 1pm a 10pm CDMX. Fase B (`closeMatchDay`): eliminación por `no_pick` + `is_processed = TRUE` solo cuando todo el día terminó. Lógica core sin cambios, solo reorganización del flujo. Presupuesto API-Football validado: peor caso (6 partidos) = 2,880 de 7,500 req/día (38%). **Fix fixture PL:** partidos del 17–19 y 22 de mayo estaban con fechas/horas incorrectas en DB (la PL movió horarios después del seed original). Re-seedeados con `seed-missing-matchday.ts`. Man City vs Crystal Palace movido del 22 al 13 mayo. Pick huérfano de `andresmitrani` (Haaland, día fantasma) borrado. Match_day vacío del 22 eliminado. Verificación completa del fixture restante contra API: cero discrepancias.

- **v4.2 (mayo 2026):** sesión 11 de mayo — pruebas con amigos. Reset completo de DB para arrancar desde cero el 13 de mayo (Man City): borrado de picks/historial, `user_status` en ceros, días pasados marcados `is_processed = TRUE`. Script `scripts/seed-missing-matchday.ts` creado: agrega días y partidos faltantes de la API sin borrar datos existentes (upsert seguro). Primer uso: Aston Villa vs Liverpool (15 mayo) que no estaba en la DB. Script reutilizable — editar `DATES_TO_SEED` para otras fechas.

- **v4.1 (mayo 2026):** sesión 9 de mayo — fix crítico de evaluate-picks en producción. **Bug:** el join `user_status!inner(is_alive)` introducido el 5 de mayo causaba que el cron fallara en cada corrida con `"Could not find a relationship between 'user_picks' and 'user_status' in the schema cache"` — PostgREST no expone esa relación FK en su schema cache. El cron fallaba silenciosamente desde hace días sin procesar ningún día. **Fix:** reemplazado el join por dos queries separadas: primero obtener los `user_id` de usuarios vivos desde `user_status`, luego filtrar `user_picks` con `.in("user_id", aliveUserIds)`. Misma lógica, sin join. Diagnosticado invocando el cron manualmente y leyendo el error en la respuesta JSON. Partido Man City vs Brentford (9 mayo) evaluado correctamente tras el fix.

- **v4.0 (mayo 2026):** sesión 5 de mayo (cierre) — performance y UX. **loading.tsx en las 4 rutas del juego** (`/dashboard`, `/pick`, `/my-picks`, `/leaderboard`): componente compartido `components/layout/page-loading.tsx` con spinner dorado + 3 shimmer cards oscuras animadas con `tpPulse`. Navegación entre pestañas muestra feedback inmediato. **`PickDayNav` convertido a Client Component** con `useTransition` + `useRouter`: al navegar entre días el nav se dimea (70% opacity), flechas se deshabilitan y aparece spinner dorado junto al subtítulo mientras el servidor fetchea. Antes era Server Component con `<Link>` sin feedback visual.

- **v3.9 (mayo 2026):** sesión 5 de mayo (continuación) — fixes de evaluación y UI. **Fix evaluate-picks:** el cron ahora hace join con `user_status!inner` y filtra `is_alive = true` antes de evaluar picks — los pre-picks de usuarios ya eliminados se ignoran completamente (antes se evaluaban y escribían `result = 'survived'` mostrando "SOBREVIVISTE" en /my-picks). **Fix /my-picks UI:** `void_did_not_play` (jugador no convocado/lesionado) ahora muestra "ELIMINADO" en rojo en lugar de "ANULADO" — deja claro que hay consecuencia. "ANULADO" queda reservado exclusivamente para `void_cancelled_match` (partido cancelado, sin consecuencia). Caso de prueba: Bensimon eliminado por Z. Flemming (día 5), sus pre-picks de Gyokeres e Igor Jesus ya no mostrarán "SOBREVIVISTE"; corregido manualmente en DB para este usuario.

- **v3.8 (mayo 2026):** sesión 5 de mayo (continuación) — pantalla de espera rediseñada y emails verificados. **`/pending-approval` rediseñado** con identidad Dirección 3: fondo oscuro, grid overlay, halo dorado, HUD corners, `TPMark` 72px, badge "EN ESPERA DE APROBACIÓN" en dorado, email dim en JetBrains Mono. **Fix `approveUser`:** logging completo del resultado de `sendEmail` — null check en email + log de éxito/fallo. **Deploy fix:** commit vacío forzó redeploy del código del día (redeployments manuales de Vercel estaban usando código de ayer). **Email de aprobación verificado end-to-end:** llega correctamente a usuarios desde `no-reply@tiroapuerta.mx`. **Resuelto:** Supabase Custom Domain (`auth.tiroapuerta.mx`) configurado en v4.7 — popup de Google OAuth muestra dominio propio.

- **v3.7 (mayo 2026):** sesión 5 de mayo — dominio propio y sistema de emails completo. **Dominio `tiroapuerta.mx`** comprado en Cloudflare Registrar. DNS auto-configurado para Vercel (app live) y Resend (email). `www` → redirect 301 a raíz. `NEXT_PUBLIC_APP_URL` y Supabase Site URL actualizados a `https://tiroapuerta.mx`. Fallback hardcodeado actualizado en todo el código (`lib/admin/actions.ts`, `lib/auth/actions.ts`, ambos crons). **Emails completos con marca:** email de cuenta aprobada (`lib/email/templates/account-approved.ts`) disparado desde `approveUser`; templates Supabase con identidad Dirección 3 para verificación (`confirm-signup.html`) y reset de contraseña (`reset-password.html`) en `lib/email/templates/supabase/` — pegados en Supabase Dashboard. Subtitle de todos los templates actualizado de "MUNDIAL 2026" a "MEX · USA · CAN 2026". **Resend con dominio propio:** `EMAIL_FROM=no-reply@tiroapuerta.mx` en Vercel (antes `onboarding@resend.dev`). Sistema de emails 100% completo: 6 emails con marca.

- **v3.6 (mayo 2026):** sesión 4 de mayo — emails transaccionales, monitoreo y panel admin mobile. **Emails (Resend):** sistema completo en `lib/email/` — email de eliminación (se dispara desde `evaluate-picks` con razón + stats), recordatorio de pick (cron hourly `send-pick-reminders`, 2h antes del último partido), aviso al admin de nuevo registro (en `signUp` y `completeProfile`). Templates HTML inline con identidad Dirección 3. Migración `20260504000000` agrega `pick_reminder_sent` a `match_days` para idempotencia. **Fix `rejectUser`:** botón Rechazar en `/admin/approvals` fallaba por FK constraint — `user_status_user_id_fkey` no tiene CASCADE. Fix: borrar en orden correcto (`user_status` → `users` → `auth.users`). **Panel admin mobile:** `/admin/approvals` rediseñado con cards oscuras mobile-first (antes era tabla horizontal inutilizable en móvil). **Sentry:** SDK `@sentry/nextjs` instalado, configs para client/server/edge, `instrumentation.ts`, DSN y `SENTRY_AUTH_TOKEN` en Vercel. Alertas por email activadas en high-priority issues. **Vercel Analytics:** `@vercel/analytics` instalado, componente `<Analytics />` en `app/layout.tsx`. **Google OAuth popup:** nombre del proyecto actualizado a "Tiro a Puerta Challenge" en Google Cloud Console → OAuth consent screen. El subdominio de Supabase en el popup de selección de cuenta requiere Custom Domain de Supabase (pendiente). **Branch protection:** desactivada en GitHub — push directo a `main`. **Beta programada:** fin de semana del 4 de mayo con ~15 usuarios de prueba.

---

## Sistema de diseño (marca aprobada en Claude Design)

Paleta, tipografía y componentes decididos en sesión de diseño con Claude Design (29 abr 2026). **Dirección 3 "El Momento"** aprobada como identidad oficial.

### Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--tp-blue` | `#2A398D` | Primario, CTAs, navbar |
| `--tp-blue-deep` | `#1B2566` | Gradiente del botón principal |
| `--tp-red` | `#E61D25` | Alertas, EN VIVO, eliminación |
| `--tp-green` | `#3CAC3B` | Éxito, sobreviviste, confirmación |
| `--tp-gold` | `#C9A84C` | Acento especial, líder, bordes, wordmark "CHALLENGE" |
| `--tp-ink` | `#0B0D18` | Fondo principal (near black) |
| `--tp-ink-panel` | `#181C36` | Fondo de cards y campos |
| `--tp-ink-line` | `rgba(255,255,255,0.08)` | Separadores y bordes sutiles |

### Tipografía

| Variable CSS | Fuente | Uso |
|---|---|---|
| `--font-bebas-neue` | Bebas Neue 400 | Títulos grandes, wordmark, números de estadísticas |
| `--font-archivo` | Archivo 400–900 | Cuerpo, UI, botones |
| `--font-archivo-narrow` | Archivo Narrow 500–700 | Labels de campos (uppercase) |
| `--font-jetbrains-mono` | JetBrains Mono 400–700 | Badges meta, divisores |

### Componentes de marca (`components/brand/tp-mark.tsx`)

- **`TPMark`** — Balón Telstar SVG (Dirección 3). Props: `size`, `showMotionLines`, `showGoalLine`, `showHalo`.
- **`TPWordmark`** — "TIRO A PUERTA / CHALLENGE". Props: `color`, `goldColor`, `size` (xl/lg/md/sm), `align`.
- **`TPLockup`** — Mark + Wordmark juntos (horizontal o vertical). Props: `size`, `stack`, `dark`.

### Animaciones globales (en `globals.css`)

- `tpPulse` — fade in/out para el punto rojo "EN VIVO" y badges de alerta.
- `spin` — rotación continua para el spinner de loading.
- `pickLivePulse` — glow pulsante para cards de pick en vivo.

### Diseños aprobados en Claude Design

| Pantalla | Estado | Archivo de diseño |
|---|---|---|
| Login (D — Mezcla) | ✅ Implementado | `components/auth/login-form.tsx` |
| Dashboard (v2, 4 escenarios) | ✅ Implementado | `app/(game)/dashboard/page.tsx` + `components/game/dashboard-pick-card.tsx` |
| Pick del día (3 artboards) | ✅ Implementado | `components/game/pick-client.tsx`, `pick-match-card.tsx`, `pick-day-nav.tsx` |
| Mis Picks | ✅ Implementado (diseño propio) | `app/(game)/my-picks/page.tsx` |
| Leaderboard / Ranking | ✅ Implementado (diseño propio) | `app/(game)/leaderboard/page.tsx` |
| Verify Email | ✅ Implementado | `app/(auth)/verify-email/page.tsx` |
| Complete Profile (OAuth) | ✅ Implementado | `components/auth/complete-profile-form.tsx` |
| Logo (Dirección 3) | 🎨 Diseño aprobado, pendiente implementar | Claude Design bundle |

### Notas de implementación del diseño

- El diseño usa **inline styles** para valores específicos del sistema visual (gradientes, sombras, colores exactos). Tailwind se usa para estructura/layout.
- Los campos de formulario usan `inkPanel` (`#181C36`) como fondo filled, con borde dorado en focus y `box-shadow` de glow.
- El botón CTA principal: `linear-gradient(blue → blueDeep)` + `border: 1.5px solid gold` — esta combinación es la "firma" del diseño D.
- **Barra de marca global** en `app/(game)/layout.tsx`: `TPMark` 44px + wordmark centrado, clickeable → `/dashboard`. Presente en todas las pestañas del juego. No duplicar en páginas individuales.
- **Pantallas sin bundle Claude Design** (`/my-picks`, `/leaderboard`): diseño propio aplicando el sistema de diseño establecido. Patrón: cards `#181C36`, borde izquierdo de color para estado, texto en Bebas Neue / JetBrains Mono / Archivo.
- Las HUD corners (brackets dorados en las 4 esquinas) son un elemento visual recurrente en todas las pantallas.

---

*Fin del documento.*
