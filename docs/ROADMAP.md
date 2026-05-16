# ROADMAP — Tiro a Puerta Challenge: Mundial 2026

**Última actualización:** 13 de mayo de 2026 (fix: doble-toggle en DarkCheckbox bloqueaba signup y complete-profile)
**Deadline duro:** 11 de junio de 2026 (kickoff inaugural, 1:00 pm CDMX)

---

## Estado actual del proyecto

### Lo que ya está construido

- [x] **Proyecto Next.js 15 inicializado** — App Router, TypeScript, Tailwind CSS, React Compiler activado.
- [x] **Supabase: paquetes instalados** — `@supabase/supabase-js` y `@supabase/ssr` en `package.json`.
- [x] **Supabase: clientes configurados** — cliente de browser (`lib/supabase/client.ts`) y cliente de servidor (`lib/supabase/server.ts`) listos para usar en componentes.
- [x] **Variables de entorno** — `.env.example` en el repo con los nombres de variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). `.env.local` no commiteado.
- [x] **Health check de Supabase** — página temporal en `/health-check` que verifica la conexión. Pendiente remover antes de producción.
- [x] **Documentación base** — `docs/game-rules.md`, `docs/database-schema.md`, `CLAUDE.md`, `AGENTS.md` redactados y en el repo.
- [x] **Schema de DB aplicado en Supabase** — 11 tablas, índices, constraints, RLS y triggers básicos (`set_updated_at`, `validate_pick_timing`, `log_pick_history`) creados manualmente en el SQL Editor.
- [x] **Migraciones versionadas en el repo** — `supabase/migrations/` con 3 archivos que documentan lo aplicado manualmente (`20260415000000`, `20260415000001`, `20260415000002`).

- [x] **Sistema completo de autenticación** — signup, login, logout, OAuth (solo Google), reset y update password. Trigger `handle_new_user` sincroniza `auth.users → public.users + user_status`. Trigger `sync_email_verified` mantiene `email_verified` actualizado.
- [x] **Dashboard del usuario** (`/dashboard`) — muestra estado en el torneo (vivo/eliminado, días sobrevividos, goles acumulados) y pick del día actual. Layout con nav y logout.
- [x] **Aprobación manual de cuentas** — nuevos usuarios quedan en `is_approved = false` hasta que el admin los aprueba desde `/admin/approvals`. Proxy bloquea acceso al juego si no están aprobados. Columnas `is_approved` e `is_admin` en `public.users`.

### Lo que NO está construido aún

Picks, leaderboard, emails, precarga de datos del torneo, etc. (detallado en las tareas de abajo).

---

## Tareas pendientes por prioridad

Las tareas están ordenadas de mayor a menor prioridad. Dependencias indicadas donde corresponde.

---

### 🔴 PRIORIDAD ALTA — Fundamentos (sin esto no hay juego)

#### 1. Schema de base de datos
- [x] Crear todas las tablas del schema en Supabase (`users`, `teams`, `players`, `match_days`, `matches`, `player_match_stats`, `user_picks`, `pick_history`, `user_status`, `api_sync_events`, `admin_appeals`).
- [x] Aplicar índices definidos en `database-schema.md §4`.
- [x] Aplicar constraints de nivel DB (`database-schema.md §5`).
- [x] Habilitar RLS en todas las tablas sensibles (`database-schema.md §6`).
- [x] Crear triggers: `set_updated_at`, `validate_pick_timing`, `log_pick_history` (`database-schema.md §7`).
- [x] Versionar scripts SQL en `supabase/migrations/` (3 archivos: schema, RLS, funciones/triggers).
- [ ] Crear funciones DB: `process_match_day_results()`, `get_available_players()` (`database-schema.md §7`). *(Se implementarán cuando se construya la evaluación automática de picks.)*

#### 2. Sistema de autenticación ✅
Basado en `game-rules.md §9` y `database-schema.md §3.1`.

- [x] **Trigger `handle_new_user`**: función SQL escrita, versionada en `supabase/migrations/20260420000000_handle_new_user_trigger.sql` y aplicada en Supabase. Sincroniza `auth.users → public.users + public.user_status` al crear cuenta.
- [x] **Página de registro** (`/signup`):
  - Campos: email, contraseña, username, checkbox de mayoría de edad (18+).
  - Validación en cliente y servidor.
  - Restricción: solo un provider por email (no duplicar cuentas).
- [x] **Página de login** (`/login`):
  - Email + contraseña.
  - Google Sign-In (OAuth).
  - ~~Apple Sign-In (OAuth).~~ *(Descartado — requiere Apple Developer Program $99/año y configuración compleja. Solo Google.)*
  - Link "¿Olvidaste tu contraseña?".
- [x] **Verificación de email**:
  - Flujo de confirmación por email para usuarios registrados con email+contraseña.
  - Link de verificación con validez de 24 horas (`game-rules.md §9.2`).
  - Usuarios OAuth se marcan como verificados automáticamente.
- [x] **Recuperación de contraseña** (`/reset-password`):
  - Formulario de solicitud de reset.
  - Página de nueva contraseña con el token de Supabase (`/update-password`).
- [x] **Proxy de sesión** (`proxy.ts`):
  - Reemplaza `middleware.ts` (deprecado en Next.js 16).
  - Refresca el token de sesión de Supabase en cada request.
  - Protege rutas autenticadas (redirige a `/login` si no hay sesión).
  - Redirige a `/dashboard` si usuario autenticado intenta entrar a páginas de auth.
- [x] **Route handler de callback** (`/auth/callback`): maneja OAuth, confirmación de email y password reset.
- [x] **Server Actions de auth** (`lib/auth/actions.ts`): `signUp`, `signIn`, `signInWithOAuth`, `signOut`, `resetPassword`, `updatePassword`.
- [ ] **Cerrar sesión** (logout): botón/acción visible en la app (se agrega en el dashboard).
- [ ] **Cierre de registros**: bloquear nuevos signups a partir del 11 de junio de 2026, 12:55 pm CDMX (`game-rules.md §9.5`). *(Se implementa cuando se construya la validación de fechas del torneo.)*
- [x] **Trigger `sync_email_verified`**: aplicado en Supabase. Actualiza `public.users.email_verified` cuando el usuario confirma su email.
- [x] **Configurar Google OAuth en Supabase**: credenciales creadas en Google Cloud Console, habilitado en Supabase Authentication → Providers. Flujo `/complete-profile` implementado para recoger username y edad después del OAuth.

#### 2.5. Aprobación manual de cuentas (ambiente cerrado) ✅
El juego es cerrado: cualquiera puede registrarse pero necesita aprobación explícita del admin para jugar.

- [x] **Migración de DB**: columnas `is_approved BOOLEAN DEFAULT FALSE` e `is_admin BOOLEAN DEFAULT FALSE` en `public.users`. Índice para la query de pendientes. Aplicado en Supabase.
- [x] **Página `/pending-approval`**: pantalla informativa para usuarios autenticados pero no aprobados.
- [x] **Actualizar proxy**: si el usuario está autenticado pero `is_approved = false`, redirige a `/pending-approval`.
- [x] **Página `/admin/approvals`** (protegida): lista de usuarios pendientes con username, email y fecha de registro. Botones de aprobar y rechazar. Solo accesible si `users.is_admin = true`.
- [x] **Server Actions `approveUser` / `rejectUser`**: validan que quien llama es admin. Aprobar setea `is_approved = true`; rechazar elimina el usuario de `auth.users` (cascada a `public.users`).
- [x] **Email al admin** cuando alguien se registra — `notifyAdminOfNewSignup` envía a múltiples emails (`ADMIN_EMAIL` separado por comas). 3 admins configurados.
- [ ] *(Opcional)* **Email al usuario** cuando es aprobado o rechazado. *(Diferido a tarea 9.)*

#### 3. Integración con API-Football y pruebas con Premier League ✅ (worker pendiente prueba en vivo)
**Proveedor decidido: API-Football** (api-football.com). Plan PRO contratado (3 meses, 7,500 requests/día). API key en `.env.local`. Endpoint clave: `fixtures/players` — devuelve `shots.on` y `goals.total` por jugador por partido, actualizado cada minuto.

**Estrategia:** probar el sistema completo con partidos en vivo de Premier League (temporada 2025/26) antes del Mundial. Ventana de prueba: 22 de abril al 24 de mayo de 2026 (14 días, 50 partidos).

**Nota técnica:** México eliminó el horario de verano en 2023. CDMX es permanentemente **UTC-6**. Medianoche CDMX = 06:00 UTC. Aplica a todos los cálculos de deadlines y ventanas de pick.

- [x] **Tipos de API-Football** (`lib/api-football/types.ts`): tipos TypeScript basados en responses reales de la API.
- [x] **Cliente de API-Football** (`lib/api-football/client.ts`): wrapper tipado con `getTeams`, `getFixtures`, `getFixtureById`, `getFixturePlayers`, `getSquad` y helpers de mapeo.
- [x] **Script de seed: equipos de Premier League** (`scripts/seed-pl-teams.ts`): 20 equipos en tabla `teams`. Corrido exitosamente.
- [x] **Script de seed: jugadores de Premier League** (`scripts/seed-pl-players.ts`): 612 jugadores en tabla `players`. Corrido exitosamente.
- [x] **Script de seed: partidos de Premier League** (`scripts/seed-pl-matches.ts`): 14 días y 50 partidos (22 abr – 24 may 2026) en tablas `match_days` y `matches`. Corrido exitosamente.
- [x] **Worker de sincronización en vivo** (`app/api/cron/sync-live-matches/route.ts`): llama a `fixtures/players` cada ~60s para partidos activos, actualiza `player_match_stats` y `matches`. Configurado en `vercel.json`.
- [x] **Script de picks de prueba** (`scripts/insert-test-picks.ts`): picks del día 1 (22 abr): elias_test → Haaland (Man City FWD), El_Conde → Petrović (Bournemouth GK).
- [x] **Prueba end-to-end**: worker verificado en vivo el 22 de abril (PL: Bournemouth vs Leeds + partido con Man City). `player_match_stats` se actualiza correctamente con `shots_on_target`, `goals`, `minutes_played`. Haaland: 1 tiro a puerta + 1 gol registrados en tiempo real.
- [ ] *(Mundial)* Scripts de seed equivalentes para los 48 equipos, ~1,150 jugadores y 104 partidos del Mundial 2026.
- [x] **Script `seed-missing-matchday.ts`**: agrega días/partidos faltantes sin borrar datos existentes. Editar `DATES_TO_SEED` para agregar fechas. Usado el 11 mayo para agregar Aston Villa vs Liverpool (día 15 faltante en DB).

#### 3b. Precarga de datos del Mundial 2026
*(Se ejecuta ~1 semana antes del 11 de junio)*
- [ ] Script de seed para los 48 equipos (`teams`).
- [ ] Script de seed para los días de partidos (`match_days`).
- [ ] Script de seed para los 104 partidos de fase de grupos (`matches`).
- [ ] Script de seed para jugadores (~1,150) — disponible ~1 semana antes del torneo.

---

### 🟠 PRIORIDAD MEDIA-ALTA — Mecánica central del juego

#### 4. Dashboard del usuario (post-login) ✅
- [x] Página principal del usuario autenticado: estado actual (vivo/eliminado), pick del día, días sobrevividos.
- [x] Layout con nav (username) y botón de logout.
- [x] Card de supervivencia muestra posición en el ranking (#N en dorado) y porcentaje de usuarios vivos.
- [x] ~~Mostrar jugadores quemados del usuario.~~ *(Descartado — ya visible en `/my-picks` con pill de "X jugadores quemados" y en `/pick` con 🚫. No duplicar.)*

#### 5. Sistema de picks ✅
- [x] **Pool de jugadores elegibles**: página `/pick` muestra todos los jugadores del día agrupados por partido.
- [x] **Selector de pick**: tarjetas de partido desplegables con filtro por posición (GK/DEF/MID/FWD). Panel de confirmación sticky al fondo (mobile-friendly).
- [x] **Crear/cambiar pick**: Server Actions `submitPick` (upsert con validaciones) y `removePick`. Upsert con `onConflict: 'user_id,match_day_id'` para cambio de pick en el día.
- [x] **Deadline en tiempo real**: componente `DeadlineCountdown` muestra cuenta regresiva; tarjeta se cierra automáticamente cuando deadline vence.
- [x] **Visualización del pick activo**: tarjeta "Tu pick de hoy" con nombre, posición y estado (bloqueado / modificable). Pick resaltado en verde (✓) dentro de la lista.
- [x] Validar que el pick se hace antes del deadline del partido del jugador elegido (`game-rules.md §3.2`).
- [x] Validar que el jugador no fue elegido en días anteriores (`game-rules.md §3.4`). Jugadores quemados aparecen con 🚫 y están deshabilitados.
- [x] **Picks por adelantado**: navegación por día (`?date=YYYY-MM-DD`), hasta 3 días hacia adelante y hacia atrás. Pre-picks bloquean al jugador en todos los demás días inmediatamente.
- [x] **RLS fixes**: migración `20260422000001` (SECURITY DEFINER en `log_pick_history`), migración `20260422000002` (política FOR DELETE explícita en `user_picks`).
- [x] **Fix is_alive**: `evaluate-picks` no infla `days_survived`/`total_goals_accumulated` de usuarios eliminados con pre-picks futuros (`.eq("is_alive", true)`).

#### 6. Leaderboard ✅
- [x] Página pública de leaderboard (`/leaderboard`) — accesible sin autenticación.
- [x] Mostrar: usuarios vivos, goles acumulados, días sobrevividos. Fila del usuario actual resaltada.
- [x] Ordenar: vivos primero → goles acumulados DESC → tiros totales DESC (§5.1 + §5.3).
- [x] Usuarios sin sesión ven el leaderboard con link "Iniciar sesión" en lugar del nav autenticado.
- [x] Fix: `/my-picks` agregado a `PROTECTED_ROUTES` en proxy (bug pre-existente).
- [x] Pill única "X% vivos" — nunca mostrar número total de participantes (privacidad).
- [x] Top 50 con `ensureCurrentUser`: si el usuario está fuera del top 50, su fila aparece al final con su puesto real.
- [ ] *(Pendiente)* Mostrar "pick de hoy" de cada usuario en el leaderboard, solo después del deadline (`game-rules.md §10.1`). Requiere query extra por usuario — diferido.

#### 6.5. Mis picks (`/my-picks`) ✅
Sección privada donde cada participante puede ver un resumen de todos sus picks por día — para tener claridad de qué jugadores ya usó y cuáles aún tiene disponibles.
- [x] Página `/my-picks`: lista de días jugados con el jugador elegido, resultado del día (sobrevivió / eliminado / anulado / pendiente) y tiro a puerta/goles si aplica.
- [x] Indicar visualmente qué jugadores ya están quemados — contador al tope ("X jugadores usados") y badge por cada entrada.
- [x] Ordenar por día (más reciente primero).
- [x] Mostrar picks futuros/planeados también (pre-picks con badge "Pendiente").
- [x] Fix: navegación de días en `/pick` ahora funciona aunque hoy no tenga partidos (always-run prev/next query + PickDayNav en el empty state).
- [x] **Pestaña "Rivales 🔥":** distribución de picks del día en barras horizontales con porcentajes. Revelación progresiva por partido (`effective_deadline <= now`). Navegación por día con flechas. Solo jugadores elegidos, nunca identidad de usuarios. Porcentajes sobre picks hechos. Top 3 destacados (dorado/azul/verde). Tabs "Mis Picks ⚡" y "Rivales 🔥" con soporte de URL params `?tab=rivals&date=YYYY-MM-DD`.

#### 6.6. Tracker en vivo del pick ✅
Panel de seguimiento en tiempo real visible en `/pick` y `/dashboard` una vez que el deadline vence.
- [x] Componente `LiveMatchStats`: marcador del partido, badge **EN VIVO** (parpadeante) / **FINALIZADO**, tiros a puerta, goles y minutos jugados del jugador elegido.
- [x] Indicador clave de supervivencia: ✅ con tiro / ⚠️ sin tiro aún (visible incluso si el jugador no fue convocado).
- [x] Minuto aproximado del partido calculado desde `kickoff_time` (ajuste de ~15 min por entretiempo). No exacto — ignora added time.
- [x] Polling automático cada 60 segundos (sincronizado con el worker `sync-live-matches`).
- [x] Fix dashboard: query de match day cambiada de "dentro de la ventana de picks" a "por fecha del día", para que el tracker siga visible durante y después del partido.
- [x] Columna `match_minute INTEGER` en tabla `matches` (migración `20260427000000`) + worker la actualiza desde `fixture.status.elapsed`. `LiveMatchStats` lee el minuto real de DB.
- [x] **Fix minutos desfasados en vivo (15 mayo):** `minutes_played` de la API tiene ~5 min de retraso vs el minuto real del partido. Nueva columna `is_substitute BOOLEAN` en `player_match_stats` (migración `20260515000000`), worker escribe `stats.games.substitute`. `LiveMatchStats` usa `match_minute` para titulares en vivo (preciso) y `minutes_played` para suplentes (rango correcto).

#### 7. Evaluación automática de picks (cron job) ✅
- [x] **Sincronización con API deportiva**: worker/cron que actualiza `matches.status` y `player_match_stats` cada ~60 segundos durante partidos en vivo (`sync-live-matches`).
- [x] **Lock de picks**: `evaluate-picks` marca `user_picks.is_locked = TRUE` al vencer el `effective_deadline`.
- [x] **Evaluación post-partido**: `evaluate-picks` determina `survived / eliminated / void_*`, actualiza `user_picks.result` y `user_status`. Corre cada minuto, idempotente.
- [x] Manejo de casos borde: partido cancelado (`void_cancelled_match`), jugador que no jugó (`void_did_not_play`), usuario sin pick (`no_pick`). (`game-rules.md §7`)
- [x] **Fix trigger `validate_pick_timing`**: permite updates del sistema después del deadline (migración `20260422000000`).
- [ ] *(Futuro)* Respetar ventana de 24h antes de marcar `is_processed = TRUE` (`game-rules.md §6.5`). Actualmente evalúa en cuanto el partido termina.
- [x] **Evaluación por partido (11 mayo):** `evaluate-picks` refactorizado a dos fases. **Fase A (per-match):** evalúa picks en cuanto su partido individual termina — sin esperar al resto del día. Función `evaluatePicksForFinishedMatches()` busca picks `locked + result = NULL` cuyo partido ya esté `finished`/`cancelled` y los evalúa inmediatamente. **Fase B (per-day):** `closeMatchDay()` solo corre cuando TODOS los partidos del día terminaron — maneja eliminación por `no_pick` (E1) y marca `is_processed = TRUE`. La lógica core (`evaluatePick`, `applyResult`) no cambió — solo se reorganizó cuándo se dispara. Presupuesto de API validado: peor caso Mundial (6 partidos/día) = 2,880 de 7,500 req/día (38%).
- [x] **Fix (5 mayo):** `evaluate-picks` evaluaba pre-picks de usuarios ya eliminados y escribía `result = 'survived'` — mostraba "SOBREVIVISTE" en /my-picks para días posteriores a la eliminación. Fix original: join `user_status!inner` + filtro `is_alive = true`. **⚠️ Ese join causó un bug nuevo (ver fix 9 mayo).**
- [x] **Fix (9 mayo):** el join `user_status!inner(is_alive)` causaba `"Could not find a relationship between 'user_picks' and 'user_status' in the schema cache"` en producción — PostgREST no expone esa FK. El cron fallaba silenciosamente en cada corrida sin evaluar nada desde el 5 mayo. Fix: reemplazado por dos queries separadas: fetch de `aliveUserIds` desde `user_status`, luego `.in("user_id", aliveUserIds)` en `user_picks`. Diagnosticado invocando el cron manualmente con curl y leyendo el error en el JSON de respuesta.
- [x] **Fix (5 mayo):** `void_did_not_play` mostraba "ANULADO" en /my-picks — ambiguo (parecía sin consecuencias). Ahora muestra "ELIMINADO" en rojo. "ANULADO" queda solo para `void_cancelled_match`.
- [x] **Caso borde validado (27 abr):** jugador no convocado (sin fila en `player_match_stats`) → resultado `void_did_not_play` → usuario eliminado. Correcto según §4.2 E3 y §7.5. C. Hudson-Odoi no convocado vs Sunderland confirmó el comportamiento.
- [x] **Fix (2 mayo):** `matches.update()` en `sync-live-matches` no tenía manejo de errores — fallos silenciosos dejaban partidos atascados como `live`. Ahora lanza error y loggea en `api_sync_events`.
- [x] **Fix (2 mayo):** safety net de force-finish a las 4 horas en `sync-live-matches` — si un partido lleva más de 4h como `live` en DB desde el kickoff, se fuerza a `finished`. Cubre knockout rounds (ET + penales ≈ 3h worst case).
- [x] **Fix (2 mayo):** `evaluate-picks` podía marcar `is_processed = TRUE` antes de evaluar picks de partidos tardíos (race condition). Ahora verifica que no queden picks bloqueados sin resultado antes de cerrar el día.
- [x] **Backfill (2 mayo):** `total_shots_accumulated` en `user_status` no incluía históricos anteriores al 1 mayo. Corregido con UPDATE de backfill.
- [x] **Fix (3 mayo):** `SYNC_WINDOW_HOURS` reducido de 24 a 2 — con el cron corriendo cada minuto, sincronizar partidos terminados durante 24h agotaba los 7,500 req/día del plan PRO antes del mediodía. 2h es suficiente para correcciones tardías de stats.
- [x] **Fix (3 mayo):** `DashboardPickCard` congelado en "POR INICIAR" cuando el partido arrancaba sin que el usuario recargara. Doble fix: (1) SSR siempre trae el status del partido independientemente del deadline; (2) polling arranca en mount y continúa mientras `status !== 'finished'`.
- [x] **Fix (15 mayo):** usuarios no aprobados eran visibles en el juego. `user_status` se crea al signup antes de la aprobación — el leaderboard los mostraba y `evaluate-picks` los eliminaba por `no_pick`. Fix: leaderboard filtra `users!inner` + `is_approved = true`; Phase A y Phase B de `evaluate-picks` filtran `aliveUserIds` contra usuarios aprobados.
- [x] **Fix (15 mayo):** porcentajes de Rivales sumaban >100%. `Math.round` individual en cada porcentaje → largest remainder method (siempre suma 100).
- [ ] **⚠️ Pendiente Mundial:** al cargar el fixture completo (~1 semana antes del 11 jun), hacer prueba end-to-end de un día completo para verificar que sync y evaluate-picks manejan días con partidos de 1pm a 10pm. Con la evaluación per-match (11 mayo) cada pick se evalúa al terminar su partido, pero conviene validar con datos reales del Mundial.

---

### 🟡 PRIORIDAD MEDIA — Diseño visual y comunicaciones

#### 8. Diseño visual con Claude Design 🔄 En progreso
- [x] **Branding definido:** paleta (azul/rojo/verde/dorado), tipografía (Bebas Neue / Archivo / Archivo Narrow / JetBrains Mono), logo Dirección 3 "El Momento" (balón Telstar + líneas de movimiento). Documentado en `CLAUDE.md §Sistema de diseño`.
- [x] **Sistema de diseño base:** fuentes en `app/layout.tsx`, CSS variables + keyframes en `globals.css`, componente `TPMark` / `TPWordmark` / `TPLockup` en `components/brand/tp-mark.tsx`.
- [x] Arrancar diseños con Claude Design — enfoque **mobile-first**. Bundle exportado el 29 abr con: Login (4 variantes), Dashboard (4 artboards + desktop), Pick del día (3 artboards), Logo (3 direcciones).
- [x] **Login D implementado** en `components/auth/login-form.tsx`. OAuth buttons con logo Google real en `components/auth/oauth-buttons.tsx`.
- [x] **Dashboard implementado** — 4 escenarios: VIVO·Pick urgente (countdown + CTA), VIVO·Pick en vivo (stats + polling), VIVO·Sin partidos (luna + RACHA PROTEGIDA), ELIMINADO. Nav inferior fijo rediseñado (`nav-links.tsx`). Layout del juego simplificado a shell oscuro + nav. `DashboardPickCard` (Client Component) en `components/game/dashboard-pick-card.tsx`.
- [x] **Pick del día implementado** — 3 estados: vacío/eligiendo, pick planeado (modificable), pick bloqueado/en vivo. Rediseño completo de `pick-day-nav.tsx`, `pick-match-card.tsx`, `pick-client.tsx` y `pick/page.tsx`. Cards oscuras por partido con 2 columnas de jugadores, position badges (POR/DEF/MED/DEL con colores), countdown inline, badge EN VIVO con minuto real, confirmed pick card verde (con `LiveMatchStats` integrado en el estado bloqueado), panel de confirmación sticky oscuro con CTA signature.
- [x] **`/my-picks` implementado** (diseño propio) — cards con borde de color por resultado, position badges, stats post-evaluación, pill de jugadores quemados.
- [x] **`/leaderboard` implementado** (diseño propio) — tabla de ranking con líder destacado en dorado, fila propia en azul/dorado, sección de eliminados separada, columnas Días/Goles/Estado.
- [x] **Barra de marca global** en `app/(game)/layout.tsx` — `TPMark` + wordmark centrado en todas las pestañas, clickeable → `/dashboard`.
- [x] **`/signup` rediseñado** — misma identidad visual que login (Dirección 3). `TPMark` 72px, campos con íconos, `DarkCheckbox` custom para `over_18_confirmed` y `marketing_emails_opt_in`, CTA signature, esquinas HUD, validación en cliente.
- [x] **`LiveMatchStats` rediseñado** — panel oscuro integrado con identidad Dirección 3. Score Bebas Neue, stats grandes con glow de color, badges JetBrains Mono. Sin Tailwind.
- [x] **`/reset-password` y `/update-password` rediseñados** — identidad Dirección 3 completa. HUD corners, halo dorado, `TPMark` 72px, campos con íconos, toggle show/hide en passwords, estados de éxito en verde, CTA signature.
- [x] **Tarea 9 — Responsividad desktop**: contenido de game layout centrado a `max-width: 480px`. Brand bar full-width con contenido centrado. Confirm panel del pick corregido a 480px. Auth pages ya estaban centradas a 460px.
- [x] **`/verify-email` rediseñado** — card con ícono de sobre, hint de spam/24h, link al login. Mismo lenguaje visual que resto de auth.
- [x] **`/complete-profile` rediseñado** — página post-OAuth Google. Campo username con ícono y hint, 2 `DarkCheckbox` (mayoría de edad + marketing), CTA "Continuar al desafío", nota de "Autenticado con Google" al pie. Identidad Dirección 3 completa. Todas las pantallas de auth ahora tienen diseño consistente.

### 🟡 PRIORIDAD MEDIA — Comunicaciones y UX completa

#### 9. Emails transaccionales (Resend) ✅ (parcial)
- [x] Configurar Resend — SDK instalado, API key en Vercel, `lib/email/` creado.
- [x] Email de notificación de eliminación — se dispara desde `evaluate-picks` con razón, días y goles. (`game-rules.md §12.1`)
- [x] Email de recordatorio de pick pendiente — cron hourly `send-pick-reminders`, 2h antes del último partido. (`game-rules.md §13.5`)
- [x] Email al admin de nuevo registro — se dispara en `signUp` y `completeProfile`.
- [x] Email de cuenta aprobada — se dispara desde `approveUser` en `lib/admin/actions.ts`. Template `account-approved.ts` con identidad Dirección 3: banner verde, reglas del juego, CTA "Entrar al torneo".
- [x] Email de verificación de cuenta — template con marca en `lib/email/templates/supabase/confirm-signup.html`. Pegado en Supabase Dashboard → Auth → Email Templates → Confirm signup. Subject: "Confirma tu cuenta — Tiro a Puerta Challenge".
- [x] Email de recuperación de contraseña — template con marca en `lib/email/templates/supabase/reset-password.html`. Pegado en Supabase Dashboard → Auth → Email Templates → Reset password. Subject: "Recupera tu contraseña — Tiro a Puerta Challenge".
- [x] Configurar dominio propio de envío en Resend — `tiroapuerta.mx` verificado. `EMAIL_FROM=no-reply@tiroapuerta.mx` en Vercel. DNS configurado via Cloudflare auto-configure.
- [ ] Email de notificaciones críticas (cambios de reglas, suspensión del torneo, etc.).

#### 10. Perfil de usuario ✅ (parcial)
- [x] Página de perfil (`/profile`): cambiar username (editable inline, validado), gestionar marketing emails opt-in (toggle optimista).
- [x] 5to tab "Perfil" en nav inferior. `LogoutButton` movido de dashboard a profile.
- [x] Card "Tu cuenta": username editable, email readonly, proveedor (Google/Email). Card "Preferencias": toggle marketing. Card "Zona de peligro": cerrar sesión.
- [x] Card "Reglas del juego": colapsable, 8 reglas clave con iconos + "Autoridad de Tiro a Puerta" (API como fuente de verdad).
- [ ] Ver historial completo de picks del propio usuario. *(Ya existe en `/my-picks` — no duplicar.)*
- [ ] Opción de eliminar cuenta (soft-delete con anonimización, `database-schema.md §3.1`). *(Botón placeholder "Próximamente".)*

#### 11. Anti-trampa y seguridad
- [ ] Rate limiting en endpoints sensibles (`game-rules.md §11.1`).
- [ ] CAPTCHA en registro y login (después de 3 intentos fallidos).
- [ ] Device fingerprinting pasivo (hash user-agent + IP) en `pick_history`.
- [ ] Alertas automáticas ante patrones anómalos.

---

### 🟢 PRIORIDAD MEDIA-BAJA — Calidad y operación

#### 12. Tests críticos
- [x] Tests unitarios para `evaluate-pick` (lógica de supervivencia/eliminación) — 10 tests en `tests/game/evaluate-pick.test.ts`, función pura en `lib/game/evaluate-pick.ts`. Vitest instalado.
- [ ] Tests para validación de deadlines. *(Validado en producción con PL — trigger `validate_pick_timing` lo aplica a nivel DB.)*
- [ ] Tests para "no repetir jugador". *(Constraint `unique_player_per_user` lo aplica a nivel DB — validado en producción.)*
- [ ] Tests para casos borde: partido suspendido, cancelado, jugador no convocado, autogol (`game-rules.md §7`). *(Cancelado y no convocado cubiertos en tests de evaluate-pick. Suspendido y autogol pendientes — requieren escenarios reales.)*
- [ ] Tests para lógica de desempate (goles acumulados, `game-rules.md §5`). *(El desempate es puro ordering en la query SQL — validado visualmente en leaderboard con datos reales.)*

#### 13. Monitoreo y operación
- [x] Configurar Sentry para errores en producción — SDK instalado, DSN configurado en Vercel, alertas por email activadas.
- [x] Configurar Vercel Analytics — habilitado en Vercel Pro, `<Analytics />` en `app/layout.tsx`.
- [ ] Alertas de DB: queries lentas, conexiones al límite, fallos de sync con API (`database-schema.md §9.4`).
- [x] Remover página `/health-check` — eliminada el 12 mayo.
- [x] **Performance UX (5 mayo):** `loading.tsx` en las 4 rutas del juego — componente compartido `PageLoading` con spinner dorado + shimmer cards. Navegación entre pestañas da feedback inmediato. `PickDayNav` convertido a Client Component con `useTransition`: spinner + dim al navegar entre días.

#### 14. Despliegue y configuración de producción
- [x] Crear proyecto en Vercel y conectar el repo de GitHub (`elih98-droid/tiro-a-puerta-challenge`, rama `main`).
- [x] Configurar variables de entorno en Vercel (5 vars: Supabase URL/anon/service role, API-Football key, CRON_SECRET).
- [x] **App en producción** — `tiroapuerta.mx` funcionando con dominio propio.
- [x] **Fix Site URL de Supabase** — corregido a `https://tiroapuerta.mx`. Redirect URLs con wildcard configuradas para prod y localhost.
- [x] **Dominio personalizado** — `tiroapuerta.mx` comprado y configurado. Vercel apunta al dominio. `www` hace redirect 301 a raíz. `NEXT_PUBLIC_APP_URL` y Supabase Site URL actualizados. App live en `https://tiroapuerta.mx`.
- [x] **Custom Domain en Supabase** — `auth.tiroapuerta.mx` configurado (Supabase Pro + CNAME en Cloudflare + TXT de verificación). Google OAuth redirect URI actualizada. Popup de Google ahora muestra dominio propio.
- [x] **Upgrade a Vercel Pro** — plan activo desde 1 de mayo. Cron Jobs reactivados en `vercel.json` (`* * * * *`).
- [ ] Configurar backups de Supabase más frecuentes durante el torneo (`database-schema.md §9.3`).
- [x] **Desactivar branch protection en GitHub** — hecho el 4 de mayo. Push directo a `main`.

---

### ⚪ DECISIONES ABIERTAS (bloquean o condicionan algunas tareas)

Estas decisiones están pendientes. Cuando estén resueltas, actualizar tareas afectadas:

- [x] **Proveedor de datos deportivos** — **API-Football** (api-football.com). Plan PRO, 3 meses. API key configurada en `.env.local`.
- [x] **Modelo económico y premios** — Decidido: premio $150,000 MXN al ganador, premios para Top 5, entrada $1,000 MXN por participante.
- [x] **Estructura legal (T&C + Privacidad)** — Página `/terms` con 21 secciones: T&C completos + Aviso de Privacidad LFPDPPP. Organizadores: Elías Hale, Daniel Occelli, Víctor Bensimon. Checkbox obligatorio en signup y complete-profile. Columna `terms_accepted_at` en `public.users`. Pendiente: configurar emails `privacidad@tiroapuerta.mx` y `contacto@tiroapuerta.mx`.
- [ ] **Ventana exacta del recordatorio de pick** (`game-rules.md §13.5`).
- [x] **Criterios de desempate secundarios** — Resuelto: tiros totales acumulados (`total_shots_accumulated`) como segundo desempate. `game-rules.md §5.3` actualizado.
- [x] **Branding y diseño visual** — Identidad Dirección 3 implementada en todas las pantallas. Paleta, tipografía, `TPMark` SVG, sistema de diseño completo.

---

## Resumen de progreso

| Área | Estado |
|------|--------|
| Setup inicial (Next.js, Supabase, env) | ✅ Completo |
| Documentación base | ✅ Completo |
| Schema de base de datos | ✅ Aplicado en Supabase / versionado en repo |
| Autenticación | ✅ Completo |
| Aprobación manual de cuentas | ✅ Completo |
| Dashboard del usuario | ✅ Completo (básico) |
| Integración API-Football + pruebas Premier League | ✅ Completo — prueba en vivo superada (22 abr) |
| Evaluación automática de picks (cron) | ✅ Completo — loop end-to-end verificado (22 abr) |
| Precarga de datos del Mundial | ⏳ Pendiente (~1 semana antes del 11 jun) |
| Mecánica de picks | ✅ Completo |
| Mis picks (/my-picks) + Rivales 🔥 | ✅ Completo |
| Tracker en vivo del pick | ✅ Completo |
| PWA (manifest + íconos + safe areas) | ✅ Completo — instalable en Android y iOS |
| Diseño visual (tareas 8–9) | ✅ Completo — todas las pantallas + responsividad desktop |
| Leaderboard | ✅ Completo (pick de hoy pendiente) |
| Evaluación automática (cron) | ✅ Completo |
| Emails transaccionales | ✅ Completo — 6 emails con marca, dominio propio `tiroapuerta.mx` |
| Términos y Condiciones + Privacidad | ✅ Completo — `/terms` con 21 secciones, checkbox obligatorio, `terms_accepted_at` en DB |
| Perfil de usuario | 🔄 Parcial (username, marketing opt-in, logout, reglas; eliminar cuenta pendiente) |
| Tests críticos | 🔄 Parcial (evaluate-pick ✅, resto validado en producción) |
| Monitoreo y producción | 🔄 Parcial (Sentry + Analytics listos) |
| Supabase Pro + Custom Domain | ✅ Completo — `auth.tiroapuerta.mx` (13 mayo) |
| Vercel Pro + crons activos | ✅ Completo (1 mayo) |

---

*Fin del documento.*
