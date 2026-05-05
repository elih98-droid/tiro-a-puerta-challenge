/**
 * sentry.edge.config.ts
 *
 * Sentry initialization for the Edge runtime.
 * Next.js middleware (proxy.ts) runs in the Edge runtime — this captures
 * any errors that happen there.
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === "production",
});
