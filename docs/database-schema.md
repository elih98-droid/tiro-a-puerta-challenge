# Schema de Base de Datos — Quiniela Mundial FIFA 2026

**Versión:** 1.0 (borrador inicial)
**Última actualización:** Abril 2026
**Motor:** PostgreSQL 15+ (vía Supabase)
**Documento relacionado:** `game-rules.md` — las reglas del juego son la fuente de verdad; este schema es la traducción técnica de esas reglas.

> Este documento define la estructura de datos del proyecto. Para entender *por qué* algo está así, consulta `game-rules.md`. Este schema está optimizado para el Mundial 2026; no pretende ser genérico para otros torneos.

---

## Índice

1. [Visión general y principios](#1-visión-general-y-principios)
2. [Diagrama conceptual](#2-diagrama-conceptual)
3. [Tablas del schema](#3-tablas-del-schema)
4. [Índices](#4-índices)
5. [Constraints y reglas a nivel DB](#5-constraints-y-reglas-a-nivel-db)
6. [Row Level Security (RLS)](#6-row-level-security-rls)
7. [Funciones y triggers](#7-funciones-y-triggers)
8. [Scripts SQL completos](#8-scripts-sql-completos)
9. [Notas de operación](#9-notas-de-operación)

---

## 1. Visión general y principios

### 1.1 Principios de diseño

**Integridad referencial estricta.** Todas las relaciones usan foreign keys. No confiamos en el código de la aplicación para mantener consistencia; si el schema lo puede enforcar, lo enforca.

**Las reglas críticas del juego se enforcan a nivel DB.** Ejemplo: un usuario no puede elegir al mismo jugador dos veces. Esto se impone con un `UNIQUE INDEX`, no solo con lógica de aplicación. Así, aunque haya bugs en el código, la DB mantiene consistencia.

**Timestamps en todas las tablas.** `created_at` y `updated_at` son campos estándar en todas las tablas. Permiten debug, auditoría y features futuros.

**UUIDs para identidades públicas, bigserial para uso interno.** Los IDs que aparecen en URLs (usuarios, ligas futuras) son UUIDs para no exponer información enumerable. Los IDs internos de tablas de referencia pueden ser enteros.

**Soft-delete con anonimización para datos personales.** Al ejecutar "eliminar mi cuenta" (derecho ARCO), no se borra el registro sino que los campos de identificación se anonimizan. Esto mantiene la integridad histórica (leaderboards) sin violar privacidad.

**Auditoría ligera de decisiones del sistema.** Los eventos que afectan picks (ej: "este pick resultó eliminado porque la API reportó 0 tiros") guardan timestamp y referencia al dato de la API que causó esa decisión.

### 1.2 Decisiones técnicas fijas

- **Zona horaria**: todas las columnas `timestamp` son `TIMESTAMPTZ` (con zona). La zona horaria oficial del juego es `America/Mexico_City`, pero se almacena en UTC y se convierte en la capa de aplicación o en queries.
- **Encoding**: UTF-8 en todo (default de Supabase).
- **Naming convention**: snake_case para tablas y columnas. Tablas en plural (`users`, `matches`). Nombres descriptivos, sin abreviaciones oscuras.

---

## 2. Diagrama conceptual

Las entidades principales y sus relaciones:

```
┌─────────────┐         ┌──────────────────┐
│   users     │ 1────N  │   user_picks     │
│             │         │ (pick final)     │
└─────────────┘         └──────────────────┘
       │                         │
       │                         │ N
       │                         │
       │                         ▼
       │                ┌──────────────────┐
       │                │   pick_history   │
       │                │ (cambios previos)│
       │                └──────────────────┘
       │
       │ 1────N
       ▼
┌─────────────┐
│user_status  │  (estado de eliminación por usuario)
└─────────────┘


┌─────────────┐         ┌─────────────┐
│    teams    │ 1────N  │   players   │
└─────────────┘         └─────────────┘
       │                       │
       │ N                     │ N
       │                       │
       ▼                       │
┌─────────────┐                │
│   matches   │ 1────N ────────┤
│             │                │
└─────────────┘                │
       │                       │
       │ 1                     │
       │                       │
       ▼                       ▼
┌──────────────────────────────────┐
│       player_match_stats         │
│  (stats del jugador en partido)  │
└──────────────────────────────────┘


┌─────────────────┐
│  match_days     │  (días del torneo con partidos)
└─────────────────┘
       │
       │ 1────N
       ▼
┌─────────────┐
│   matches   │
└─────────────┘


┌──────────────────────┐
│  api_sync_events     │  (log de sincronización con fuente oficial)
└──────────────────────┘


┌────────────────────────┐
│  admin_appeals         │  (apelaciones humanas, caso por caso)
└────────────────────────┘
```

---

## 3. Tablas del schema

### 3.1 `users`

Usuarios registrados en la plataforma. Vinculada a `auth.users` de Supabase (que maneja la autenticación).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `UUID` PRIMARY KEY | Mismo ID que `auth.users.id` de Supabase. |
| `email` | `TEXT` UNIQUE NOT NULL | Email del usuario (para login y comunicaciones). |
| `username` | `TEXT` UNIQUE NOT NULL | Nombre público en leaderboard. 3-20 caracteres. |
| `email_verified` | `BOOLEAN` DEFAULT FALSE | Si el usuario verificó su email. Los usuarios OAuth entran con TRUE. |
| `over_18_confirmed` | `BOOLEAN` NOT NULL | Checkbox de edad marcado al registrarse. |
| `marketing_emails_opt_in` | `BOOLEAN` DEFAULT FALSE | Si recibe emails de marketing. Los transaccionales siempre van. |
| `auth_provider` | `TEXT` NOT NULL | `'email'`, `'google'`, `'apple'`. |
| `is_deleted` | `BOOLEAN` DEFAULT FALSE | Soft-delete por petición ARCO. Si TRUE, email y username están anonimizados. |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

**Notas:**
- Cuando un usuario pide eliminar su cuenta: `is_deleted = TRUE`, `email = 'deleted_<uuid>@anonymous.local'`, `username = 'deleted_user_<short_hash>'`. Los picks y registros históricos se mantienen intactos.
- No se guarda password en esta tabla: Supabase Auth maneja eso en su propia tabla `auth.users`.

### 3.2 `teams`

Los 48 equipos del Mundial 2026. Tabla pequeña, precargada antes del torneo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `SERIAL` PRIMARY KEY | ID interno. |
| `name` | `TEXT` NOT NULL | Nombre oficial (ej: "México", "Alemania"). |
| `code` | `TEXT` UNIQUE NOT NULL | Código ISO-3 (ej: "MEX", "GER"). |
| `group_letter` | `CHAR(1)` NOT NULL | Grupo del torneo (A-L). |
| `flag_url` | `TEXT` | URL de la bandera (Supabase Storage). |
| `api_external_id` | `TEXT` | ID del equipo en la API externa de datos deportivos. |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

### 3.3 `players`

Todos los jugadores convocables. Precargada una vez que FIFA publique las plantillas oficiales (típicamente 1 semana antes del torneo). Admite actualizaciones durante el torneo por si hay reemplazos por lesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `SERIAL` PRIMARY KEY | ID interno. |
| `team_id` | `INTEGER` REFERENCES `teams(id)` NOT NULL | Equipo del jugador. |
| `full_name` | `TEXT` NOT NULL | Nombre completo del jugador. |
| `display_name` | `TEXT` NOT NULL | Nombre como aparece en camiseta (ej: "Messi"). |
| `position` | `TEXT` NOT NULL | `'GK'`, `'DEF'`, `'MID'`, `'FWD'`. |
| `jersey_number` | `INTEGER` | Número de camiseta. |
| `photo_url` | `TEXT` | URL de la foto del jugador. |
| `api_external_id` | `TEXT` UNIQUE NOT NULL | ID del jugador en la API externa (crítico para sincronización). |
| `is_active` | `BOOLEAN` DEFAULT TRUE | FALSE si el jugador fue removido del torneo (lesión grave). |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

### 3.4 `match_days`

Días del torneo en los que hay al menos un partido. Precargada antes del torneo con todos los días de partidos según calendario FIFA.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `SERIAL` PRIMARY KEY | |
| `match_date` | `DATE` UNIQUE NOT NULL | Fecha del día (según hora CDMX). Ejemplo: `'2026-06-11'`. |
| `day_number` | `INTEGER` UNIQUE NOT NULL | Número secuencial del día de pick (1, 2, 3... hasta el último). |
| `pick_window_opens_at` | `TIMESTAMPTZ` NOT NULL | Momento en que abre la ventana de picks para este día. |
| `pick_window_closes_at` | `TIMESTAMPTZ` NOT NULL | Deadline del último partido del día (5 min antes del kickoff del último). Útil para saber cuándo cerrar el día completo. |
| `is_processed` | `BOOLEAN` DEFAULT FALSE | TRUE cuando todos los partidos del día terminaron y los picks se evaluaron. |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

### 3.5 `matches`

Los 104 partidos del Mundial. Se actualizan conforme ocurre la fase eliminatoria (los oponentes se determinan al final de la fase previa).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `SERIAL` PRIMARY KEY | |
| `match_day_id` | `INTEGER` REFERENCES `match_days(id)` NOT NULL | Día al que pertenece el partido. |
| `match_number` | `INTEGER` UNIQUE NOT NULL | Número del partido según FIFA (1-104). |
| `stage` | `TEXT` NOT NULL | `'group'`, `'round_of_32'`, `'round_of_16'`, `'quarterfinal'`, `'semifinal'`, `'third_place'`, `'final'`. |
| `home_team_id` | `INTEGER` REFERENCES `teams(id)` | NULL si aún no está determinado (fases eliminatorias). |
| `away_team_id` | `INTEGER` REFERENCES `teams(id)` | NULL si aún no está determinado. |
| `kickoff_time` | `TIMESTAMPTZ` NOT NULL | Kickoff oficial del partido. |
| `pick_deadline` | `TIMESTAMPTZ` NOT NULL | Kickoff - 5 minutos. Campo calculado para queries rápidas. |
| `venue` | `TEXT` | Estadio. |
| `status` | `TEXT` NOT NULL DEFAULT `'scheduled'` | `'scheduled'`, `'live'`, `'finished'`, `'suspended'`, `'cancelled'`. |
| `home_score` | `INTEGER` | NULL hasta que termina el partido. |
| `away_score` | `INTEGER` | |
| `went_to_extra_time` | `BOOLEAN` DEFAULT FALSE | |
| `went_to_penalties` | `BOOLEAN` DEFAULT FALSE | |
| `api_external_id` | `TEXT` UNIQUE NOT NULL | ID del partido en la API externa. |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

### 3.6 `player_match_stats`

Estadísticas de cada jugador en cada partido que jugó. **Tabla crítica para la lógica del juego:** aquí se determina si un pick sobrevive o no.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `BIGSERIAL` PRIMARY KEY | |
| `match_id` | `INTEGER` REFERENCES `matches(id)` NOT NULL | |
| `player_id` | `INTEGER` REFERENCES `players(id)` NOT NULL | |
| `minutes_played` | `INTEGER` NOT NULL DEFAULT 0 | Minutos efectivos en cancha. 0 si no jugó (regla E3). |
| `shots_on_target` | `INTEGER` NOT NULL DEFAULT 0 | Tiros a puerta, según definición FIFA/Opta (ver `game-rules.md` §2). |
| `goals` | `INTEGER` NOT NULL DEFAULT 0 | Goles (tiempo regular + tiempo extra, NO penales de tanda). |
| `own_goals` | `INTEGER` NOT NULL DEFAULT 0 | Autogoles. NO cuentan para supervivencia ni desempate. |
| `was_red_carded` | `BOOLEAN` DEFAULT FALSE | |
| `is_final` | `BOOLEAN` DEFAULT FALSE | TRUE cuando pasan 24h del final del partido y la data se congela. |
| `last_api_sync_at` | `TIMESTAMPTZ` | Última vez que este registro se sincronizó con la API. |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

**Regla crítica:** UNIQUE constraint en `(match_id, player_id)` — un jugador solo tiene UNA fila de stats por partido.

### 3.7 `user_picks`

El pick FINAL de cada usuario para cada día. Se actualiza cuando el usuario cambia su pick (hasta el deadline). Una fila por usuario por día.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `BIGSERIAL` PRIMARY KEY | |
| `user_id` | `UUID` REFERENCES `users(id)` NOT NULL | |
| `match_day_id` | `INTEGER` REFERENCES `match_days(id)` NOT NULL | |
| `player_id` | `INTEGER` REFERENCES `players(id)` NOT NULL | |
| `match_id` | `INTEGER` REFERENCES `matches(id)` NOT NULL | Partido del jugador elegido. Redundante para queries rápidas. |
| `picked_at` | `TIMESTAMPTZ` NOT NULL DEFAULT NOW() | Cuándo se hizo el pick (la última versión). |
| `effective_deadline` | `TIMESTAMPTZ` NOT NULL | Deadline aplicable según el partido del jugador elegido. |
| `is_locked` | `BOOLEAN` DEFAULT FALSE | TRUE cuando pasa el deadline. A partir de aquí no se puede cambiar. |
| `result` | `TEXT` | `NULL` mientras el partido no ha terminado. Después: `'survived'`, `'eliminated'`, `'void_cancelled_match'`, `'void_did_not_play'`. |
| `shots_on_target_count` | `INTEGER` | Se llena después del partido, copiado de `player_match_stats`. |
| `goals_scored` | `INTEGER` | Idem (para desempate). |
| `processed_at` | `TIMESTAMPTZ` | Cuándo el sistema evaluó el resultado del pick. |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `updated_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

**Reglas críticas (enforced en constraints):**

- UNIQUE `(user_id, match_day_id)`: un usuario solo puede tener UN pick por día.
- UNIQUE `(user_id, player_id)`: un usuario no puede elegir al mismo jugador dos veces en todo el torneo.

### 3.8 `pick_history`

Historial completo de todos los picks que un usuario hizo, incluyendo los que cambió antes del deadline. Append-only (nunca se actualiza ni borra).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `BIGSERIAL` PRIMARY KEY | |
| `user_id` | `UUID` REFERENCES `users(id)` NOT NULL | |
| `match_day_id` | `INTEGER` REFERENCES `match_days(id)` NOT NULL | |
| `player_id` | `INTEGER` REFERENCES `players(id)` NOT NULL | |
| `match_id` | `INTEGER` REFERENCES `matches(id)` NOT NULL | |
| `action` | `TEXT` NOT NULL | `'initial_pick'`, `'change_pick'`, `'locked_final'`. |
| `recorded_at` | `TIMESTAMPTZ` NOT NULL DEFAULT NOW() | |
| `ip_address` | `INET` | Para auditoría y anti-fraude. |
| `user_agent_hash` | `TEXT` | Hash del user-agent (device fingerprint ligero). |

### 3.9 `user_status`

Estado de cada usuario en el torneo. Se actualiza cada vez que se procesa un día.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `user_id` | `UUID` PRIMARY KEY REFERENCES `users(id)` | |
| `is_alive` | `BOOLEAN` DEFAULT TRUE | TRUE = sigue vivo; FALSE = eliminado. |
| `eliminated_on_match_day_id` | `INTEGER` REFERENCES `match_days(id)` | NULL si sigue vivo. |
| `elimination_reason` | `TEXT` | `'no_pick'`, `'no_shot_on_target'`, `'player_did_not_play'`, `'disqualified'`. |
| `total_goals_accumulated` | `INTEGER` DEFAULT 0 | Para desempate. Se incrementa día con día. |
| `days_survived` | `INTEGER` DEFAULT 0 | Contador de días vividos. |
| `updated_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

### 3.10 `api_sync_events`

Log ligero de eventos de sincronización con la API externa. Para auditoría.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `BIGSERIAL` PRIMARY KEY | |
| `entity_type` | `TEXT` NOT NULL | `'match'`, `'player_stats'`, `'lineup'`, etc. |
| `entity_id` | `TEXT` NOT NULL | ID (externo) de la entidad sincronizada. |
| `sync_status` | `TEXT` NOT NULL | `'success'`, `'partial'`, `'failed'`. |
| `api_response_summary` | `JSONB` | Resumen mínimo del response (no el raw completo). |
| `error_message` | `TEXT` | |
| `created_at` | `TIMESTAMPTZ` DEFAULT NOW() | |

### 3.11 `admin_appeals`

Apelaciones humanas (casos excepcionales: hackeo, bugs, etc.).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `BIGSERIAL` PRIMARY KEY | |
| `user_id` | `UUID` REFERENCES `users(id)` NOT NULL | |
| `match_day_id` | `INTEGER` REFERENCES `match_days(id)` | Día al que aplica la apelación. |
| `claim_type` | `TEXT` NOT NULL | `'hacked_account'`, `'technical_error'`, `'data_dispute'`, `'other'`. |
| `user_description` | `TEXT` NOT NULL | Relato del usuario. |
| `status` | `TEXT` NOT NULL DEFAULT `'pending'` | `'pending'`, `'approved'`, `'rejected'`. |
| `admin_notes` | `TEXT` | |
| `resolution_action` | `TEXT` | Ej: `'reinstated'`, `'pick_revised'`, `'no_action'`. |
| `submitted_at` | `TIMESTAMPTZ` DEFAULT NOW() | |
| `resolved_at` | `TIMESTAMPTZ` | |

---

## 4. Índices

Índices recomendados para las queries más frecuentes:

**`user_picks`**
- Ya tiene UNIQUE en `(user_id, match_day_id)` y `(user_id, player_id)`.
- `CREATE INDEX idx_user_picks_match_day ON user_picks(match_day_id) WHERE is_locked = TRUE;` — para procesar resultados post-partido.
- `CREATE INDEX idx_user_picks_user_id ON user_picks(user_id);` — para dashboard del usuario.

**`pick_history`**
- `CREATE INDEX idx_pick_history_user_day ON pick_history(user_id, match_day_id);`

**`player_match_stats`**
- Ya tiene UNIQUE en `(match_id, player_id)`.
- `CREATE INDEX idx_player_match_stats_match ON player_match_stats(match_id) WHERE is_final = TRUE;`

**`matches`**
- `CREATE INDEX idx_matches_kickoff ON matches(kickoff_time);`
- `CREATE INDEX idx_matches_status ON matches(status);`

**`user_status`**
- `CREATE INDEX idx_user_status_alive ON user_status(is_alive, total_goals_accumulated DESC);` — leaderboard con desempate.

**`players`**
- `CREATE INDEX idx_players_team ON players(team_id) WHERE is_active = TRUE;`

---

## 5. Constraints y reglas a nivel DB

Reglas del juego que se enforcan directamente en la DB (no dependen del código):

1. **Un pick por usuario por día:** `UNIQUE (user_id, match_day_id)` en `user_picks`.
2. **No repetir jugador:** `UNIQUE (user_id, player_id)` en `user_picks`.
3. **Email único:** `UNIQUE (email)` en `users`.
4. **Username único:** `UNIQUE (username)` en `users`.
5. **Validación de username:** CHECK constraint `(LENGTH(username) BETWEEN 3 AND 20)`.
6. **Validación de posición de jugador:** CHECK `position IN ('GK','DEF','MID','FWD')`.
7. **Validación de status de partido:** CHECK `status IN ('scheduled','live','finished','suspended','cancelled')`.
8. **Confirmación de mayoría de edad:** CHECK `over_18_confirmed = TRUE` en `users`.

Adicional en triggers (sección 7):
- Un pick no se puede INSERT o UPDATE después de su `effective_deadline`.
- Un pick no se puede cambiar si `is_locked = TRUE`.

---

## 6. Row Level Security (RLS)

Supabase usa RLS para controlar qué puede ver cada usuario. Políticas clave:

**`users`**
- Cada usuario puede SELECT su propio registro completo.
- Cualquier usuario autenticado puede SELECT `id`, `username` de otros (para leaderboard).
- Solo el propio usuario puede UPDATE sus datos (y solo ciertos campos: username, marketing opt-in).

**`user_picks`**
- Cada usuario puede SELECT sus propios picks en cualquier momento.
- Los picks de OTROS usuarios solo son visibles después del `effective_deadline` (se filtra en la política).
- Solo el propio usuario puede INSERT/UPDATE sus picks, y solo si `is_locked = FALSE`.

**`pick_history`**
- Cada usuario puede SELECT su propio historial.
- El historial de otros NO es visible a usuarios normales (solo administradores).

**`user_status`**
- SELECT público (es parte del leaderboard).
- INSERT/UPDATE solo por servicio/admin (vía función con `SECURITY DEFINER`).

**`teams`, `players`, `matches`, `match_days`, `player_match_stats`**
- SELECT público (datos deportivos, visibles para todos).
- INSERT/UPDATE solo por servicio/admin.

**`admin_appeals`**
- Cada usuario puede INSERT su propia apelación.
- Cada usuario puede SELECT sus propias apelaciones.
- Solo admins pueden UPDATE (para resolver).

---

## 7. Funciones y triggers

Lógica crítica implementada a nivel DB:

### 7.1 Trigger: impedir picks después del deadline

```
BEFORE INSERT OR UPDATE ON user_picks
  IF NEW.effective_deadline <= NOW() OR OLD.is_locked = TRUE
  THEN RAISE EXCEPTION 'Pick deadline has passed or pick is locked';
```

### 7.2 Trigger: registrar cambios en pick_history

```
AFTER INSERT OR UPDATE ON user_picks
  INSERT INTO pick_history (user_id, match_day_id, player_id, match_id, action, ...)
  VALUES (NEW.user_id, NEW.match_day_id, NEW.player_id, NEW.match_id, 
          CASE WHEN TG_OP = 'INSERT' THEN 'initial_pick' ELSE 'change_pick' END, ...);
```

### 7.3 Función: evaluar resultado de un pick (cron job)

Función `process_match_day_results(match_day_id INT)` que:
- Para cada pick del día, consulta `player_match_stats`.
- Determina resultado (`survived`, `eliminated`, `void_*`).
- Actualiza `user_picks.result`, `user_picks.shots_on_target_count`, `user_picks.goals_scored`.
- Actualiza `user_status` (si eliminado, marca eliminación; si sobrevive, incrementa contadores).
- Marca `match_days.is_processed = TRUE` al terminar.

Esta función se ejecuta automáticamente (cron) 24 horas después de terminado el último partido del día.

### 7.4 Función: validar pool de jugadores elegibles

Función `get_available_players(user_id UUID, match_day_id INT)` que retorna la lista de jugadores elegibles para ese usuario ese día. Usada por la app al mostrar opciones.

---

## 8. Scripts SQL completos

### 8.1 Crear todas las tablas

```sql
-- ============================================================
-- SCHEMA: Quiniela Mundial 2026
-- Orden de creación importa por foreign keys
-- ============================================================

-- Tabla: users (extensión de auth.users de Supabase)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  over_18_confirmed BOOLEAN NOT NULL,
  marketing_emails_opt_in BOOLEAN DEFAULT FALSE,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('email','google','apple')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT username_length CHECK (LENGTH(username) BETWEEN 3 AND 20),
  CONSTRAINT age_confirmed CHECK (over_18_confirmed = TRUE)
);

-- Tabla: teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  group_letter CHAR(1) NOT NULL,
  flag_url TEXT,
  api_external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: players
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK','DEF','MID','FWD')),
  jersey_number INTEGER,
  photo_url TEXT,
  api_external_id TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: match_days
CREATE TABLE match_days (
  id SERIAL PRIMARY KEY,
  match_date DATE UNIQUE NOT NULL,
  day_number INTEGER UNIQUE NOT NULL,
  pick_window_opens_at TIMESTAMPTZ NOT NULL,
  pick_window_closes_at TIMESTAMPTZ NOT NULL,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: matches
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  match_day_id INTEGER NOT NULL REFERENCES match_days(id),
  match_number INTEGER UNIQUE NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final')),
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  kickoff_time TIMESTAMPTZ NOT NULL,
  pick_deadline TIMESTAMPTZ NOT NULL,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled','live','finished','suspended','cancelled')),
  home_score INTEGER,
  away_score INTEGER,
  went_to_extra_time BOOLEAN DEFAULT FALSE,
  went_to_penalties BOOLEAN DEFAULT FALSE,
  api_external_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: player_match_stats
CREATE TABLE player_match_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  minutes_played INTEGER NOT NULL DEFAULT 0,
  shots_on_target INTEGER NOT NULL DEFAULT 0,
  goals INTEGER NOT NULL DEFAULT 0,
  own_goals INTEGER NOT NULL DEFAULT 0,
  was_red_carded BOOLEAN DEFAULT FALSE,
  is_final BOOLEAN DEFAULT FALSE,
  last_api_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, player_id)
);

-- Tabla: user_picks
CREATE TABLE user_picks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_day_id INTEGER NOT NULL REFERENCES match_days(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  match_id INTEGER NOT NULL REFERENCES matches(id),
  picked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_deadline TIMESTAMPTZ NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  result TEXT CHECK (result IN ('survived','eliminated','void_cancelled_match','void_did_not_play')),
  shots_on_target_count INTEGER,
  goals_scored INTEGER,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, match_day_id),
  UNIQUE (user_id, player_id)
);

-- Tabla: pick_history
CREATE TABLE pick_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_day_id INTEGER NOT NULL REFERENCES match_days(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  match_id INTEGER NOT NULL REFERENCES matches(id),
  action TEXT NOT NULL CHECK (action IN ('initial_pick','change_pick','locked_final')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent_hash TEXT
);

-- Tabla: user_status
CREATE TABLE user_status (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  is_alive BOOLEAN DEFAULT TRUE,
  eliminated_on_match_day_id INTEGER REFERENCES match_days(id),
  elimination_reason TEXT CHECK (elimination_reason IN ('no_pick','no_shot_on_target','player_did_not_play','disqualified')),
  total_goals_accumulated INTEGER DEFAULT 0,
  days_survived INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: api_sync_events
CREATE TABLE api_sync_events (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success','partial','failed')),
  api_response_summary JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: admin_appeals
CREATE TABLE admin_appeals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_day_id INTEGER REFERENCES match_days(id),
  claim_type TEXT NOT NULL CHECK (claim_type IN ('hacked_account','technical_error','data_dispute','other')),
  user_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes TEXT,
  resolution_action TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

### 8.2 Crear índices

```sql
CREATE INDEX idx_user_picks_match_day ON user_picks(match_day_id) WHERE is_locked = TRUE;
CREATE INDEX idx_user_picks_user_id ON user_picks(user_id);
CREATE INDEX idx_pick_history_user_day ON pick_history(user_id, match_day_id);
CREATE INDEX idx_player_match_stats_match ON player_match_stats(match_id) WHERE is_final = TRUE;
CREATE INDEX idx_matches_kickoff ON matches(kickoff_time);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_user_status_alive ON user_status(is_alive, total_goals_accumulated DESC);
CREATE INDEX idx_players_team ON players(team_id) WHERE is_active = TRUE;
```

### 8.3 Habilitar RLS y políticas

```sql
-- Habilitar RLS en todas las tablas sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pick_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_appeals ENABLE ROW LEVEL SECURITY;

-- Política ejemplo: users puede ver su propio registro
CREATE POLICY users_self_read ON users
  FOR SELECT USING (auth.uid() = id);

-- Política ejemplo: leaderboard público (solo id, username)
CREATE POLICY users_public_leaderboard ON users
  FOR SELECT USING (TRUE)
  WITH CHECK (FALSE);  -- solo lectura, y la columna filtering se hace en la app

-- Política ejemplo: user_picks - solo el dueño ve sus picks (antes del deadline)
CREATE POLICY user_picks_own ON user_picks
  FOR SELECT USING (auth.uid() = user_id);

-- Política: user_picks - otros usuarios ven picks ajenos solo después del deadline
CREATE POLICY user_picks_public_after_deadline ON user_picks
  FOR SELECT USING (is_locked = TRUE);

-- Política: user_picks - solo dueño puede insertar/actualizar
CREATE POLICY user_picks_write_own ON user_picks
  FOR ALL USING (auth.uid() = user_id);

-- (Políticas completas se desarrollarán durante implementación)
```

### 8.4 Funciones y triggers (esqueleto)

```sql
-- Función: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas relevantes
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_picks_updated BEFORE UPDATE ON user_picks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- (Repetir para otras tablas)

-- Función: validar que pick no sea después del deadline
CREATE OR REPLACE FUNCTION validate_pick_timing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.effective_deadline <= NOW() THEN
    RAISE EXCEPTION 'Pick deadline has passed';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.is_locked = TRUE THEN
    RAISE EXCEPTION 'Pick is already locked';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_pick_timing BEFORE INSERT OR UPDATE ON user_picks
  FOR EACH ROW EXECUTE FUNCTION validate_pick_timing();

-- Función: registrar cada pick en pick_history
CREATE OR REPLACE FUNCTION log_pick_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pick_history (user_id, match_day_id, player_id, match_id, action)
  VALUES (
    NEW.user_id,
    NEW.match_day_id,
    NEW.player_id,
    NEW.match_id,
    CASE WHEN TG_OP = 'INSERT' THEN 'initial_pick' ELSE 'change_pick' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_pick_history AFTER INSERT OR UPDATE ON user_picks
  FOR EACH ROW EXECUTE FUNCTION log_pick_history();
```

---

## 9. Notas de operación

### 9.1 Precarga de datos

Antes del torneo se deben precargar:

1. **Teams** (48 equipos) — una vez que FIFA confirme las clasificaciones (ya confirmadas al momento de escribir esto, abril 2026).
2. **Match_days** (todos los días con partidos, ~30-33 días) — basado en calendario FIFA.
3. **Matches** (los 104 partidos) — fase de grupos totalmente; fases eliminatorias como "placeholders" que se completan conforme avanza el torneo.
4. **Players** (~1,150 jugadores, 24 por equipo × 48 equipos) — precarga ~1 semana antes del torneo cuando FIFA publique plantillas finales.

### 9.2 Sincronización con API externa

Cada ~60 segundos durante partidos en vivo, un worker consulta la API y actualiza:
- `matches.status` (scheduled → live → finished).
- `player_match_stats` (minutos jugados, tiros, goles).

Al terminar un partido y pasar 24 horas, se marca `player_match_stats.is_final = TRUE` y se ejecuta `process_match_day_results()` para ese día.

### 9.3 Backups

Supabase hace backups diarios automáticos en el plan Pro. Para un proyecto de esta criticidad durante el mes del torneo, considerar:
- Backups cada 4-6 horas durante el torneo.
- Exportar un dump manual antes de cada día de partidos (poder restaurar a "justo antes del día X" si pasa algo grave).

### 9.4 Monitoreo

Alertas críticas que configurar:
- Queries con latencia > 2 segundos.
- Conexiones a la DB > 80% del límite.
- Fallos de sincronización con API > 3 consecutivos.
- Picks con `is_locked = FALSE` pero `effective_deadline < NOW()` (indicaría un bug en el lock).

### 9.5 Migraciones futuras

Si se decide agregar ligas privadas en versión 2:
- Crear tabla `leagues (id UUID, name TEXT, creator_user_id UUID, ...)`.
- Crear tabla `league_members (league_id, user_id, joined_at)`.
- Agregar campo opcional `league_id UUID NULL` en `user_picks` (o una tabla join).
- NO requiere romper el schema actual — los usuarios actuales simplemente tienen `league_id = NULL` (= torneo global).

---

## Historial de versiones

- **v1.0 (abril 2026)**: versión inicial del schema, derivada de `game-rules.md v1.0`. Optimizada específicamente para Mundial 2026.

---

*Fin del documento.*
