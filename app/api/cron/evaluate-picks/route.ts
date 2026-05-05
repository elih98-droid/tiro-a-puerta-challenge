/**
 * app/api/cron/evaluate-picks/route.ts
 *
 * Cron job that evaluates pick results once a match day is complete.
 * Configured in vercel.json to run every minute (idempotent — skips
 * picks already evaluated and days already processed).
 *
 * What it does each run:
 * 1. Locks picks whose effective_deadline has passed (is_locked → TRUE).
 * 2. Finds match_days where ALL matches are 'finished' or 'cancelled'.
 * 3. For each such day: evaluates every locked pick with result = NULL.
 *    - Determines result: survived / eliminated / void_cancelled_match / void_did_not_play.
 *    - Updates user_picks (result, shots_on_target_count, goals_scored, processed_at).
 *    - Updates user_status (is_alive, days_survived, total_goals_accumulated, etc.).
 * 4. Eliminates alive users who had no pick that day (E1 — 'no_pick').
 * 5. Marks match_days.is_processed = TRUE.
 *
 * Survival rules applied (game-rules.md §4):
 *   survived          → player played (minutes > 0) AND shots_on_target >= 1
 *   eliminated        → player played (minutes > 0) AND shots_on_target = 0   [reason: no_shot_on_target]
 *   void_did_not_play → minutes_played = 0 (or no stats row)                  [reason: player_did_not_play]
 *   void_cancelled_match → match was cancelled entirely                        [user survives, no goals added]
 *
 * Goals accumulated (game-rules.md §5.1, §5.2):
 *   Only player_match_stats.goals counts — not own_goals, not penalty shootout goals.
 *   Accumulated only when result = 'survived' (not on void_cancelled_match).
 *
 * Note on the 24h rule (game-rules.md §6.5):
 *   Rules say results are "final" 24h after the match ends. For the MVP we
 *   evaluate as soon as all matches for the day are finished. A future
 *   iteration can enforce the 24h window before setting is_processed = TRUE.
 *
 * Auth: same pattern as sync-live-matches — CRON_SECRET header in production,
 * skipped in local dev.
 */

import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { eliminationEmailTemplate } from "@/lib/email/templates/elimination";

// ─── Types ────────────────────────────────────────────────────────────────────

type PickResult =
  | "survived"
  | "eliminated"
  | "void_cancelled_match"
  | "void_did_not_play";

type EliminationReason =
  | "no_pick"
  | "no_shot_on_target"
  | "player_did_not_play";

interface PickRow {
  id: number;
  user_id: string;
  player_id: number;
  match_id: number;
}

interface EvaluatedPick {
  pickId: number;
  userId: string;
  result: PickResult;
  shotsOnTarget: number;
  goals: number;
  eliminationReason: EliminationReason | null;
  // Populated after evaluation — used for the elimination email
  playerId?: number;
}

// Collects data needed to send elimination emails after a day is processed
interface PendingEliminationEmail {
  userId: string;
  reason: EliminationReason | "no_pick";
  playerId?: number; // undefined for no_pick case
}

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

// ─── Step 1: Lock expired picks ───────────────────────────────────────────────

/**
 * Marks as locked every pick whose deadline has already passed.
 * Requires the fixed validate_pick_timing trigger (migration 20260422000000)
 * which allows updating system columns after the deadline.
 */
async function lockExpiredPicks(): Promise<number> {
  const { data, error } = await supabase
    .from("user_picks")
    .update({ is_locked: true })
    .lt("effective_deadline", new Date().toISOString())
    .eq("is_locked", false)
    .select("id");

  if (error) throw new Error(`Failed to lock expired picks: ${error.message}`);
  return data?.length ?? 0;
}

// ─── Step 2: Find processable match_days ─────────────────────────────────────

/**
 * Returns match_days where every match is 'finished' or 'cancelled'
 * and the day has not yet been processed.
 */
async function getProcessableMatchDays(): Promise<
  Array<{ id: number; match_date: string }>
> {
  const { data: days, error: daysError } = await supabase
    .from("match_days")
    .select("id, match_date")
    .eq("is_processed", false);

  if (daysError) throw new Error(`Failed to fetch unprocessed days: ${daysError.message}`);
  if (!days?.length) return [];

  const processable: Array<{ id: number; match_date: string }> = [];

  for (const day of days) {
    // Fetch all matches for the day to check their statuses
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("status")
      .eq("match_day_id", day.id);

    if (matchError) {
      console.warn(`Could not check matches for day ${day.id}: ${matchError.message}`);
      continue;
    }

    if (!matches?.length) {
      // No matches for this day — skip (shouldn't happen but be defensive)
      continue;
    }

    const allDone = matches.every(
      (m) => m.status === "finished" || m.status === "cancelled"
    );

    if (allDone) processable.push(day);
  }

  return processable;
}

// ─── Step 3: Determine result for a single pick ───────────────────────────────

/**
 * Looks up player_match_stats and applies the survival rules from game-rules.md §4.
 */
async function evaluatePick(pick: PickRow, matchStatus: string): Promise<EvaluatedPick> {
  // Cancelled match: user survives automatically, no goals accumulated (§7.2)
  if (matchStatus === "cancelled") {
    return {
      pickId: pick.id,
      userId: pick.user_id,
      result: "void_cancelled_match",
      shotsOnTarget: 0,
      goals: 0,
      eliminationReason: null,
    };
  }

  // Look up this player's stats in this match
  const { data: stats, error: statsError } = await supabase
    .from("player_match_stats")
    .select("minutes_played, shots_on_target, goals")
    .eq("match_id", pick.match_id)
    .eq("player_id", pick.player_id)
    .maybeSingle();

  if (statsError) {
    throw new Error(
      `Stats lookup failed for pick ${pick.id} (player ${pick.player_id}, match ${pick.match_id}): ${statsError.message}`
    );
  }

  // No stats row or zero minutes: player didn't participate (E3, §4.2, §7.5)
  if (!stats || stats.minutes_played === 0) {
    return {
      pickId: pick.id,
      userId: pick.user_id,
      result: "void_did_not_play",
      shotsOnTarget: 0,
      goals: 0,
      eliminationReason: "player_did_not_play",
    };
  }

  // Player played. Did they have a shot on target? (§4.1)
  if (stats.shots_on_target >= 1) {
    return {
      pickId: pick.id,
      userId: pick.user_id,
      result: "survived",
      shotsOnTarget: stats.shots_on_target,
      // Only real goals count for the tiebreaker (§5.1).
      // own_goals are excluded — they're stored separately and not counted (§5.2, §7.4).
      goals: stats.goals,
      eliminationReason: null,
    };
  }

  // Played but no shots on target → eliminated (E2, §4.2)
  return {
    pickId: pick.id,
    userId: pick.user_id,
    result: "eliminated",
    shotsOnTarget: 0,
    goals: 0,
    eliminationReason: "no_shot_on_target",
  };
}

// ─── Step 4: Apply result to DB ───────────────────────────────────────────────

/**
 * Writes the evaluated result to user_picks and updates the user's
 * survival status in user_status.
 */
async function applyResult(
  evaluated: EvaluatedPick,
  matchDayId: number
): Promise<void> {
  // Update user_picks
  const { error: pickError } = await supabase
    .from("user_picks")
    .update({
      result: evaluated.result,
      shots_on_target_count: evaluated.shotsOnTarget,
      goals_scored: evaluated.goals,
      processed_at: new Date().toISOString(),
    })
    .eq("id", evaluated.pickId);

  if (pickError) {
    throw new Error(`Failed to update pick ${evaluated.pickId}: ${pickError.message}`);
  }

  // Update user_status based on result
  if (evaluated.result === "survived" || evaluated.result === "void_cancelled_match") {
    // User survives: increment days_survived.
    // Add goals only on 'survived' — void_cancelled_match gives survival but no goals (§7.2).
    const goalsToAdd = evaluated.result === "survived" ? evaluated.goals : 0;

    // Read current counters first (need them to increment correctly)
    const { data: currentStatus, error: statusReadError } = await supabase
      .from("user_status")
      .select("days_survived, total_goals_accumulated, total_shots_accumulated")
      .eq("user_id", evaluated.userId)
      .single();

    if (statusReadError) {
      throw new Error(`Failed to read user_status for ${evaluated.userId}: ${statusReadError.message}`);
    }

    // Only accumulate shots on 'survived' — void_cancelled_match gives survival
    // but no stats count toward tiebreakers (§5.3, consistent with goals logic).
    const shotsToAdd = evaluated.result === "survived" ? evaluated.shotsOnTarget : 0;

    const { error: statusUpdateError } = await supabase
      .from("user_status")
      .update({
        days_survived: (currentStatus.days_survived ?? 0) + 1,
        total_goals_accumulated: (currentStatus.total_goals_accumulated ?? 0) + goalsToAdd,
        total_shots_accumulated: (currentStatus.total_shots_accumulated ?? 0) + shotsToAdd,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", evaluated.userId)
      // Safety: never update stats for a user who is already eliminated.
      // This handles pre-picks for future days when the user lost on an earlier day.
      .eq("is_alive", true);

    if (statusUpdateError) {
      throw new Error(`Failed to update user_status for ${evaluated.userId}: ${statusUpdateError.message}`);
    }
  } else {
    // User is eliminated (either 'eliminated' or 'void_did_not_play')
    const { error: statusUpdateError } = await supabase
      .from("user_status")
      .update({
        is_alive: false,
        eliminated_on_match_day_id: matchDayId,
        elimination_reason: evaluated.eliminationReason,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", evaluated.userId)
      .eq("is_alive", true); // Safety: only update if still alive (avoid double-eliminating)

    if (statusUpdateError) {
      throw new Error(`Failed to eliminate user ${evaluated.userId}: ${statusUpdateError.message}`);
    }
  }
}

// ─── Step 5: Eliminate users with no pick (E1) ───────────────────────────────

/**
 * Finds alive users who have no locked pick for this match_day
 * and eliminates them (game-rules.md §4.2, E1 — 'no_pick').
 */
async function eliminateNoPickWithIds(matchDayId: number): Promise<{ count: number; userIds: string[] }> {
  // Get all currently alive users
  const { data: aliveUsers, error: aliveError } = await supabase
    .from("user_status")
    .select("user_id")
    .eq("is_alive", true);

  if (aliveError) throw new Error(`Failed to fetch alive users: ${aliveError.message}`);
  if (!aliveUsers?.length) return { count: 0, userIds: [] };

  // Get user_ids that have a locked pick for this day
  const { data: pickedUsers, error: pickedError } = await supabase
    .from("user_picks")
    .select("user_id")
    .eq("match_day_id", matchDayId)
    .eq("is_locked", true);

  if (pickedError) throw new Error(`Failed to fetch picked users: ${pickedError.message}`);

  const pickedUserIds = new Set((pickedUsers ?? []).map((p) => p.user_id));

  // Users who are alive but didn't pick
  const noPickUserIds = aliveUsers
    .map((u) => u.user_id)
    .filter((id) => !pickedUserIds.has(id));

  if (!noPickUserIds.length) return { count: 0, userIds: [] };

  // Eliminate all of them at once
  const { error: eliminateError } = await supabase
    .from("user_status")
    .update({
      is_alive: false,
      eliminated_on_match_day_id: matchDayId,
      elimination_reason: "no_pick",
      updated_at: new Date().toISOString(),
    })
    .in("user_id", noPickUserIds);

  if (eliminateError) {
    throw new Error(`Failed to eliminate no-pick users: ${eliminateError.message}`);
  }

  return { count: noPickUserIds.length, userIds: noPickUserIds };
}

// ─── Email: notify eliminated users ──────────────────────────────────────────

/**
 * Fetches user data and sends elimination emails in batch.
 * Runs after the day is evaluated — errors here are logged but never throw,
 * so a failed email never blocks the cron from completing.
 */
async function sendEliminationEmails(
  eliminations: PendingEliminationEmail[],
  matchDate: string
): Promise<void> {
  if (!eliminations.length) return;

  const userIds = [...new Set(eliminations.map((e) => e.userId))];
  const playerIds = [...new Set(
    eliminations.filter((e) => e.playerId != null).map((e) => e.playerId!)
  )];

  // Fetch user emails + usernames + days survived + goals from public.users
  // joined with user_status in two separate queries (Supabase JS doesn't join)
  const [usersResult, statusResult, playersResult] = await Promise.all([
    supabase.from("users").select("id, email, username").in("id", userIds),
    supabase
      .from("user_status")
      .select("user_id, days_survived, total_goals_accumulated")
      .in("user_id", userIds),
    playerIds.length
      ? supabase.from("players").select("id, name").in("id", playerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (usersResult.error) {
    console.error("[sendEliminationEmails] Failed to fetch users:", usersResult.error.message);
    return;
  }

  const userById = new Map(
    (usersResult.data ?? []).map((u) => [u.id, u])
  );
  const statusByUserId = new Map(
    (statusResult.data ?? []).map((s) => [s.user_id, s])
  );
  const playerById = new Map(
    (playersResult.data ?? []).map((p) => [p.id, p])
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tiro-a-puerta.vercel.app";

  for (const elimination of eliminations) {
    const user = userById.get(elimination.userId);
    const status = statusByUserId.get(elimination.userId);

    if (!user?.email) {
      console.warn(`[sendEliminationEmails] No email found for user ${elimination.userId}`);
      continue;
    }

    const player = elimination.playerId ? playerById.get(elimination.playerId) : undefined;
    const { subject, html } = eliminationEmailTemplate({
      username: user.username,
      playerName: player?.name,
      matchDate,
      reason: elimination.reason,
      daysSurvived: status?.days_survived ?? 0,
      goalsAccumulated: status?.total_goals_accumulated ?? 0,
    });

    const result = await sendEmail({ to: user.email, subject, html });
    if (!result.ok) {
      console.error(`[sendEliminationEmails] Failed to send to ${user.email}: ${result.error}`);
    } else {
      console.log(`[sendEliminationEmails] Sent to @${user.username} (${user.email})`);
    }
  }
}

// ─── Core: process a single match_day ────────────────────────────────────────

async function processMatchDay(day: {
  id: number;
  match_date: string;
}): Promise<{ evaluated: number; noPickEliminated: number; errors: string[] }> {
  const errors: string[] = [];

  // Get match statuses for this day (needed to handle cancelled matches)
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, status")
    .eq("match_day_id", day.id);

  if (matchesError) throw new Error(`Failed to fetch matches for day ${day.id}: ${matchesError.message}`);

  const matchStatusById = new Map((matches ?? []).map((m) => [m.id, m.status]));

  // Get all locked picks that haven't been evaluated yet
  const { data: picks, error: picksError } = await supabase
    .from("user_picks")
    .select("id, user_id, player_id, match_id")
    .eq("match_day_id", day.id)
    .eq("is_locked", true)
    .is("result", null);

  if (picksError) throw new Error(`Failed to fetch picks for day ${day.id}: ${picksError.message}`);

  let evaluated = 0;

  // Accumulate data for elimination emails (sent at end of day processing)
  const pendingEmails: PendingEliminationEmail[] = [];

  // Evaluate each pick sequentially
  for (const pick of picks ?? []) {
    const matchStatus = matchStatusById.get(pick.match_id) ?? "finished";

    try {
      const result = await evaluatePick(pick as PickRow, matchStatus);
      await applyResult(result, day.id);
      evaluated++;

      console.log(
        `Pick ${pick.id} (user ${pick.user_id}): ${result.result}` +
        (result.shotsOnTarget > 0 ? ` | shots: ${result.shotsOnTarget}, goals: ${result.goals}` : "")
      );

      // Queue elimination email if the user was eliminated
      if (result.result === "eliminated" || result.result === "void_did_not_play") {
        pendingEmails.push({
          userId: result.userId,
          reason: result.eliminationReason!,
          playerId: pick.player_id,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error evaluating pick ${pick.id}: ${message}`);
      errors.push(message);
    }
  }

  // Eliminate alive users who had no pick today (E1)
  let noPickEliminated = 0;
  let noPickUserIds: string[] = [];
  try {
    const result = await eliminateNoPickWithIds(day.id);
    noPickEliminated = result.count;
    noPickUserIds = result.userIds;
    if (noPickEliminated > 0) {
      console.log(`Eliminated ${noPickEliminated} user(s) for missing pick on day ${day.id}.`);
      // Queue elimination emails for no-pick users
      for (const userId of noPickUserIds) {
        pendingEmails.push({ userId, reason: "no_pick" });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error processing no-pick eliminations: ${message}`);
    errors.push(message);
  }

  // Mark day as processed only if there were no errors AND no locked picks
  // remain unevaluated. The second check guards against a race condition where
  // evaluate-picks runs while a late-starting match is briefly finished in the
  // DB but its picks haven't been locked yet — without this, is_processed would
  // be set to TRUE and those picks would be skipped forever.
  if (errors.length === 0) {
    const { data: remainingPicks, error: remainingError } = await supabase
      .from("user_picks")
      .select("id")
      .eq("match_day_id", day.id)
      .eq("is_locked", true)
      .is("result", null)
      .limit(1);

    if (remainingError) {
      errors.push(`Failed to verify remaining picks for day ${day.id}: ${remainingError.message}`);
    } else if (remainingPicks && remainingPicks.length > 0) {
      // Still unevaluated picks — don't mark as processed, retry next run.
      console.warn(
        `Day ${day.id} has unevaluated locked picks remaining — not marking as processed. Will retry next run.`
      );
    } else {
      const { error: markError } = await supabase
        .from("match_days")
        .update({ is_processed: true })
        .eq("id", day.id);

      if (markError) {
        errors.push(`Failed to mark day ${day.id} as processed: ${markError.message}`);
      } else {
        console.log(`Match day ${day.id} (${day.match_date}) marked as processed.`);
      }
    }
  } else {
    console.warn(
      `Day ${day.id} had ${errors.length} error(s) — not marking as processed. Will retry next run.`
    );
  }

  // Send elimination emails for this day (fire-and-forget — never blocks the cron)
  if (pendingEmails.length > 0) {
    sendEliminationEmails(pendingEmails, day.match_date).catch((err) => {
      console.error("[processMatchDay] sendEliminationEmails threw unexpectedly:", err);
    });
  }

  return { evaluated, noPickEliminated, errors };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    // 1. Lock picks whose deadline has passed
    const locked = await lockExpiredPicks();
    if (locked > 0) console.log(`Locked ${locked} expired pick(s).`);

    // 2. Find match_days ready to be evaluated
    const processableDays = await getProcessableMatchDays();

    if (!processableDays.length) {
      return Response.json({
        ok: true,
        message: "No match days ready to evaluate.",
        picks_locked: locked,
        elapsed_ms: Date.now() - startedAt,
      });
    }

    // 3. Process each ready day
    const dayResults = [];

    for (const day of processableDays) {
      console.log(`Processing match day ${day.id} (${day.match_date})...`);
      const result = await processMatchDay(day);
      dayResults.push({ match_day_id: day.id, match_date: day.match_date, ...result });
    }

    const totalErrors = dayResults.flatMap((d) => d.errors);

    return Response.json({
      ok: totalErrors.length === 0,
      picks_locked: locked,
      days_processed: dayResults,
      errors: totalErrors.length > 0 ? totalErrors : undefined,
      elapsed_ms: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("evaluate-picks cron fatal error:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
