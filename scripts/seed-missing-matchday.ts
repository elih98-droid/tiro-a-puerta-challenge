/**
 * scripts/seed-missing-matchday.ts
 *
 * Adds missing match days and matches for specific dates WITHOUT deleting
 * existing data. Safe to run while the game is live.
 *
 * Usage:
 *   npx tsx scripts/seed-missing-matchday.ts
 *
 * Edit DATES_TO_SEED below to specify which dates to add.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getFixtures, mapFixtureStatus } from "../lib/api-football/client";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Config ───────────────────────────────────────────────────────────────────

const PREMIER_LEAGUE_ID = 39;
const SEASON = 2025;
const CDMX_TIMEZONE = "America/Mexico_City";
const PICK_DEADLINE_BUFFER_MINUTES = 5;

// Dates to seed (YYYY-MM-DD in CDMX timezone). Add as many as needed.
const DATES_TO_SEED = ["2026-05-15"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateInCDMX(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("en-CA", {
    timeZone: CDMX_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function midnightCDMX(dateStr: string): string {
  // Mexico eliminated DST in 2023. CDMX is permanently UTC-6.
  return `${dateStr}T06:00:00.000Z`;
}

function toPickDeadline(kickoffUtc: string): string {
  const ms = new Date(kickoffUtc).getTime();
  return new Date(ms - PICK_DEADLINE_BUFFER_MINUTES * 60 * 1000).toISOString();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding match days for: ${DATES_TO_SEED.join(", ")}`);

  // 1. Fetch all PL fixtures.
  console.log("Fetching fixtures from API-Football...");
  const allFixtures = await getFixtures(PREMIER_LEAGUE_ID, SEASON);
  console.log(`Fetched ${allFixtures.length} total fixtures.`);

  // 2. Filter to only the dates we want.
  const fixtures = allFixtures.filter((f) =>
    DATES_TO_SEED.includes(toDateInCDMX(f.fixture.date))
  );
  console.log(`Found ${fixtures.length} fixtures for the requested dates.`);

  if (fixtures.length === 0) {
    console.log("No fixtures found for the requested dates. Check the dates and try again.");
    return;
  }

  // 3. Load teams from DB to map API IDs → internal IDs.
  const { data: dbTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, api_external_id")
    .eq("group_letter", "X");

  if (teamsError) {
    console.error("Error loading teams:", teamsError.message);
    process.exit(1);
  }

  const teamIdByApiId = new Map<string, number>(
    (dbTeams ?? []).map((t) => [t.api_external_id, t.id])
  );

  // 4. Load current max day_number to continue the sequence.
  const { data: maxDayRow } = await supabase
    .from("match_days")
    .select("day_number")
    .order("day_number", { ascending: false })
    .limit(1)
    .single();

  let nextDayNumber = (maxDayRow?.day_number ?? 0) + 1;

  // 5. Load current max match_number to continue the sequence.
  const { data: maxMatchRow } = await supabase
    .from("matches")
    .select("match_number")
    .order("match_number", { ascending: false })
    .limit(1)
    .single();

  let matchNumberCounter = (maxMatchRow?.match_number ?? 0) + 1;

  // 6. Group by date and upsert.
  const fixturesByDate = new Map<string, typeof fixtures>();
  for (const f of fixtures) {
    const date = toDateInCDMX(f.fixture.date);
    if (!fixturesByDate.has(date)) fixturesByDate.set(date, []);
    fixturesByDate.get(date)!.push(f);
  }

  for (const date of [...fixturesByDate.keys()].sort()) {
    const dayFixtures = fixturesByDate.get(date)!;
    dayFixtures.sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    const lastKickoff = dayFixtures[dayFixtures.length - 1]!.fixture.date;
    const pickWindowOpensAt = midnightCDMX(date);
    const pickWindowClosesAt = toPickDeadline(lastKickoff);

    // Check if match_day already exists for this date.
    const { data: existing } = await supabase
      .from("match_days")
      .select("id, day_number")
      .eq("match_date", date)
      .single();

    let matchDayId: number;
    let dayNumber: number;

    if (existing) {
      // Update pick window in case kickoff times changed.
      matchDayId = existing.id;
      dayNumber = existing.day_number;
      await supabase
        .from("match_days")
        .update({ pick_window_opens_at: pickWindowOpensAt, pick_window_closes_at: pickWindowClosesAt })
        .eq("id", matchDayId);
      console.log(`  Day ${dayNumber} (${date}): already exists, updating pick window.`);
    } else {
      // Insert new match_day.
      dayNumber = nextDayNumber++;
      const { data: newDay, error: insertError } = await supabase
        .from("match_days")
        .insert({
          match_date: date,
          day_number: dayNumber,
          pick_window_opens_at: pickWindowOpensAt,
          pick_window_closes_at: pickWindowClosesAt,
          is_processed: false,
        })
        .select("id")
        .single();

      if (insertError || !newDay) {
        console.error(`  Error inserting match_day for ${date}:`, insertError?.message);
        continue;
      }
      matchDayId = newDay.id;
      console.log(`  Day ${dayNumber} (${date}): created.`);
    }

    // Upsert matches for this day.
    const matchRows = dayFixtures.map((f) => {
      const homeTeamId = teamIdByApiId.get(String(f.teams.home.id)) ?? null;
      const awayTeamId = teamIdByApiId.get(String(f.teams.away.id)) ?? null;

      if (!homeTeamId || !awayTeamId) {
        console.warn(
          `  Warning: team not found for fixture ${f.fixture.id}` +
          ` (home: ${f.teams.home.id}, away: ${f.teams.away.id})`
        );
      }

      return {
        match_day_id: matchDayId,
        match_number: matchNumberCounter++,
        stage: "group" as const,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        kickoff_time: f.fixture.date,
        pick_deadline: toPickDeadline(f.fixture.date),
        venue: f.fixture.venue.name ?? null,
        status: mapFixtureStatus(f.fixture.status.short),
        home_score: f.goals.home ?? null,
        away_score: f.goals.away ?? null,
        went_to_extra_time: f.score.extratime.home !== null,
        went_to_penalties: f.score.penalty.home !== null,
        api_external_id: String(f.fixture.id),
      };
    });

    const { error: matchesError } = await supabase
      .from("matches")
      .upsert(matchRows, { onConflict: "api_external_id" });

    if (matchesError) {
      console.error(`  Error upserting matches for ${date}:`, matchesError.message);
    } else {
      console.log(`  ✓ ${matchRows.length} matches upserted for ${date}.`);
      for (const f of dayFixtures) {
        console.log(`    - ${f.teams.home.name} vs ${f.teams.away.name} (${f.fixture.date})`);
      }
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
