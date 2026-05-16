/**
 * app/api/cron/check-lineups/route.ts
 *
 * Cron job that checks confirmed lineups ~30-50 minutes before kickoff.
 * If a user's picked player is NOT in the Starting XI (i.e., on the bench),
 * sends an email warning so they can change their pick before the deadline.
 *
 * Runs every 5 minutes via Vercel Cron (configured in vercel.json).
 *
 * Flow:
 *   1. Find scheduled matches kicking off in the next 50 minutes
 *      where lineups_notified = FALSE.
 *   2. For each match, call API-Football /fixtures/lineups.
 *   3. If lineups aren't available yet → skip (retry next run).
 *   4. If lineups are available → extract Starting XI player IDs.
 *   5. Find user picks for this match that are still unlocked,
 *      whose player is NOT in the Starting XI.
 *   6. Send warning email to those users.
 *   7. Mark match as lineups_notified = TRUE.
 *
 * Rate limit impact:
 *   - 1 API call per match in the 50-min window, retried every 5 min.
 *   - Worst case Mundial (4 matches/day): ~40 calls/day (negligible).
 *
 * Auth: same CRON_SECRET pattern as sync-live-matches.
 */

import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getFixtureLineups } from "@/lib/api-football/client";
import { sendEmail } from "@/lib/email/send";
import { substituteWarningEmailTemplate } from "@/lib/email/templates/substitute-warning";

// ─── Supabase admin client ────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET env variable is not set.");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Check lineups for matches kicking off in the next 50 minutes.
// Lineups are typically available 20-40 min before kickoff, so 50 min gives
// us a few retries (cron runs every 5 min) before they become available.
const LOOKAHEAD_MINUTES = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a UTC kickoff_time to CDMX time string (e.g. "14:00").
 */
function formatKickoffCDMX(kickoffTimeUtc: string): string {
  const date = new Date(kickoffTimeUtc);
  return date.toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Core logic ───────────────────────────────────────────────────────────────

interface CheckResult {
  matchId: number;
  lineupsAvailable: boolean;
  warningsSent: number;
  emailsFailed?: number;
  error?: string;
}

async function checkLineupsForMatch(match: {
  id: number;
  api_external_id: string;
  kickoff_time: string;
  match_day_id: number;
}): Promise<CheckResult> {
  const fixtureId = Number(match.api_external_id);

  // Step 1: Fetch lineups from API-Football
  let lineupTeams;
  try {
    lineupTeams = await getFixtureLineups(fixtureId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[check-lineups] API error for fixture ${fixtureId}: ${message}`);
    return { matchId: match.id, lineupsAvailable: false, warningsSent: 0, error: message };
  }

  // If lineups aren't available yet, skip — retry next run
  if (!lineupTeams || lineupTeams.length === 0) {
    console.log(`[check-lineups] Lineups not yet available for match ${match.id} (fixture ${fixtureId})`);
    return { matchId: match.id, lineupsAvailable: false, warningsSent: 0 };
  }

  // Step 2: Extract Starting XI API player IDs from both teams
  const startingXIApiIds = new Set<string>();
  const teamNames: { home: string; away: string } = { home: "?", away: "?" };

  lineupTeams.forEach((team, index) => {
    // First team in response is home, second is away
    if (index === 0) teamNames.home = team.team.name;
    if (index === 1) teamNames.away = team.team.name;

    for (const entry of team.startXI) {
      startingXIApiIds.add(String(entry.player.id));
    }
  });

  console.log(
    `[check-lineups] Lineups available for match ${match.id}: ` +
    `${teamNames.home} vs ${teamNames.away} (${startingXIApiIds.size} starters)`
  );

  // Step 3: Find unlocked picks for this match
  const { data: picks, error: picksError } = await supabase
    .from("user_picks")
    .select("id, user_id, player_id")
    .eq("match_id", match.id)
    .eq("is_locked", false);

  if (picksError) {
    throw new Error(`Failed to fetch picks for match ${match.id}: ${picksError.message}`);
  }

  if (!picks || picks.length === 0) {
    // No unlocked picks for this match — mark as notified and move on
    await markLineupsNotified(match.id);
    return { matchId: match.id, lineupsAvailable: true, warningsSent: 0 };
  }

  // Step 4: Get API external IDs for the picked players
  const playerIds = picks.map((p) => p.player_id);
  const playerDetails = await getPlayerDetails(playerIds);

  // Step 5: Find picks where the player is NOT in the Starting XI
  const affectedPicks = picks.filter((pick) => {
    const apiExtId = playerDetails.get(pick.player_id)?.apiExternalId;
    if (!apiExtId) return false; // Player not in our DB — can't check
    return !startingXIApiIds.has(apiExtId);
  });

  if (affectedPicks.length === 0) {
    // All picked players are starters — great, no warnings needed
    await markLineupsNotified(match.id);
    return { matchId: match.id, lineupsAvailable: true, warningsSent: 0 };
  }

  // Step 6: Filter to approved users only (same pattern as evaluate-picks)
  const { data: approvedUsers, error: approvedError } = await supabase
    .from("users")
    .select("id, email, username")
    .eq("is_approved", true)
    .in("id", affectedPicks.map((p) => p.user_id));

  if (approvedError) {
    throw new Error(`Failed to fetch approved users: ${approvedError.message}`);
  }

  const userById = new Map((approvedUsers ?? []).map((u) => [u.id, u]));

  // Step 7: Get match_date for the pick URL
  const { data: matchDay } = await supabase
    .from("match_days")
    .select("match_date")
    .eq("id", match.match_day_id)
    .single();

  const matchDate = matchDay?.match_date ?? "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tiroapuerta.mx";
  const kickoffCDMX = formatKickoffCDMX(match.kickoff_time);

  // Step 8: Send warning emails
  let warningsSent = 0;
  let emailsFailed = 0;

  for (const pick of affectedPicks) {
    const user = userById.get(pick.user_id);
    if (!user?.email) continue;

    const details = playerDetails.get(pick.player_id);
    const playerName = details?.displayName ?? "Tu jugador";

    const { subject, html } = substituteWarningEmailTemplate({
      username: user.username,
      playerName,
      homeTeam: teamNames.home,
      awayTeam: teamNames.away,
      matchDate,
      kickoffTime: kickoffCDMX,
      pickUrl: `${appUrl}/pick?date=${matchDate}`,
    });

    const result = await sendEmail({ to: user.email, subject, html });
    if (result.ok) {
      console.log(`[check-lineups] Warning sent to @${user.username}: ${playerName} is benched`);
      warningsSent++;
    } else {
      console.error(`[check-lineups] Failed to send to ${user.email}: ${result.error}`);
      emailsFailed++;
    }
  }

  // Step 9: Only mark as notified if all emails succeeded.
  // If any failed, leave lineups_notified = FALSE so the next cron run retries.
  if (emailsFailed === 0) {
    await markLineupsNotified(match.id);
  } else {
    console.warn(`[check-lineups] ${emailsFailed} email(s) failed for match ${match.id} — will retry next run`);
  }

  return { matchId: match.id, lineupsAvailable: true, warningsSent, emailsFailed };
}

/**
 * Fetches player display_name and api_external_id for a set of internal IDs.
 */
async function getPlayerDetails(
  playerIds: number[]
): Promise<Map<number, { apiExternalId: string; displayName: string }>> {
  if (playerIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("players")
    .select("id, api_external_id, display_name")
    .in("id", playerIds);

  if (error) throw new Error(`Player details lookup failed: ${error.message}`);

  return new Map(
    (data ?? []).map((p) => [
      p.id,
      { apiExternalId: p.api_external_id, displayName: p.display_name },
    ])
  );
}

async function markLineupsNotified(matchId: number): Promise<void> {
  const { error } = await supabase
    .from("matches")
    .update({ lineups_notified: true })
    .eq("id", matchId);

  if (error) {
    console.error(`[check-lineups] Failed to mark lineups_notified for match ${matchId}: ${error.message}`);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const now = new Date();
    const lookaheadEnd = new Date(now.getTime() + LOOKAHEAD_MINUTES * 60 * 1000);

    // Find scheduled matches in the lookahead window that haven't been checked yet
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("id, api_external_id, kickoff_time, match_day_id")
      .eq("status", "scheduled")
      .eq("lineups_notified", false)
      .gte("kickoff_time", now.toISOString())
      .lte("kickoff_time", lookaheadEnd.toISOString());

    if (matchError) {
      throw new Error(`Failed to fetch upcoming matches: ${matchError.message}`);
    }

    if (!matches || matches.length === 0) {
      return Response.json({
        ok: true,
        matches_checked: 0,
        warnings_sent: 0,
        elapsed_ms: Date.now() - startedAt,
      });
    }

    console.log(`[check-lineups] Found ${matches.length} match(es) to check`);

    // Check lineups for each match
    const results: CheckResult[] = [];
    for (const match of matches) {
      try {
        const result = await checkLineupsForMatch(match);
        results.push(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[check-lineups] Error checking match ${match.id}: ${message}`);
        results.push({
          matchId: match.id,
          lineupsAvailable: false,
          warningsSent: 0,
          error: message,
        });
      }
    }

    const totalWarnings = results.reduce((sum, r) => sum + r.warningsSent, 0);
    const lineupsFound = results.filter((r) => r.lineupsAvailable).length;
    const errors = results.filter((r) => r.error).map((r) => r.error!);

    return Response.json({
      ok: errors.length === 0,
      matches_checked: matches.length,
      lineups_found: lineupsFound,
      warnings_sent: totalWarnings,
      details: results.length > 0 ? results : undefined,
      errors: errors.length > 0 ? errors : undefined,
      elapsed_ms: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("check-lineups cron fatal error:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
