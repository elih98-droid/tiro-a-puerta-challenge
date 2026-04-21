-- ============================================================
-- Migration: 20260415000000_initial_schema.sql
-- Description: Create all tables and indexes for the Mundial 2026 pool.
-- Applied manually in Supabase SQL Editor on 2026-04-15.
-- This file is for version control only; do NOT run against a DB
-- that already has these tables.
-- Reference: docs/database-schema.md §3 and §4
-- ============================================================

-- ============================================================
-- TABLES
-- Creation order matters due to foreign key dependencies.
-- ============================================================

-- Table: users
-- Extends auth.users from Supabase Auth. One row per registered user.
-- Reference: database-schema.md §3.1
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  over_18_confirmed BOOLEAN NOT NULL,
  marketing_emails_opt_in BOOLEAN DEFAULT FALSE,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('email', 'google')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT username_length CHECK (LENGTH(username) BETWEEN 3 AND 20),
  CONSTRAINT age_confirmed CHECK (over_18_confirmed = TRUE)
);

-- Table: teams
-- The 48 teams of the 2026 World Cup. Pre-loaded before the tournament.
-- Reference: database-schema.md §3.2
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  group_letter CHAR(1) NOT NULL,
  flag_url TEXT,
  api_external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: players
-- All players across the 48 squads. Pre-loaded ~1 week before the tournament.
-- Reference: database-schema.md §3.3
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id),
  full_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  jersey_number INTEGER,
  photo_url TEXT,
  api_external_id TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: match_days
-- Calendar days that have at least one match. Pre-loaded before the tournament.
-- Reference: database-schema.md §3.4
CREATE TABLE match_days (
  id SERIAL PRIMARY KEY,
  match_date DATE UNIQUE NOT NULL,
  day_number INTEGER UNIQUE NOT NULL,
  pick_window_opens_at TIMESTAMPTZ NOT NULL,
  pick_window_closes_at TIMESTAMPTZ NOT NULL,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: matches
-- All 104 World Cup matches. Knockout-stage opponents are filled in progressively.
-- Reference: database-schema.md §3.5
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  match_day_id INTEGER NOT NULL REFERENCES match_days(id),
  match_number INTEGER UNIQUE NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'group', 'round_of_32', 'round_of_16',
    'quarterfinal', 'semifinal', 'third_place', 'final'
  )),
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  kickoff_time TIMESTAMPTZ NOT NULL,
  -- Computed field (kickoff - 5 min) stored for fast queries.
  pick_deadline TIMESTAMPTZ NOT NULL,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'finished', 'suspended', 'cancelled')),
  home_score INTEGER,
  away_score INTEGER,
  went_to_extra_time BOOLEAN DEFAULT FALSE,
  went_to_penalties BOOLEAN DEFAULT FALSE,
  api_external_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: player_match_stats
-- Per-player stats for each match they participated in.
-- Critical table: determines if a pick survives (shots_on_target > 0).
-- Reference: database-schema.md §3.6, game-rules.md §4
CREATE TABLE player_match_stats (
  id BIGSERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES matches(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  minutes_played INTEGER NOT NULL DEFAULT 0,
  shots_on_target INTEGER NOT NULL DEFAULT 0,
  -- Goals in regular time + extra time only (NOT penalty shootout).
  goals INTEGER NOT NULL DEFAULT 0,
  -- Own goals: do NOT count for survival or tiebreaker (game-rules.md §7.4).
  own_goals INTEGER NOT NULL DEFAULT 0,
  was_red_carded BOOLEAN DEFAULT FALSE,
  -- TRUE once 24 hours have passed since the match ended; data is frozen.
  is_final BOOLEAN DEFAULT FALSE,
  last_api_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One stats row per player per match.
  UNIQUE (match_id, player_id)
);

-- Table: user_picks
-- The FINAL pick of each user for each match day. One row per user per day.
-- Reference: database-schema.md §3.7, game-rules.md §3
CREATE TABLE user_picks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_day_id INTEGER NOT NULL REFERENCES match_days(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  -- Redundant with player → team → match, but stored for fast queries.
  match_id INTEGER NOT NULL REFERENCES matches(id),
  picked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Deadline recalculated whenever the pick changes (kickoff - 5 min).
  effective_deadline TIMESTAMPTZ NOT NULL,
  -- TRUE once the deadline passes; pick can no longer be changed.
  is_locked BOOLEAN DEFAULT FALSE,
  -- NULL while the match is ongoing; filled after evaluation.
  result TEXT CHECK (result IN (
    'survived', 'eliminated',
    'void_cancelled_match', 'void_did_not_play'
  )),
  shots_on_target_count INTEGER,
  goals_scored INTEGER,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- One pick per user per day (game-rules.md §3.1).
  UNIQUE (user_id, match_day_id),
  -- Cannot pick the same player twice across the tournament (game-rules.md §3.4).
  UNIQUE (user_id, player_id)
);

-- Table: pick_history
-- Append-only audit log of every pick action (initial, change, locked).
-- Used for anti-fraud analysis and transparency.
-- Reference: database-schema.md §3.8
CREATE TABLE pick_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_day_id INTEGER NOT NULL REFERENCES match_days(id),
  player_id INTEGER NOT NULL REFERENCES players(id),
  match_id INTEGER NOT NULL REFERENCES matches(id),
  action TEXT NOT NULL CHECK (action IN ('initial_pick', 'change_pick', 'locked_final')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Stored for passive device fingerprinting (game-rules.md §11.1).
  ip_address INET,
  user_agent_hash TEXT
);

-- Table: user_status
-- Current tournament status for each user (alive, eliminated, score).
-- Updated after each match day is processed.
-- Reference: database-schema.md §3.9
CREATE TABLE user_status (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  is_alive BOOLEAN DEFAULT TRUE,
  eliminated_on_match_day_id INTEGER REFERENCES match_days(id),
  elimination_reason TEXT CHECK (elimination_reason IN (
    'no_pick', 'no_shot_on_target', 'player_did_not_play', 'disqualified'
  )),
  -- Accumulated goals for tiebreaker (game-rules.md §5.1).
  total_goals_accumulated INTEGER DEFAULT 0,
  days_survived INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: api_sync_events
-- Lightweight audit log of every sync event with the external sports data API.
-- Reference: database-schema.md §3.10
CREATE TABLE api_sync_events (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'partial', 'failed')),
  api_response_summary JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: admin_appeals
-- Human review requests for exceptional cases (hacked account, platform bug, etc.).
-- Reference: database-schema.md §3.11, game-rules.md §11.3
CREATE TABLE admin_appeals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  match_day_id INTEGER REFERENCES match_days(id),
  claim_type TEXT NOT NULL CHECK (claim_type IN (
    'hacked_account', 'technical_error', 'data_dispute', 'other'
  )),
  user_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  resolution_action TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES
-- Optimized for the most frequent query patterns.
-- Reference: database-schema.md §4
-- ============================================================

-- user_picks: process results for a specific day (post-match evaluation).
CREATE INDEX idx_user_picks_match_day ON user_picks(match_day_id) WHERE is_locked = TRUE;

-- user_picks: fetch all picks for a specific user (dashboard).
CREATE INDEX idx_user_picks_user_id ON user_picks(user_id);

-- pick_history: fetch history for a user on a given day (audit / anti-fraud).
CREATE INDEX idx_pick_history_user_day ON pick_history(user_id, match_day_id);

-- player_match_stats: evaluate picks once data is final (post 24h window).
CREATE INDEX idx_player_match_stats_match ON player_match_stats(match_id) WHERE is_final = TRUE;

-- matches: sort/filter by kickoff time (schedule view, deadline calculations).
CREATE INDEX idx_matches_kickoff ON matches(kickoff_time);

-- matches: filter by status (live vs scheduled vs finished).
CREATE INDEX idx_matches_status ON matches(status);

-- user_status: leaderboard query — alive first, then by goals accumulated desc.
CREATE INDEX idx_user_status_alive ON user_status(is_alive, total_goals_accumulated DESC);

-- players: filter active players by team (build eligible player pool).
CREATE INDEX idx_players_team ON players(team_id) WHERE is_active = TRUE;
