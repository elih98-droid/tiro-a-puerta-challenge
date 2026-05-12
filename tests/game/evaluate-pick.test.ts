/**
 * tests/game/evaluate-pick.test.ts
 *
 * Unit tests for the core pick evaluation logic (game-rules.md §4).
 * Tests the pure function — no DB, no mocks, no network.
 *
 * Covers:
 *   - survived: player played + shot on target (§4.1)
 *   - eliminated: player played + no shot on target (§4.2 E2)
 *   - void_did_not_play: player didn't play / no stats (§4.2 E3, §7.5)
 *   - void_cancelled_match: match cancelled (§7.2)
 *   - Edge cases: multiple shots, goals without shots, zero minutes
 */

import { describe, it, expect } from "vitest";
import { evaluatePickResult } from "../../lib/game/evaluate-pick";

// Reusable pick input — the evaluation doesn't depend on these values,
// they're just passed through to the result.
const pick = { pickId: 1, userId: "user-abc" };

describe("evaluatePickResult", () => {
  // ─── survived (§4.1) ───────────────────────────────────────────────────

  describe("survived", () => {
    it("player with 1 shot on target and 0 goals → survived", () => {
      const result = evaluatePickResult(pick, "finished", {
        minutes_played: 90,
        shots_on_target: 1,
        goals: 0,
      });

      expect(result.result).toBe("survived");
      expect(result.shotsOnTarget).toBe(1);
      expect(result.goals).toBe(0);
      expect(result.eliminationReason).toBeNull();
    });

    it("player with 3 shots and 2 goals → survived with correct stats", () => {
      const result = evaluatePickResult(pick, "finished", {
        minutes_played: 78,
        shots_on_target: 3,
        goals: 2,
      });

      expect(result.result).toBe("survived");
      expect(result.shotsOnTarget).toBe(3);
      expect(result.goals).toBe(2);
      expect(result.eliminationReason).toBeNull();
    });

    it("substitute with 1 minute and 1 shot → survived", () => {
      const result = evaluatePickResult(pick, "finished", {
        minutes_played: 1,
        shots_on_target: 1,
        goals: 0,
      });

      expect(result.result).toBe("survived");
      expect(result.shotsOnTarget).toBe(1);
    });
  });

  // ─── eliminated (§4.2 E2) ─────────────────────────────────────────────

  describe("eliminated — no shot on target", () => {
    it("player played 90 minutes with 0 shots → eliminated", () => {
      const result = evaluatePickResult(pick, "finished", {
        minutes_played: 90,
        shots_on_target: 0,
        goals: 0,
      });

      expect(result.result).toBe("eliminated");
      expect(result.shotsOnTarget).toBe(0);
      expect(result.goals).toBe(0);
      expect(result.eliminationReason).toBe("no_shot_on_target");
    });

    it("substitute with 30 minutes and 0 shots → eliminated", () => {
      const result = evaluatePickResult(pick, "finished", {
        minutes_played: 30,
        shots_on_target: 0,
        goals: 0,
      });

      expect(result.result).toBe("eliminated");
      expect(result.eliminationReason).toBe("no_shot_on_target");
    });
  });

  // ─── void_did_not_play (§4.2 E3, §7.5) ───────────────────────────────

  describe("void_did_not_play — player didn't participate", () => {
    it("no stats row (not in squad) → eliminated with player_did_not_play", () => {
      const result = evaluatePickResult(pick, "finished", null);

      expect(result.result).toBe("void_did_not_play");
      expect(result.shotsOnTarget).toBe(0);
      expect(result.goals).toBe(0);
      expect(result.eliminationReason).toBe("player_did_not_play");
    });

    it("stats row with 0 minutes (on bench, not used) → eliminated", () => {
      const result = evaluatePickResult(pick, "finished", {
        minutes_played: 0,
        shots_on_target: 0,
        goals: 0,
      });

      expect(result.result).toBe("void_did_not_play");
      expect(result.eliminationReason).toBe("player_did_not_play");
    });
  });

  // ─── void_cancelled_match (§7.2) ──────────────────────────────────────

  describe("void_cancelled_match — match cancelled", () => {
    it("cancelled match → user survives, no goals counted", () => {
      const result = evaluatePickResult(pick, "cancelled", null);

      expect(result.result).toBe("void_cancelled_match");
      expect(result.shotsOnTarget).toBe(0);
      expect(result.goals).toBe(0);
      expect(result.eliminationReason).toBeNull();
    });

    it("cancelled match ignores stats even if they exist", () => {
      // Edge case: API might return partial stats before cancellation
      const result = evaluatePickResult(pick, "cancelled", {
        minutes_played: 45,
        shots_on_target: 2,
        goals: 1,
      });

      expect(result.result).toBe("void_cancelled_match");
      expect(result.shotsOnTarget).toBe(0);
      expect(result.goals).toBe(0);
    });
  });

  // ─── Pass-through fields ──────────────────────────────────────────────

  describe("pick identity is passed through", () => {
    it("pickId and userId are preserved in the result", () => {
      const customPick = { pickId: 42, userId: "user-xyz-123" };
      const result = evaluatePickResult(customPick, "finished", {
        minutes_played: 90,
        shots_on_target: 1,
        goals: 0,
      });

      expect(result.pickId).toBe(42);
      expect(result.userId).toBe("user-xyz-123");
    });
  });
});
