/**
 * lib/admin/alerts.ts
 *
 * Automatic suspicious-activity detection.
 * Called from Server Actions (submitPick, signIn) after fingerprint is recorded.
 *
 * Detections (phase 1):
 *   - Same IP used by multiple accounts on the same day
 *   - Rapid pick changes (>= 5 changes in 10 minutes)
 *
 * Uses an in-memory map to avoid spamming admins with duplicate alerts.
 * Alert dedup resets on cold start — acceptable trade-off.
 */

import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email/send';
import { suspiciousActivityEmailTemplate } from '@/lib/email/templates/suspicious-activity';

// ─── Supabase admin client ──────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Alert dedup (in-memory, 24h TTL) ───────────────────────────────────────

const alertSent = new Map<string, number>(); // key → timestamp
const ALERT_TTL_MS = 24 * 60 * 60 * 1000;

function wasAlertSentRecently(key: string): boolean {
  const sentAt = alertSent.get(key);
  if (!sentAt) return false;
  if (Date.now() - sentAt > ALERT_TTL_MS) {
    alertSent.delete(key);
    return false;
  }
  return true;
}

function markAlertSent(key: string): void {
  alertSent.set(key, Date.now());
}

// ─── Admin email helper ─────────────────────────────────────────────────────

async function notifyAdmins(subject: string, html: string): Promise<void> {
  const adminEmailRaw = process.env.ADMIN_EMAIL;
  if (!adminEmailRaw) return;

  const adminEmails = adminEmailRaw.split(',').map((e) => e.trim()).filter(Boolean);
  if (adminEmails.length === 0) return;

  await Promise.all(
    adminEmails.map((to) => sendEmail({ to, subject, html })),
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

const RAPID_CHANGE_THRESHOLD = 5;
const RAPID_CHANGE_WINDOW_MINUTES = 10;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Check for suspicious activity after a pick or login.
 * Runs async — should be awaited but non-blocking for the user
 * (errors are caught and logged, never thrown to the caller).
 */
export async function checkSuspiciousActivity(
  userId: string,
  ip: string,
  action: 'pick' | 'login',
): Promise<void> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tiroapuerta.mx';
    const adminUrl = `${appUrl}/admin/approvals`;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // ── Detection 1: Same IP, multiple accounts ──────────────────────────

    const multiAccountKey = `ip_multi_account:${ip}:${today}`;

    if (!wasAlertSentRecently(multiAccountKey)) {
      // Query pick_history for distinct users from this IP today
      const { data: ipUsers } = await supabase
        .from('pick_history')
        .select('user_id')
        .eq('ip_address', ip)
        .gte('recorded_at', `${today}T00:00:00Z`)
        .limit(100);

      if (ipUsers) {
        const uniqueUserIds = [...new Set(ipUsers.map((r) => r.user_id))];

        if (uniqueUserIds.length >= 2) {
          // Fetch usernames for the alert
          const { data: users } = await supabase
            .from('users')
            .select('username')
            .in('id', uniqueUserIds);

          const usernames = (users ?? []).map((u) => u.username);

          const { subject, html } = suspiciousActivityEmailTemplate({
            alertType: 'multi_account_ip',
            details: `Se detectaron <strong>${uniqueUserIds.length} cuentas distintas</strong> haciendo picks desde la misma dirección IP. Esto podría indicar que una persona controla múltiples cuentas, o simplemente que varios participantes comparten la misma red (oficina, casa, universidad).`,
            usernames,
            ip,
            detectedAt: new Date().toISOString(),
            adminUrl,
          });

          await notifyAdmins(subject, html);
          markAlertSent(multiAccountKey);

          console.log(`[alerts] Multi-account IP alert: ${ip} → ${usernames.join(', ')}`);
        }
      }
    }

    // ── Detection 2: Rapid pick changes ──────────────────────────────────

    if (action === 'pick') {
      const rapidKey = `rapid_picks:${userId}:${today}`;

      if (!wasAlertSentRecently(rapidKey)) {
        const windowStart = new Date(
          Date.now() - RAPID_CHANGE_WINDOW_MINUTES * 60 * 1000,
        ).toISOString();

        const { count } = await supabase
          .from('pick_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('recorded_at', windowStart);

        if (count !== null && count >= RAPID_CHANGE_THRESHOLD) {
          // Fetch the username for the alert
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', userId)
            .single();

          const username = userData?.username ?? userId;

          const { subject, html } = suspiciousActivityEmailTemplate({
            alertType: 'rapid_pick_changes',
            details: `El usuario <strong>@${username}</strong> realizó <strong>${count} cambios de pick en los últimos ${RAPID_CHANGE_WINDOW_MINUTES} minutos</strong>. Esto podría indicar uso de scripts automatizados o comportamiento inusual.`,
            usernames: [username],
            ip,
            detectedAt: new Date().toISOString(),
            adminUrl,
          });

          await notifyAdmins(subject, html);
          markAlertSent(rapidKey);

          console.log(`[alerts] Rapid pick changes: @${username} (${count} in ${RAPID_CHANGE_WINDOW_MINUTES}min)`);
        }
      }
    }
  } catch (err) {
    // Never let alert checks break the user's action
    console.error('[alerts] Error checking suspicious activity:', err);
  }
}
