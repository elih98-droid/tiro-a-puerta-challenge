/**
 * lib/game/evaluate-pick.ts
 *
 * Pure evaluation logic for a single pick — no DB, no side effects.
 * Applies the survival rules from game-rules.md §4.
 *
 * Extracted from the evaluate-picks cron so it can be unit tested
 * without mocking Supabase.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PickResult =
  | "survived"
  | "eliminated"
  | "void_cancelled_match"
  | "void_did_not_play";

export type EliminationReason =
  | "no_pick"
  | "no_shot_on_target"
  | "player_did_not_play";

export interface PickInput {
  pickId: number;
  userId: string;
}

export interface PlayerStats {
  minutes_played: number;
  shots_on_target: number;
  goals: number;
}

export interface EvaluatedPick {
  pickId: number;
  userId: string;
  result: PickResult;
  shotsOnTarget: number;
  goals: number;
  eliminationReason: EliminationReason | null;
}

// ─── Core evaluation ────────────────────────────────────────────────────────

/**
 * Determines the result of a single pick based on match status and player stats.
 *
 * @param pick       - The pick being evaluated (id + userId).
 * @param matchStatus - Status of the match: 'finished', 'cancelled', etc.
 * @param stats      - Player stats from player_match_stats. null if no row exists
 *                     (player not in squad / not on bench).
 *
 * Rules applied (game-rules.md §4):
 *   survived          → player played (minutes > 0) AND shots_on_target >= 1
 *   eliminated        → player played (minutes > 0) AND shots_on_target = 0  [E2]
 *   void_did_not_play → minutes_played = 0 or no stats row                   [E3]
 *   void_cancelled_match → match was cancelled                                [§7.2]
 */
export function evaluatePickResult(
  pick: PickInput,
  matchStatus: string,
  stats: PlayerStats | null
): EvaluatedPick {
  // Cancelled match: user survives automatically, no goals accumulated (§7.2)
  if (matchStatus === "cancelled") {
    return {
      pickId: pick.pickId,
      userId: pick.userId,
      result: "void_cancelled_match",
      shotsOnTarget: 0,
      goals: 0,
      eliminationReason: null,
    };
  }

  // No stats row or zero minutes: player didn't participate (E3, §4.2, §7.5)
  if (!stats || stats.minutes_played === 0) {
    return {
      pickId: pick.pickId,
      userId: pick.userId,
      result: "void_did_not_play",
      shotsOnTarget: 0,
      goals: 0,
      eliminationReason: "player_did_not_play",
    };
  }

  // Player played and had at least one shot on target → survived (§4.1)
  if (stats.shots_on_target >= 1) {
    return {
      pickId: pick.pickId,
      userId: pick.userId,
      result: "survived",
      shotsOnTarget: stats.shots_on_target,
      goals: stats.goals,
      eliminationReason: null,
    };
  }

  // Played but no shots on target → eliminated (E2, §4.2)
  return {
    pickId: pick.pickId,
    userId: pick.userId,
    result: "eliminated",
    shotsOnTarget: 0,
    goals: 0,
    eliminationReason: "no_shot_on_target",
  };
}
