# ROADMAP — Tiro a Puerta Challenge: Mundial 2026

**Última actualización:** 4 de mayo de 2026 (emails transaccionales implementados, panel admin mobile-first, fix rejectUser FK cascade)
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

#### 6. Leaderboard ✅
- [x] Página pública de leaderboard (`/leaderboard`) — accesible sin autenticación.
- [x] Mostrar: usuarios vivos, goles acumulados, días sobrevividos. Fila del usuario actual resaltada.
- [x] Ordenar: vivos primero → goles acumulados DESC → días sobrevividos DESC (§5.1).
- [x] Usuarios sin sesión ven el leaderboard con link "Iniciar sesión" en lugar del nav autenticado.
- [x] Fix: `/my-picks` agregado a `PROTECTED_ROUTES` en proxy (bug pre-existente).
- [ ] *(Pendiente)* Mostrar "pick de hoy" de cada usuario en el leaderboard, solo después del deadline (`game-rules.md §10.1`). Requiere query extra por usuario — diferido.

#### 6.5. Mis picks (`/my-picks`) ✅
Sección privada donde cada participante puede ver un resumen de todos sus picks por día — para tener claridad de qué jugadores ya usó y cuáles aún tiene disponibles.
- [x] Página `/my-picks`: lista de días jugados con el jugador elegido, resultado del día (sobrevivió / eliminado / anulado / pendiente) y tiro a puerta/goles si aplica.
- [x] Indicar visualmente qué jugadores ya están quemados — contador al tope ("X jugadores usados") y badge por cada entrada.
- [x] Ordenar por día (más reciente primero).
- [x] Mostrar picks futuros/planeados también (pre-picks con badge "Pendiente").
- [x] Fix: navegación de días en `/pick` ahora funciona aunque hoy no tenga partidos (always-run prev/next query + PickDayNav en el empty state).

#### 6.6. Tracker en vivo del pick ✅
Panel de seguimiento en tiempo real visible en `/pick` y `/dashboard` una vez que el deadline vence.
- [x] Componente `LiveMatchStats`: marcador del partido, badge **EN VIVO** (parpadeante) / **FINALIZADO**, tiros a puerta, goles y minutos jugados del jugador elegido.
- [x] Indicador clave de supervivencia: ✅ con tiro / ⚠️ sin tiro aún (visible incluso si el jugador no fue convocado).
- [x] Minuto aproximado del partido calculado desde `kickoff_time` (ajuste de ~15 min por entretiempo). No exacto — ignora added time.
- [x] Polling automático cada 60 segundos (sincronizado con el worker `sync-live-matches`).
- [x] Fix dashboard: query de match day cambiada de "dentro de la ventana de picks" a "por fecha del día", para que el tracker siga visible durante y después del partido.
- [x] Columna `match_minute INTEGER` en tabla `matches` (migración `20260427000000`) + worker la actualiza desde `fixture.status.elapsed`. `LiveMatchStats` lee el minuto real de DB.

#### 7. Evaluación automática de picks (cron job) ✅
- [x] **Sincronización con API deportiva**: worker/cron que actualiza `matches.status` y `player_match_stats` cada ~60 segundos durante partidos en vivo (`sync-live-matches`).
- [x] **Lock de picks**: `evaluate-picks` marca `user_picks.is_locked = TRUE` al vencer el `effective_deadline`.
- [x] **Evaluación post-partido**: `evaluate-picks` determina `survived / eliminated / void_*`, actualiza `user_picks.result` y `user_status`. Corre cada minuto, idempotente.
- [x] Manejo de casos borde: partido cancelado (`void_cancelled_match`), jugador que no jugó (`void_did_not_play`), usuario sin pick (`no_pick`). (`game-rules.md §7`)
- [x] **Fix trigger `validate_pick_timing`**: permite updates del sistema después del deadline (migración `20260422000000`).
- [ ] *(Futuro)* Respetar ventana de 24h antes de marcar `is_processed = TRUE` (`game-rules.md §6.5`). Actualmente evalúa en cuanto todos los partidos del día están `finished`.
- [x] **Caso borde validado (27 abr):** jugador no convocado (sin fila en `player_match_stats`) → resultado `void_did_not_play` → usuario eliminado. Correcto según §4.2 E3 y §7.5. C. Hudson-Odoi no convocado vs Sunderland confirmó el comportamiento.
- [x] **Fix (2 mayo):** `matches.update()` en `sync-live-matches` no tenía manejo de errores — fallos silenciosos dejaban partidos atascados como `live`. Ahora lanza error y loggea en `api_sync_events`.
- [x] **Fix (2 mayo):** safety net de force-finish a las 4 horas en `sync-live-matches` — si un partido lleva más de 4h como `live` en DB desde el kickoff, se fuerza a `finished`. Cubre knockout rounds (ET + penales ≈ 3h worst case).
- [x] **Fix (2 mayo):** `evaluate-picks` podía marcar `is_processed = TRUE` antes de evaluar picks de partidos tardíos (race condition). Ahora verifica que no queden picks bloqueados sin resultado antes de cerrar el día.
- [x] **Backfill (2 mayo):** `total_shots_accumulated` en `user_status` no incluía históricos anteriores al 1 mayo. Corregido con UPDATE de backfill.
- [x] **Fix (3 mayo):** `SYNC_WINDOW_HOURS` reducido de 24 a 2 — con el cron corriendo cada minuto, sincronizar partidos terminados durante 24h agotaba los 7,500 req/día del plan PRO antes del mediodía. 2h es suficiente para correcciones tardías de stats.
- [x] **Fix (3 mayo):** `DashboardPickCard` congelado en "POR INICIAR" cuando el partido arrancaba sin que el usuario recargara. Doble fix: (1) SSR siempre trae el status del partido independientemente del deadline; (2) polling arranca en mount y continúa mientras `status !== 'finished'`.
- [ ] **⚠️ Pendiente Mundial:** al cargar el fixture completo (~1 semana antes del 11 jun), hacer prueba end-to-end de un día completo para verificar que sync y evaluate-picks manejan días con partidos de 1pm a 10pm. Los horarios del Mundial varían mucho por grupos y fases.

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
- [ ] Email de verificación de cuenta — actualmente lo manda Supabase con template genérico. Personalizar con Resend y template de marca.
- [ ] Email de recuperación de contraseña — ídem, actualmente template genérico de Supabase.
- [ ] Email de notificaciones críticas (cambios de reglas, suspensión del torneo, etc.).
- [ ] Configurar dominio propio de envío en Resend (actualmente usa `onboarding@resend.dev`). Requiere dominio personalizado.

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
- [x] Crear proyecto en Vercel y conectar el repo de GitHub (`elih98-droid/tiro-a-puerta-challenge`, rama `main`).
- [x] Configurar variables de entorno en Vercel (5 vars: Supabase URL/anon/service role, API-Football key, CRON_SECRET).
- [x] **App en producción** — `tiro-a-puerta.vercel.app` funcionando. Login, diseño y navegación verificados.
- [x] **Fix Site URL de Supabase** — corregido a `https://tiro-a-puerta.vercel.app`. Links de confirmación de email y reset apuntan a producción. Redirect URLs con wildcard configuradas para prod y localhost.
- [ ] Configurar dominio personalizado.
- [ ] **Custom Domain en Supabase** (plan Pro de Supabase) — para que el popup de Google OAuth muestre "Tiro a Puerta Challenge" en lugar del subdominio de Supabase. Requiere dominio propio.
- [x] **Upgrade a Vercel Pro** — plan activo desde 1 de mayo. Cron Jobs reactivados en `vercel.json` (`* * * * *`).
- [ ] Configurar backups de Supabase más frecuentes durante el torneo (`database-schema.md §9.3`).
- [x] **Desactivar branch protection en GitHub** — hecho el 4 de mayo. Push directo a `main`.

---

### ⚪ DECISIONES ABIERTAS (bloquean o condicionan algunas tareas)

Estas decisiones están pendientes. Cuando estén resueltas, actualizar tareas afectadas:

- [x] **Proveedor de datos deportivos** — **API-Football** (api-football.com). Plan PRO, 3 meses. API key configurada en `.env.local`.
- [ ] **Modelo económico y premios** (puede afectar flujo de registro y T&C).
- [ ] **Estructura legal** — Persona física o moral, T&C, aviso de privacidad.
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
| Mis picks (/my-picks) | ✅ Completo |
| Tracker en vivo del pick | ✅ Completo |
| Diseño visual (tareas 8–9) | ✅ Completo — todas las pantallas + responsividad desktop |
| Leaderboard | ✅ Completo (pick de hoy pendiente) |
| Evaluación automática (cron) | ✅ Completo |
| Emails transaccionales | 🔄 Parcial (eliminación + recordatorio + admin listos; verificación/reset pendiente) |
| Tests críticos | ⏳ Pendiente |
| Monitoreo y producción | ⏳ Pendiente |
| Vercel Pro + crons activos | ✅ Completo (1 mayo) |

---

*Fin del documento.*
