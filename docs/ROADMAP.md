# ROADMAP — Tiro a Puerta Challenge: Mundial 2026

**Última actualización:** 22 de abril de 2026 (noche — tarea 5 completa)
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
- [ ] *(Opcional)* **Email al admin** cuando alguien se registra (vía Resend). *(Diferido a tarea 9.)*
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
- [ ] Mostrar jugadores quemados del usuario. *(Se agrega cuando haya picks.)*

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

#### 6. Leaderboard
- [ ] Página pública de leaderboard (`/leaderboard`).
- [ ] Mostrar: usuarios vivos, goles acumulados, días sobrevividos.
- [ ] Ordenar: primero por vivos/eliminados, luego por goles acumulados (desempate §5.1).
- [ ] Mostrar picks de otros usuarios (solo después del deadline, `game-rules.md §10.1`).

#### 6.5. Mis picks (`/my-picks`)
Sección privada donde cada participante puede ver un resumen de todos sus picks por día — para tener claridad de qué jugadores ya usó y cuáles aún tiene disponibles.
- [ ] Página `/my-picks` (o sección dentro del dashboard): lista de días jugados con el jugador elegido, resultado del día (sobrevivió / eliminado / anulado / pendiente) y tiro a puerta/goles si aplica.
- [ ] Indicar visualmente jugadores "quemados" (ya usados) vs. disponibles.
- [ ] Ordenar por día (más reciente primero).
- [ ] Mostrar picks futuros/planeados también (pre-picks pendientes de evaluación).

#### 7. Evaluación automática de picks (cron job) ✅
- [x] **Sincronización con API deportiva**: worker/cron que actualiza `matches.status` y `player_match_stats` cada ~60 segundos durante partidos en vivo (`sync-live-matches`).
- [x] **Lock de picks**: `evaluate-picks` marca `user_picks.is_locked = TRUE` al vencer el `effective_deadline`.
- [x] **Evaluación post-partido**: `evaluate-picks` determina `survived / eliminated / void_*`, actualiza `user_picks.result` y `user_status`. Corre cada minuto, idempotente.
- [x] Manejo de casos borde: partido cancelado (`void_cancelled_match`), jugador que no jugó (`void_did_not_play`), usuario sin pick (`no_pick`). (`game-rules.md §7`)
- [x] **Fix trigger `validate_pick_timing`**: permite updates del sistema después del deadline (migración `20260422000000`).
- [ ] *(Futuro)* Respetar ventana de 24h antes de marcar `is_processed = TRUE` (`game-rules.md §6.5`). Actualmente evalúa en cuanto todos los partidos del día están `finished`.

---

### 🟡 PRIORIDAD MEDIA — Diseño visual y comunicaciones

#### 8. Diseño visual con Claude Design
*(Se ataca una vez que la mecánica core esté funcional: auth + picks + leaderboard.)*
- [ ] Definir branding: paleta de colores, tipografía, logo (decisión abierta).
- [ ] Usar Claude Design para generar los componentes visuales principales (páginas de login/signup, dashboard, selector de pick, leaderboard).
- [ ] Aplicar el diseño sobre las páginas funcionales ya construidas.
- [ ] Revisar responsividad (mobile-first — la mayoría de usuarios entrarán desde el celular).

### 🟡 PRIORIDAD MEDIA — Comunicaciones y UX completa

#### 9. Emails transaccionales (Resend)
- [ ] Configurar Resend y definir dominio de envío.
- [ ] Email de verificación de cuenta.
- [ ] Email de recuperación de contraseña.
- [ ] Email de notificación de eliminación (con razón específica, `game-rules.md §12.1`).
- [ ] Email de recordatorio de pick pendiente (N horas antes del deadline, ventana exacta por definir — `game-rules.md §13.5`).
- [ ] Email de notificaciones críticas (cambios de reglas, etc.).

#### 10. Perfil de usuario
- [ ] Página de perfil (`/profile`): cambiar username, gestionar marketing emails opt-in.
- [ ] Ver historial completo de picks del propio usuario.
- [ ] Opción de eliminar cuenta (soft-delete con anonimización, `database-schema.md §3.1`).

#### 11. Anti-trampa y seguridad
- [ ] Rate limiting en endpoints sensibles (`game-rules.md §11.1`).
- [ ] CAPTCHA en registro y login (después de 3 intentos fallidos).
- [ ] Device fingerprinting pasivo (hash user-agent + IP) en `pick_history`.
- [ ] Alertas automáticas ante patrones anómalos.

---

### 🟢 PRIORIDAD MEDIA-BAJA — Calidad y operación

#### 12. Tests críticos
- [ ] Tests unitarios para `evaluate-pick` (lógica de supervivencia/eliminación).
- [ ] Tests para validación de deadlines.
- [ ] Tests para "no repetir jugador".
- [ ] Tests para casos borde: partido suspendido, cancelado, jugador no convocado, autogol (`game-rules.md §7`).
- [ ] Tests para lógica de desempate (goles acumulados, `game-rules.md §5`).

#### 13. Monitoreo y operación
- [ ] Configurar Sentry para errores en producción.
- [ ] Configurar Vercel Analytics.
- [ ] Alertas de DB: queries lentas, conexiones al límite, fallos de sync con API (`database-schema.md §9.4`).
- [ ] Remover página `/health-check` antes de producción.

#### 14. Despliegue y configuración de producción
- [ ] Configurar proyecto en Vercel (variables de entorno, dominio).
- [ ] Configurar Vercel Cron Jobs para workers.
- [ ] Configurar backups de Supabase más frecuentes durante el torneo (`database-schema.md §9.3`).

---

### ⚪ DECISIONES ABIERTAS (bloquean o condicionan algunas tareas)

Estas decisiones están pendientes. Cuando estén resueltas, actualizar tareas afectadas:

- [x] **Proveedor de datos deportivos** — **API-Football** (api-football.com). Plan PRO, 3 meses. API key configurada en `.env.local`.
- [ ] **Modelo económico y premios** (puede afectar flujo de registro y T&C).
- [ ] **Estructura legal** — Persona física o moral, T&C, aviso de privacidad.
- [ ] **Ventana exacta del recordatorio de pick** (`game-rules.md §13.5`).
- [ ] **Criterios de desempate secundarios** — Revisar si los de `game-rules.md §5.3` son definitivos.
- [ ] **Branding y diseño visual** — Logo, paleta de colores, tipografía.

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
| Mecánica de picks | ⏳ Pendiente |
| Leaderboard | ⏳ Pendiente |
| Evaluación automática (cron) | ✅ Completo |
| Emails transaccionales | ⏳ Pendiente |
| Tests críticos | ⏳ Pendiente |
| Monitoreo y producción | ⏳ Pendiente |

---

*Fin del documento.*
