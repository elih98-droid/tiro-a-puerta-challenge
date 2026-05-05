import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withSentryConfig(nextConfig, {
  org: "tiro-a-puerta",
  project: "tiro-a-puerta",

  // Silences Sentry CLI output during builds.
  silent: !process.env.CI,

  // Upload source maps so stack traces show original TypeScript.
  // Requires SENTRY_AUTH_TOKEN in Vercel env vars.
  sourcemaps: {
    disable: false,
  },
});
