/**
 * app/api/cron/send-pick-reminders/route.ts
 *
 * Cron job that sends pick reminder emails to alive users who haven't
 * made a pick for today, triggered ~2 hours before the last match of the day.
 *
 * Configured in vercel.json to run every hour (0 * * * *).
 * It is idempotent: match_days.pick_reminder_sent = TRUE prevents duplicates.
 *
 * What it does each run:
 * 1. Finds today's match_day (by CDMX date) where pick_reminder_sent = FALSE.
 * 2. Checks if the last match of the day starts in <= 2 hours from now.
 * 3. If so, finds alive approved users without a pick for today.
 * 4. Sends a reminder email to each of them.
 * 5. Marks match_days.pick_reminder_sent = TRUE.
 *
 * Reference: game-rules.md §12.1, §13.5
 * Auth: same CRON_SECRET pattern as other crons.
 */

import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { pickReminderEmailTemplate } from "@/lib/email/templates/pick-reminder";

// ─── Supabase admin client ────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  return authHeader === `Bearer ${cronSecret}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns today's date string in CDMX timezone (America/Mexico_City = UTC-6, no DST).
 * Example: "2026-06-14"
 */
function todayInCDMX(): string {
  // CDMX is permanently UTC-6 (Mexico abolished DST in 2023).
  const now = new Date();
  const cdmxOffset = -6 * 60; // minutes
  const cdmxTime = new Date(now.getTime() + cdmxOffset * 60 * 1000);
  return cdmxTime.toISOString().slice(0, 10);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const today = todayInCDMX();

  // 1. Find today's match_day where reminders haven't been sent yet
  const { data: matchDay, error: dayError } = await supabase
    .from("match_days")
    .select("id, match_date")
    .eq("match_date", today)
    .eq("pick_reminder_sent", false)
    .maybeSingle();

  if (dayError) {
    console.error("[send-pick-reminders] Failed to fetch match_day:", dayError.message);
    return Response.json({ ok: false, error: dayError.message }, { status: 500 });
  }

  if (!matchDay) {
    return Response.json({
      ok: true,
      message: "No match day today or reminders already sent.",
      elapsed_ms: Date.now() - startedAt,
    });
  }

  // 2. Find all matches for today and their kickoff times
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("kickoff_time")
    .eq("match_day_id", matchDay.id)
    .neq("status", "cancelled")
    .order("kickoff_time", { ascending: false }); // latest first

  if (matchesError) {
    console.error("[send-pick-reminders] Failed to fetch matches:", matchesError.message);
    return Response.json({ ok: false, error: matchesError.message }, { status: 500 });
  }

  if (!matches?.length) {
    return Response.json({
      ok: true,
      message: "No active matches for today.",
      elapsed_ms: Date.now() - startedAt,
    });
  }

  // 3. Check if we're within the 2-hour reminder window before the LAST match
  const lastMatchKickoff = new Date(matches[0].kickoff_time);
  const now = new Date();
  const minutesUntilLastMatch = Math.floor(
    (lastMatchKickoff.getTime() - now.getTime()) / 60_000
  );

  // Send only if: last match starts in <= 120 min AND hasn't started yet (> 0 min)
  if (minutesUntilLastMatch > 120 || minutesUntilLastMatch <= 0) {
    return Response.json({
      ok: true,
      message: `Outside reminder window. Minutes until last match: ${minutesUntilLastMatch}`,
      elapsed_ms: Date.now() - startedAt,
    });
  }

  console.log(`[send-pick-reminders] ${minutesUntilLastMatch} min until last match — sending reminders.`);

  // 4. Find alive, approved users who DON'T have a pick for today
  const { data: aliveUsers, error: aliveError } = await supabase
    .from("user_status")
    .select("user_id")
    .eq("is_alive", true);

  if (aliveError) {
    return Response.json({ ok: false, error: aliveError.message }, { status: 500 });
  }

  if (!aliveUsers?.length) {
    return Response.json({ ok: true, message: "No alive users.", elapsed_ms: Date.now() - startedAt });
  }

  const aliveUserIds = aliveUsers.map((u) => u.user_id);

  // Users who already have a pick for today (any status — locked or not)
  const { data: usersWithPick, error: pickError } = await supabase
    .from("user_picks")
    .select("user_id")
    .eq("match_day_id", matchDay.id)
    .in("user_id", aliveUserIds);

  if (pickError) {
    return Response.json({ ok: false, error: pickError.message }, { status: 500 });
  }

  const usersWithPickIds = new Set((usersWithPick ?? []).map((p) => p.user_id));
  const usersWithoutPickIds = aliveUserIds.filter((id) => !usersWithPickIds.has(id));

  if (!usersWithoutPickIds.length) {
    // Everyone already picked — mark as sent and exit
    await supabase
      .from("match_days")
      .update({ pick_reminder_sent: true })
      .eq("id", matchDay.id);

    return Response.json({
      ok: true,
      message: "All alive users have picked. No reminders needed.",
      elapsed_ms: Date.now() - startedAt,
    });
  }

  // 5. Fetch user emails + usernames (only approved users)
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, username")
    .in("id", usersWithoutPickIds)
    .eq("is_approved", true);

  if (usersError) {
    return Response.json({ ok: false, error: usersError.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tiroapuerta.mx";
  const pickUrl = `${appUrl}/pick`;

  let sent = 0;
  let failed = 0;

  for (const user of users ?? []) {
    const { subject, html } = pickReminderEmailTemplate({
      username: user.username,
      matchDate: matchDay.match_date,
      minutesUntilLastMatch,
      pickUrl,
    });

    const result = await sendEmail({ to: user.email, subject, html });
    if (result.ok) {
      sent++;
      console.log(`[send-pick-reminders] Sent to @${user.username}`);
    } else {
      failed++;
      console.error(`[send-pick-reminders] Failed for @${user.username}: ${result.error}`);
    }
  }

  // 6. Mark reminders as sent for today — even if some emails failed,
  //    to avoid re-sending to users who received it successfully.
  const { error: updateError } = await supabase
    .from("match_days")
    .update({ pick_reminder_sent: true })
    .eq("id", matchDay.id);

  if (updateError) {
    console.error("[send-pick-reminders] Failed to mark day as sent:", updateError.message);
  }

  return Response.json({
    ok: true,
    match_day: matchDay.match_date,
    minutes_until_last_match: minutesUntilLastMatch,
    users_without_pick: usersWithoutPickIds.length,
    emails_sent: sent,
    emails_failed: failed,
    elapsed_ms: Date.now() - startedAt,
  });
}
