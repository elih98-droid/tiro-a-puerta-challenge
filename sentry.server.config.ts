/**
 * sentry.server.config.ts
 *
 * Sentry initialization for the server (Node.js / Vercel Functions).
 * Loaded automatically by Next.js on the server side.
 *
 * What it does:
 * - Captures errors in Server Actions, Route Handlers, and API routes.
 * - Captures cron job errors (evaluate-picks, sync-live-matches, etc.).
 * - Captures errors in middleware (proxy.ts).
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 10% of server requests traced for performance monitoring.
  tracesSampleRate: 0.1,

  // Only send errors in production.
  enabled: process.env.NODE_ENV === "production",
});
