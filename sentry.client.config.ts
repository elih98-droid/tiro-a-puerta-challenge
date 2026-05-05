/**
 * sentry.client.config.ts
 *
 * Sentry initialization for the browser (client-side).
 * This file is automatically loaded by Next.js before the app renders.
 *
 * What it does:
 * - Captures unhandled JS errors and promise rejections in the browser.
 * - Captures React rendering errors (via error boundaries).
 * - Sends error reports to Sentry with context (URL, user action, etc.).
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // % of sessions to record as replays when an error occurs.
  // 100% means every error session gets a replay — useful during early launch.
  // Lower to 10-20% once traffic grows to save quota.
  replaysOnErrorSampleRate: 1.0,

  // % of ALL sessions to record as replays (performance monitoring).
  // 0 = off. We don't need this for the MVP.
  replaysSessionSampleRate: 0,

  // % of requests to trace for performance monitoring.
  // 0.1 = 10% — enough to spot slow routes without burning quota.
  tracesSampleRate: 0.1,

  // Only send errors in production. In local dev, log to console instead.
  enabled: process.env.NODE_ENV === "production",

  integrations: [
    Sentry.replayIntegration(),
  ],
});
