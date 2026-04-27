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
- **Deploy:** Vercel *(pendiente — proyecto NO desplegado aún, solo en local)*
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

Para resetear `elias_test` después de una eliminación durante pruebas, correr en el SQL Editor de Supabase **después** de que `evaluate-picks` haya procesado el día:

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
```

⚠️ Fix manual exclusivo para pruebas. No existe en la app ni aplica a usuarios reales.

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

---

*Fin del documento.*
