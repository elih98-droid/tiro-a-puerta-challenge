// Types for API-Football v3 responses (api-football.com / api-sports.io)
// Based on actual API responses observed during development.
// Docs: https://www.api-football.com/documentation-v3

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Wrapper that every API-Football response is nested inside. */
export interface ApiFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

// ─── /teams ───────────────────────────────────────────────────────────────────

export interface ApiTeam {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number | null;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string | null;
    city: string;
    capacity: number | null;
    surface: string | null;
    image: string;
  };
}

// ─── /fixtures ────────────────────────────────────────────────────────────────

/**
 * Status codes returned by the API and what they mean for our schema:
 *
 * "scheduled" → NS, TBD
 * "live"      → 1H, HT, 2H, ET, BT, P, LIVE, INT
 * "finished"  → FT, AET, PEN
 * "suspended" → SUSP
 * "cancelled" → CANC, ABD, PST, AWD, WO
 */
export type ApiFixtureStatusShort =
  | "TBD" | "NS"                          // scheduled
  | "1H" | "HT" | "2H" | "ET" | "BT"    // live
  | "P" | "LIVE" | "INT"                  // live
  | "FT" | "AET" | "PEN"                 // finished
  | "SUSP"                                // suspended
  | "CANC" | "ABD" | "PST" | "AWD" | "WO"; // cancelled

export interface ApiFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string; // ISO 8601, UTC
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: ApiFixtureStatusShort;
      elapsed: number | null;
      extra: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
    standings: boolean;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

// ─── /players/squads ──────────────────────────────────────────────────────────

export type ApiSquadPlayerPosition =
  | "Goalkeeper"
  | "Defender"
  | "Midfielder"
  | "Attacker";

export interface ApiSquad {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: Array<{
    id: number;
    name: string;
    age: number;
    number: number | null;
    position: ApiSquadPlayerPosition;
    photo: string;
  }>;
}

// ─── /fixtures/players ────────────────────────────────────────────────────────

/**
 * Position codes inside player match statistics.
 * "G" = Goalkeeper, "D" = Defender, "M" = Midfielder, "F" = Forward
 */
export type ApiPlayerStatPosition = "G" | "D" | "M" | "F";

export interface ApiFixturePlayerStats {
  games: {
    minutes: number | null;
    number: number;
    position: ApiPlayerStatPosition;
    rating: string | null;
    captain: boolean;
    substitute: boolean;
  };
  offsides: number | null;
  shots: {
    total: number | null;
    /** Shots on target — the key field for our game logic. */
    on: number | null;
  };
  goals: {
    /** Goals scored (excludes own goals). Null = 0. */
    total: number | null;
    /**
     * For outfield players: own goals scored.
     * For goalkeepers: goals conceded.
     * We only use this for non-GK players to track own goals.
     */
    conceded: number | null;
    assists: number | null;
    saves: number | null;
  };
  passes: {
    total: number | null;
    key: number | null;
    accuracy: string | null;
  };
  tackles: {
    total: number | null;
    blocks: number | null;
    interceptions: number | null;
  };
  duels: { total: number | null; won: number | null };
  dribbles: {
    attempts: number | null;
    success: number | null;
    past: number | null;
  };
  fouls: { drawn: number | null; committed: number | null };
  cards: {
    yellow: number;
    /** > 0 means the player received a red card. */
    red: number;
  };
  penalty: {
    won: number | null;
    commited: number | null;
    scored: number;
    missed: number;
    saved: number;
  };
}

export interface ApiFixturePlayers {
  team: {
    id: number;
    name: string;
    logo: string;
    update: string;
  };
  players: Array<{
    player: {
      id: number;
      name: string;
      photo: string;
    };
    /** Always an array of one element for regular matches. */
    statistics: [ApiFixturePlayerStats];
  }>;
}
