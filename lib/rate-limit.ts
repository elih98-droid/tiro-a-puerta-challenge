/**
 * lib/rate-limit.ts
 *
 * In-memory rate limiter for Server Actions.
 * Uses a simple sliding-window counter keyed by IP address.
 *
 * On Vercel Serverless, the in-memory Map resets on cold starts.
 * This is intentional: fail-open is acceptable — the rate limit is
 * a deterrent, not an absolute barrier. The approval system is the
 * real gatekeeper for account creation.
 *
 * No external dependencies (no Redis, no npm packages).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

// Key format: "action:ip" → e.g. "signIn:189.203.45.12"
const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

// ─── Preset configs for each action ──────────────────────────────────────────

export const RATE_LIMITS = {
  signIn: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },       // 5 per 15 min
  signUp: { maxAttempts: 3, windowMs: 60 * 60 * 1000 },       // 3 per 60 min
  resetPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per 60 min
  submitPick: { maxAttempts: 20, windowMs: 5 * 60 * 1000 },   // 20 per 5 min
  removePick: { maxAttempts: 20, windowMs: 5 * 60 * 1000 },       // 20 per 5 min
  resendConfirm: { maxAttempts: 3, windowMs: 15 * 60 * 1000 },   // 3 per 15 min
} as const;

// ─── Main function ───────────────────────────────────────────────────────────

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number; // 0 if ok, otherwise ms until window resets
}

/**
 * Check and increment rate limit for a given action + IP.
 * Returns { ok: true } if the request is allowed.
 */
export function checkRateLimit(
  action: keyof typeof RATE_LIMITS,
  ip: string,
): RateLimitResult {
  cleanupStaleEntries();

  const config = RATE_LIMITS[action];
  const key = `${action}:${ip}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  // No entry or window expired → start fresh
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { ok: true, remaining: config.maxAttempts - 1, retryAfterMs: 0 };
  }

  // Within window — check if under limit
  if (entry.count < config.maxAttempts) {
    entry.count++;
    return {
      ok: true,
      remaining: config.maxAttempts - entry.count,
      retryAfterMs: 0,
    };
  }

  // Over the limit
  return {
    ok: false,
    remaining: 0,
    retryAfterMs: entry.resetAt - now,
  };
}

/**
 * Helper: format retryAfterMs into a human-readable Spanish string.
 */
export function formatRetryAfter(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes <= 1) return '1 minuto';
  return `${minutes} minutos`;
}
