/**
 * app/api/cron/evaluate-picks/route.ts
 *
 * Cron job that evaluates pick results. Runs every minute (idempotent).
 *
 * Two-phase evaluation:
 *
 * Phase A — Per-match (immediate feedback):
 *   As soon as an individual match finishes, evaluates all picks that
 *   reference that match. Users get their result without waiting for
 *   every other match of the day to finish. Critical for Mundial days
 *   where matches span 1pm–10pm CDMX (up to 6 matches per day).
 *
 * Phase B — Per-day (end-of-day cleanup):
 *   Once ALL matches of a day are finished/cancelled:
 *   - Eliminates alive users who had no pick (E1 — 'no_pick').
 *   - Marks match_days.is_processed = TRUE.
 *
 * Additionally, on every run:
 *   - Locks picks whose effective_deadline has passed (is_locked → TRUE).
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
 *   evaluate as soon as the match finishes. A future iteration can enforce
 *   the 24h window before setting is_processed = TRUE.
 *
 * Auth: same pattern as sync-live-matches — CRON_SECRET header in production,
 * skipped in local dev.
 */

import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { eliminationEmailTemplate } from "@/lib/email/templates/elimination";
import {
  evaluatePickResult,
  type EvaluatedPick,
  type EliminationReason,
} from "@/lib/game/evaluate-pick";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PickRow {
  id: number;
  user_id: string;
  player_id: number;
  match_id: number;
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
 * Fetches player stats from DB and delegates to the pure evaluation function
 * in lib/game/evaluate-pick.ts (game-rules.md §4).
 */
async function evaluatePick(pick: PickRow, matchStatus: string): Promise<EvaluatedPick> {
  // For cancelled matches, no need to fetch stats
  if (matchStatus === "cancelled") {
    return evaluatePickResult(
      { pickId: pick.id, userId: pick.user_id },
      matchStatus,
      null
    );
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

  return evaluatePickResult(
    { pickId: pick.id, userId: pick.user_id },
    matchStatus,
    stats
  );
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
  // Get all currently alive AND approved users.
  // Unapproved users are excluded — they can't make picks yet, so penalizing
  // them for 'no_pick' would be incorrect.
  const { data: approvedUsers, error: approvedError } = await supabase
    .from("users")
    .select("id")
    .eq("is_approved", true);

  if (approvedError) throw new Error(`Failed to fetch approved users: ${approvedError.message}`);
  const approvedUserIds = new Set((approvedUsers ?? []).map((u) => u.id));

  const { data: aliveUsers, error: aliveError } = await supabase
    .from("user_status")
    .select("user_id")
    .eq("is_alive", true);

  if (aliveError) throw new Error(`Failed to fetch alive users: ${aliveError.message}`);
  if (!aliveUsers?.length) return { count: 0, userIds: [] };

  // Filter to only approved users
  const aliveApprovedUsers = aliveUsers.filter((u) => approvedUserIds.has(u.user_id));
  if (!aliveApprovedUsers.length) return { count: 0, userIds: [] };

  // Get user_ids that have a locked pick for this day
  const { data: pickedUsers, error: pickedError } = await supabase
    .from("user_picks")
    .select("user_id")
    .eq("match_day_id", matchDayId)
    .eq("is_locked", true);

  if (pickedError) throw new Error(`Failed to fetch picked users: ${pickedError.message}`);

  const pickedUserIds = new Set((pickedUsers ?? []).map((p) => p.user_id));

  // Users who are alive + approved but didn't pick
  const noPickUserIds = aliveApprovedUsers
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
      ? supabase.from("players").select("id, display_name").in("id", playerIds)
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tiroapuerta.mx";

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
      playerName: player?.display_name,
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

// ─── Phase A: Evaluate picks per finished match (immediate feedback) ────────

/**
 * Finds all locked picks with no result whose match has already finished
 * (or been cancelled) and evaluates them immediately — without waiting for
 * the entire match day to complete.
 *
 * This is the key improvement for the Mundial: on a day with matches at
 * 1pm, 4pm, and 7pm, the 1pm user gets their result as soon as that match
 * ends instead of waiting until after 9pm.
 */
async function evaluatePicksForFinishedMatches(): Promise<{
  evaluated: number;
  pendingEmails: PendingEliminationEmail[];
  errors: string[];
}> {
  const errors: string[] = [];
  let evaluated = 0;
  const pendingEmails: PendingEliminationEmail[] = [];

  // Only evaluate picks for users who are alive AND approved.
  // Eliminated users' pre-picks are skipped entirely — no result is written,
  // avoiding misleading 'survived' entries on /my-picks for already-out players.
  // Unapproved users are excluded so they don't get evaluated/eliminated
  // before an admin approves them (they can't even make picks yet).
  const { data: approvedUsers, error: approvedError } = await supabase
    .from("users")
    .select("id")
    .eq("is_approved", true);

  if (approvedError) throw new Error(`Failed to fetch approved users: ${approvedError.message}`);
  const approvedUserIds = new Set((approvedUsers ?? []).map((u) => u.id));

  const { data: aliveStatuses, error: aliveError } = await supabase
    .from("user_status")
    .select("user_id")
    .eq("is_alive", true);

  if (aliveError) throw new Error(`Failed to fetch alive users: ${aliveError.message}`);
  const aliveUserIds = (aliveStatuses ?? [])
    .map((s) => s.user_id)
    .filter((id) => approvedUserIds.has(id));
  if (aliveUserIds.length === 0) return { evaluated: 0, pendingEmails: [], errors: [] };

  // Get all locked picks with no result yet, for alive users only
  const { data: pendingPicks, error: picksError } = await supabase
    .from("user_picks")
    .select("id, user_id, player_id, match_id, match_day_id")
    .eq("is_locked", true)
    .is("result", null)
    .in("user_id", aliveUserIds);

  if (picksError) throw new Error(`Failed to fetch pending picks: ${picksError.message}`);
  if (!pendingPicks?.length) return { evaluated: 0, pendingEmails: [], errors: [] };

  // Get statuses of the matches these picks reference
  const matchIds = [...new Set(pendingPicks.map((p) => p.match_id))];
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, status")
    .in("id", matchIds);

  if (matchesError) throw new Error(`Failed to fetch match statuses: ${matchesError.message}`);

  const matchStatusById = new Map(
    (matches ?? []).map((m) => [m.id, m.status as string])
  );

  // Only evaluate picks whose match is already finished or cancelled
  const evaluablePicks = pendingPicks.filter((p) => {
    const status = matchStatusById.get(p.match_id);
    return status === "finished" || status === "cancelled";
  });

  if (evaluablePicks.length === 0) return { evaluated: 0, pendingEmails: [], errors: [] };

  // Get match_day dates (needed for elimination emails)
  const dayIds = [...new Set(evaluablePicks.map((p) => p.match_day_id))];
  const { data: days } = await supabase
    .from("match_days")
    .select("id, match_date")
    .in("id", dayIds);
  const dateByDayId = new Map((days ?? []).map((d) => [d.id, d.match_date]));

  // Evaluate each pick sequentially
  for (const pick of evaluablePicks) {
    const matchStatus = matchStatusById.get(pick.match_id) ?? "finished";

    try {
      const result = await evaluatePick(pick as PickRow, matchStatus);
      await applyResult(result, pick.match_day_id);
      evaluated++;

      console.log(
        `[per-match] Pick ${pick.id} (user ${pick.user_id}): ${result.result}` +
          (result.shotsOnTarget > 0
            ? ` | shots: ${result.shotsOnTarget}, goals: ${result.goals}`
            : "")
      );

      // Queue elimination email if the user was eliminated
      if (
        result.result === "eliminated" ||
        result.result === "void_did_not_play"
      ) {
        pendingEmails.push({
          userId: result.userId,
          reason: result.eliminationReason!,
          playerId: pick.player_id,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[per-match] Error evaluating pick ${pick.id}: ${message}`);
      errors.push(message);
    }
  }

  // Send elimination emails (fire-and-forget — never blocks the cron)
  if (pendingEmails.length > 0) {
    // Group emails by match_day for the date context in the email template
    for (const dayId of dayIds) {
      const matchDate = dateByDayId.get(dayId) ?? "unknown";
      const dayEmails = pendingEmails.filter((e) => {
        const pick = evaluablePicks.find((p) => p.user_id === e.userId);
        return pick?.match_day_id === dayId;
      });
      if (dayEmails.length > 0) {
        sendEliminationEmails(dayEmails, matchDate).catch((err) => {
          console.error("[per-match] sendEliminationEmails threw:", err);
        });
      }
    }
  }

  return { evaluated, pendingEmails, errors };
}

// ─── Phase B: Close completed match days (no-pick + is_processed) ───────────

/**
 * Runs AFTER Phase A. Once ALL matches of a day are finished/cancelled:
 * 1. Eliminates alive users who didn't submit a pick (E1 — 'no_pick').
 * 2. Marks match_days.is_processed = TRUE.
 *
 * Pick evaluation is NOT done here — Phase A already handled it per-match.
 * This function only handles end-of-day cleanup that requires the full day
 * to be complete (you can't penalize someone for "no pick" while matches
 * they could pick for are still upcoming).
 */
async function closeMatchDay(day: {
  id: number;
  match_date: string;
}): Promise<{ noPickEliminated: number; errors: string[] }> {
  const errors: string[] = [];
  const pendingEmails: PendingEliminationEmail[] = [];

  // Eliminate alive users who had no pick today (E1)
  let noPickEliminated = 0;
  try {
    const result = await eliminateNoPickWithIds(day.id);
    noPickEliminated = result.count;
    if (noPickEliminated > 0) {
      console.log(
        `Eliminated ${noPickEliminated} user(s) for missing pick on day ${day.id}.`
      );
      for (const userId of result.userIds) {
        pendingEmails.push({ userId, reason: "no_pick" });
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error processing no-pick eliminations: ${message}`);
    errors.push(message);
  }

  // Mark day as processed only if there are no errors AND no locked picks
  // remain unevaluated. The second check guards against a race condition where
  // Phase A hasn't caught up yet — without this, is_processed would be set to
  // TRUE and those picks would be skipped forever.
  if (errors.length === 0) {
    const { data: remainingPicks, error: remainingError } = await supabase
      .from("user_picks")
      .select("id")
      .eq("match_day_id", day.id)
      .eq("is_locked", true)
      .is("result", null)
      .limit(1);

    if (remainingError) {
      errors.push(
        `Failed to verify remaining picks for day ${day.id}: ${remainingError.message}`
      );
    } else if (remainingPicks && remainingPicks.length > 0) {
      // Phase A hasn't finished evaluating — don't close yet, retry next run.
      console.warn(
        `Day ${day.id} has unevaluated locked picks remaining — not marking as processed.`
      );
    } else {
      const { error: markError } = await supabase
        .from("match_days")
        .update({ is_processed: true })
        .eq("id", day.id);

      if (markError) {
        errors.push(
          `Failed to mark day ${day.id} as processed: ${markError.message}`
        );
      } else {
        console.log(
          `Match day ${day.id} (${day.match_date}) marked as processed.`
        );
      }
    }
  } else {
    console.warn(
      `Day ${day.id} had ${errors.length} error(s) — not marking as processed.`
    );
  }

  // Send no-pick elimination emails (fire-and-forget)
  if (pendingEmails.length > 0) {
    sendEliminationEmails(pendingEmails, day.match_date).catch((err) => {
      console.error("[closeMatchDay] sendEliminationEmails threw:", err);
    });
  }

  return { noPickEliminated, errors };
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

    // 2. Phase A: evaluate picks for individually finished matches.
    //    Users get their result as soon as their match ends — no waiting
    //    for every other match of the day to finish.
    const phaseA = await evaluatePicksForFinishedMatches();
    if (phaseA.evaluated > 0) {
      console.log(`[Phase A] Evaluated ${phaseA.evaluated} pick(s) for finished matches.`);
    }

    // 3. Phase B: close completed days (no-pick elimination + is_processed).
    //    Only runs when ALL matches of a day are finished/cancelled.
    const processableDays = await getProcessableMatchDays();
    const dayResults = [];

    for (const day of processableDays) {
      console.log(`[Phase B] Closing match day ${day.id} (${day.match_date})...`);
      const result = await closeMatchDay(day);
      dayResults.push({
        match_day_id: day.id,
        match_date: day.match_date,
        ...result,
      });
    }

    const totalErrors = [
      ...phaseA.errors,
      ...dayResults.flatMap((d) => d.errors),
    ];

    return Response.json({
      ok: totalErrors.length === 0,
      picks_locked: locked,
      picks_evaluated: phaseA.evaluated,
      days_closed: dayResults.length > 0 ? dayResults : undefined,
      errors: totalErrors.length > 0 ? totalErrors : undefined,
      elapsed_ms: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("evaluate-picks cron fatal error:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
