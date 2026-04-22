/**
 * app/api/cron/sync-live-matches/route.ts
 *
 * Cron job that syncs live match data from API-Football into our DB.
 * Runs every minute via Vercel Cron (configured in vercel.json).
 *
 * What it does each run:
 * 1. Finds matches that need syncing (live, just-started, or recently finished).
 * 2. For each match: fetches current status + player stats from API-Football.
 * 3. Updates `matches` table (status, scores).
 * 4. Upserts `player_match_stats` (shots_on_target, goals, minutes_played, etc.).
 * 5. Logs each sync to `api_sync_events`.
 *
 * If no matches need syncing, exits immediately with 0 API calls — safe to run
 * even when there are no live matches.
 *
 * Auth: Vercel sends `Authorization: Bearer {CRON_SECRET}` on each invocation.
 * In local dev (NODE_ENV !== 'production') the check is skipped.
 *
 * Rate limit impact:
 * - 1 call to getFixtureById + 1 call to getFixturePlayers per match per minute.
 * - Max 10 simultaneous PL matches → 20 calls/minute worst case.
 * - Well within the API-Football PRO plan (7,500 requests/day).
 */

import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getFixtureById,
  getFixturePlayers,
  mapFixtureStatus,
  mapPlayerStatPosition,
} from "@/lib/api-football/client";

// ─── Supabase admin client ────────────────────────────────────────────────────
// Service role bypasses RLS — this route runs server-side only, never exposed
// to the browser.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  // In local development, skip the cron secret check for easier testing.
  if (process.env.NODE_ENV !== "production") return true;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET env variable is not set.");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** How many hours after kickoff we still try to sync stats (for late corrections). */
const SYNC_WINDOW_HOURS = 24;

/**
 * Returns the list of matches that need syncing right now:
 * - Currently live (status = 'live').
 * - Scheduled but kickoff has already passed (status = 'scheduled', missed transition).
 * - Recently finished (within SYNC_WINDOW_HOURS) — API can still correct stats.
 */
async function getMatchesToSync() {
  const windowStart = new Date(
    Date.now() - SYNC_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("matches")
    .select("id, api_external_id, status, kickoff_time, match_day_id")
    .or(
      // Live matches
      `status.eq.live,` +
      // Scheduled matches whose kickoff has already passed (missed by previous run)
      `and(status.eq.scheduled,kickoff_time.lte.${new Date().toISOString()}),` +
      // Recently finished matches (stats can still be corrected within 24h)
      `and(status.eq.finished,kickoff_time.gte.${windowStart})`
    );

  if (error) throw new Error(`DB query failed: ${error.message}`);
  return data ?? [];
}

/**
 * Given a list of API player IDs (strings), returns a Map of
 * api_external_id → internal players.id for fast lookups.
 */
async function buildPlayerIdMap(
  apiPlayerIds: string[]
): Promise<Map<string, number>> {
  if (apiPlayerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("players")
    .select("id, api_external_id")
    .in("api_external_id", apiPlayerIds);

  if (error) throw new Error(`Player lookup failed: ${error.message}`);

  return new Map((data ?? []).map((p) => [p.api_external_id, p.id]));
}

// ─── Core sync logic per match ────────────────────────────────────────────────

async function syncMatch(match: {
  id: number;
  api_external_id: string;
  status: string;
}): Promise<{ matchId: number; playersUpdated: number; error?: string }> {
  const fixtureId = Number(match.api_external_id);

  try {
    // Step 1: Fetch current match status from API.
    const apiFixture = await getFixtureById(fixtureId);
    if (!apiFixture) {
      return { matchId: match.id, playersUpdated: 0, error: "Fixture not found in API" };
    }

    const newStatus = mapFixtureStatus(apiFixture.fixture.status.short);
    const wentToExtraTime = apiFixture.score.extratime.home !== null;
    const wentToPenalties = apiFixture.score.penalty.home !== null;

    // Step 2: Update match status and scores in DB.
    await supabase
      .from("matches")
      .update({
        status: newStatus,
        home_score: apiFixture.goals.home ?? null,
        away_score: apiFixture.goals.away ?? null,
        went_to_extra_time: wentToExtraTime,
        went_to_penalties: wentToPenalties,
      })
      .eq("id", match.id);

    // Step 3: Fetch and upsert player stats (only if match has started).
    // A match that is still 'scheduled' after our status check just started —
    // API might not have player data yet; skip to avoid empty upserts.
    if (newStatus === "scheduled") {
      return { matchId: match.id, playersUpdated: 0 };
    }

    const teamStats = await getFixturePlayers(fixtureId);

    // Collect all API player IDs from the response for a batch DB lookup.
    const allApiPlayerIds = teamStats.flatMap((team) =>
      team.players.map((p) => String(p.player.id))
    );

    const playerIdMap = await buildPlayerIdMap(allApiPlayerIds);

    // Build upsert rows for player_match_stats.
    const statsRows: Array<{
      match_id: number;
      player_id: number;
      minutes_played: number;
      shots_on_target: number;
      goals: number;
      own_goals: number;
      was_red_carded: boolean;
      is_final: boolean;
      last_api_sync_at: string;
    }> = [];

    for (const team of teamStats) {
      for (const { player, statistics } of team.players) {
        const internalPlayerId = playerIdMap.get(String(player.id));

        if (!internalPlayerId) {
          // Player exists in API but not in our DB (e.g., emergency loan).
          // Skip — we can't link stats without a valid player_id.
          console.warn(
            `Player API ID ${player.id} (${player.name}) not found in DB. Skipping.`
          );
          continue;
        }

        const stats = statistics[0];

        // goals.conceded for outfield players = own goals scored.
        // For GKs it's goals conceded (not relevant for our game) → set to 0.
        const isGK = stats.games.position === "G";
        const ownGoals = isGK ? 0 : (stats.goals.conceded ?? 0);

        statsRows.push({
          match_id: match.id,
          player_id: internalPlayerId,
          minutes_played: stats.games.minutes ?? 0,
          shots_on_target: stats.shots.on ?? 0,
          goals: stats.goals.total ?? 0,
          own_goals: ownGoals,
          was_red_carded: stats.cards.red > 0,
          // Mark as final only after the match is finished.
          // The evaluate-picks cron will use is_final = true as its trigger.
          is_final: newStatus === "finished",
          last_api_sync_at: new Date().toISOString(),
        });
      }
    }

    if (statsRows.length > 0) {
      const { error: upsertError } = await supabase
        .from("player_match_stats")
        .upsert(statsRows, { onConflict: "match_id,player_id" });

      if (upsertError) {
        return {
          matchId: match.id,
          playersUpdated: 0,
          error: `Stats upsert failed: ${upsertError.message}`,
        };
      }
    }

    // Step 4: Log successful sync to api_sync_events.
    await supabase.from("api_sync_events").insert({
      entity_type: "player_stats",
      entity_id: String(fixtureId),
      sync_status: "success",
      api_response_summary: {
        fixture_status: newStatus,
        players_synced: statsRows.length,
      },
    });

    return { matchId: match.id, playersUpdated: statsRows.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Log failed sync attempt.
    await supabase.from("api_sync_events").insert({
      entity_type: "player_stats",
      entity_id: String(fixtureId),
      sync_status: "failed",
      error_message: message,
    });

    return { matchId: match.id, playersUpdated: 0, error: message };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const matches = await getMatchesToSync();

    if (matches.length === 0) {
      return Response.json({
        ok: true,
        message: "No matches to sync.",
        elapsed_ms: Date.now() - startedAt,
      });
    }

    console.log(`Syncing ${matches.length} matches...`);

    // Run syncs in parallel — each match is independent.
    const results = await Promise.allSettled(
      matches.map((match) => syncMatch(match))
    );

    const summary = results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { matchId: -1, playersUpdated: 0, error: String(r.reason) }
    );

    const errors = summary.filter((r) => r.error);
    const totalPlayersUpdated = summary.reduce(
      (acc, r) => acc + r.playersUpdated,
      0
    );

    return Response.json({
      ok: errors.length === 0,
      matches_synced: matches.length,
      players_updated: totalPlayersUpdated,
      errors: errors.length > 0 ? errors : undefined,
      elapsed_ms: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Sync cron fatal error:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
