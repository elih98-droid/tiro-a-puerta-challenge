/**
 * API-Football v3 client
 *
 * Typed wrapper over the endpoints we use. All methods return parsed, typed
 * responses. Throws on non-2xx HTTP status or when the API returns errors.
 *
 * Base URL: https://v3.football.api-sports.io
 * Auth:     x-apisports-key header (server-side only — never expose to browser)
 * Rate:     Plan PRO → 7,500 requests/day. Each method call = 1 request.
 *
 * Position mapping (API → our DB):
 *   Fixtures/players: "G"→"GK", "D"→"DEF", "M"→"MID", "F"→"FWD"
 *   Squads:           "Goalkeeper"→"GK", "Defender"→"DEF",
 *                     "Midfielder"→"MID", "Attacker"→"FWD"
 *
 * Status mapping (API short code → our DB status):
 *   "scheduled" → NS, TBD
 *   "live"      → 1H, HT, 2H, ET, BT, P, LIVE, INT
 *   "finished"  → FT, AET, PEN
 *   "suspended" → SUSP
 *   "cancelled" → CANC, ABD, PST, AWD, WO
 */

import type {
  ApiFootballResponse,
  ApiTeam,
  ApiFixture,
  ApiFixtureStatusShort,
  ApiSquad,
  ApiFixturePlayers,
  ApiPlayerStatPosition,
  ApiSquadPlayerPosition,
} from "./types";

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = "https://v3.football.api-sports.io";

function getApiKey(): string {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error(
      "API_FOOTBALL_KEY is not set. Add it to .env.local (server-side only)."
    );
  }
  return key;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  params: Record<string, string | number>
): Promise<ApiFootballResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      "x-apisports-key": getApiKey(),
    },
    // Disable Next.js data cache — live sports data must always be fresh.
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `API-Football request failed: ${response.status} ${response.statusText} (${url.toString()})`
    );
  }

  const data = (await response.json()) as ApiFootballResponse<T>;

  // The API returns errors as an object with messages, even on HTTP 200.
  const errors = data.errors;
  if (
    (Array.isArray(errors) && errors.length > 0) ||
    (!Array.isArray(errors) && Object.keys(errors).length > 0)
  ) {
    throw new Error(
      `API-Football returned errors: ${JSON.stringify(errors)}`
    );
  }

  return data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all teams in a given league and season.
 *
 * Example: getTeams(39, 2024) → Premier League 2024/25 (20 teams)
 * Example: getTeams(1, 2026)  → FIFA World Cup 2026
 */
export async function getTeams(
  leagueId: number,
  season: number
): Promise<ApiTeam[]> {
  const data = await apiFetch<ApiTeam>("/teams", {
    league: leagueId,
    season,
  });
  return data.response;
}

/**
 * Fetch all fixtures for a league and season.
 * Handles pagination automatically (fetches all pages).
 *
 * Optional filters:
 * - date: "YYYY-MM-DD" — only fixtures on this date
 * - status: API short status code(s), e.g. "LIVE" or "NS-1H-2H"
 *
 * Example: getFixtures(39, 2024)                      → all PL 2024/25 matches
 * Example: getFixtures(39, 2024, { status: "LIVE" })  → live PL matches now
 */
export async function getFixtures(
  leagueId: number,
  season: number,
  options: { date?: string; status?: string } = {}
): Promise<ApiFixture[]> {
  const params: Record<string, string | number> = {
    league: leagueId,
    season,
  };

  if (options.date) params.date = options.date;
  if (options.status) params.status = options.status;

  // /fixtures returns all results in a single response (no page parameter supported).
  const data = await apiFetch<ApiFixture>("/fixtures", params);
  return data.response;
}

/**
 * Fetch a single fixture by its API-Football fixture ID.
 * Returns null if the fixture is not found.
 *
 * Useful for checking the current status of one specific match
 * without fetching the entire season.
 */
export async function getFixtureById(
  fixtureId: number
): Promise<ApiFixture | null> {
  const data = await apiFetch<ApiFixture>("/fixtures", { id: fixtureId });
  return data.response[0] ?? null;
}

/**
 * Fetch player statistics for a specific fixture.
 * Returns one entry per team, each with an array of player stats.
 *
 * This is the core endpoint for our game:
 * - statistics[0].shots.on → shots_on_target (survival condition)
 * - statistics[0].goals.total → goals (tiebreaker)
 * - statistics[0].games.minutes → minutes_played (E3 condition)
 *
 * Updated approximately every 60 seconds during live matches.
 */
export async function getFixturePlayers(
  fixtureId: number
): Promise<ApiFixturePlayers[]> {
  const data = await apiFetch<ApiFixturePlayers>("/fixtures/players", {
    fixture: fixtureId,
  });
  return data.response;
}

/**
 * Fetch the current squad for a team (all registered players).
 * Returns players with name, jersey number, position, and photo URL.
 *
 * Note: does NOT include detailed season stats — just roster info.
 * Use this for seeding the `players` table.
 */
export async function getSquad(teamId: number): Promise<ApiSquad | null> {
  const data = await apiFetch<ApiSquad>("/players/squads", { team: teamId });
  return data.response[0] ?? null;
}

// ─── Helper utilities ─────────────────────────────────────────────────────────

/**
 * Maps an API-Football fixture status short code to our DB status value.
 *
 * Our DB accepts: 'scheduled' | 'live' | 'finished' | 'suspended' | 'cancelled'
 */
export function mapFixtureStatus(
  apiStatus: ApiFixtureStatusShort
): "scheduled" | "live" | "finished" | "suspended" | "cancelled" {
  switch (apiStatus) {
    case "NS":
    case "TBD":
      return "scheduled";

    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "LIVE":
    case "INT":
      return "live";

    case "FT":
    case "AET":
    case "PEN":
      return "finished";

    case "SUSP":
      return "suspended";

    case "CANC":
    case "ABD":
    case "PST":
    case "AWD":
    case "WO":
      return "cancelled";
  }
}

/**
 * Maps an API-Football player position code (from /fixtures/players)
 * to our DB position enum.
 *
 * Our DB accepts: 'GK' | 'DEF' | 'MID' | 'FWD'
 */
export function mapPlayerStatPosition(
  apiPosition: ApiPlayerStatPosition
): "GK" | "DEF" | "MID" | "FWD" {
  switch (apiPosition) {
    case "G": return "GK";
    case "D": return "DEF";
    case "M": return "MID";
    case "F": return "FWD";
  }
}

/**
 * Maps an API-Football squad position string (from /players/squads)
 * to our DB position enum.
 *
 * Our DB accepts: 'GK' | 'DEF' | 'MID' | 'FWD'
 */
export function mapSquadPosition(
  apiPosition: ApiSquadPlayerPosition
): "GK" | "DEF" | "MID" | "FWD" {
  switch (apiPosition) {
    case "Goalkeeper": return "GK";
    case "Defender":   return "DEF";
    case "Midfielder": return "MID";
    case "Attacker":   return "FWD";
  }
}
