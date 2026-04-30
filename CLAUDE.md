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
- **Deploy:** Vercel ✅ — `tiro-a-puerta.vercel.app` (plan Hobby, upgrade a Pro pendiente para crons)
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

- **Modelo económico y premios.** Si hay costo de entrada, qué tipo de premio, estructura legal (SEGOB, persona física/moral, T&C, aviso de privacidad).
- **Criterios de desempate secundarios.** Los actuales en `game-rules.md` §5.3 pueden refinarse.
- **Diseño visual y branding.** Logo, paleta de colores, tipografía. Aún no definidos.

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

- No hacer commits directamente a `main`. Siempre PR.
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
