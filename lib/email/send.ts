/**
 * lib/email/send.ts
 *
 * Generic email sending wrapper.
 *
 * Why wrap Resend directly?
 *   - Email delivery is non-critical: a failed email should never crash the
 *     cron job or the signup flow. We log the error and move on.
 *   - Single place to add CC, BCC, reply-to, or swap providers later.
 */

import { resend } from "./client";

// The "from" address. Use a verified domain in production.
// For testing, Resend allows "onboarding@resend.dev" on the free tier.
// Set EMAIL_FROM in .env.local / Vercel to override.
const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/**
 * Sends a transactional email.
 * Never throws — returns { ok: false, error } on failure.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[sendEmail] Resend API error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendEmail] Unexpected error:", message);
    return { ok: false, error: message };
  }
}
