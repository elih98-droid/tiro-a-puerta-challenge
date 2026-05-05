/**
 * lib/email/client.ts
 *
 * Singleton Resend client. All email sending goes through here.
 * The API key comes from RESEND_API_KEY in .env.local / Vercel env vars.
 */

import { Resend } from "resend";

// Resend accepts undefined and will throw only when you try to send.
// This avoids crashing the app at startup if the var is missing in some env.
export const resend = new Resend(process.env.RESEND_API_KEY);
