/**
 * scripts/seed-pl-matches.ts
 *
 * Seeds `match_days` and `matches` with the Premier League 2025/26 fixture.
 * Depends on `teams` already being seeded (run seed-pl-teams.ts first).
 *
 * Run with:
 *   npx tsx scripts/seed-pl-matches.ts
 *
 * Logic:
 * 1. Fetch all PL 2025/26 fixtures from API-Football (league 39, season 2025).
 * 2. Group fixtures by date (in America/Mexico_City timezone).
 * 3. For each unique date, upsert a `match_day` row:
 *    - pick_window_opens_at = midnight CDMX of that date
 *    - pick_window_closes_at = 5 min before the LAST kickoff of the day
 *    - day_number = sequential, ordered by date
 * 4. For each fixture, upsert a `matches` row linked to its match_day.
 *
 * Notes:
 * - Safe to run multiple times (upsert on api_external_id).
 * - PL matches don't have a global match number, so we generate sequential ones.
 * - All stages are set to 'group' (closest fit for a league regular season).
 * - Timestamps are stored in UTC (Supabase/Postgres TIMESTAMPTZ standard).
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getFixtures, mapFixtureStatus } from "../lib/api-football/client";
import type { ApiFixture } from "../lib/api-football/types";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Constants ────────────────────────────────────────────────────────────────

const PREMIER_LEAGUE_ID = 39;
const SEASON = 2025; // 2025/26 season
// Mexico eliminated DST in 2023 — CDMX is permanently UTC-6.
const CDMX_TIMEZONE = "America/Mexico_City";
const PICK_DEADLINE_BUFFER_MINUTES = 5;

// Only seed match days on or after this date (CDMX). Used to define the
// start of the test competition window (Premier League tail end + final day).
const COMPETITION_START_DATE = "2026-04-22";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the date string (YYYY-MM-DD) of a UTC timestamp,
 * as seen from the CDMX timezone.
 * This determines which "day of pick" a match belongs to.
 */
function toDateInCDMX(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("en-CA", {
    timeZone: CDMX_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Returns midnight CDMX (start of day) for a given YYYY-MM-DD date,
 * as a UTC ISO string.
 *
 * Mexico eliminated DST in 2023. CDMX is permanently UTC-6.
 * Midnight CDMX = 06:00 UTC.
 */
function midnightCDMX(dateStr: string): string {
  return `${dateStr}T06:00:00.000Z`;
}

/**
 * Subtracts PICK_DEADLINE_BUFFER_MINUTES from a UTC ISO timestamp.
 * Returns the result as a UTC ISO string.
 */
function toPickDeadline(kickoffUtc: string): string {
  const ms = new Date(kickoffUtc).getTime();
  return new Date(ms - PICK_DEADLINE_BUFFER_MINUTES * 60 * 1000).toISOString();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch all PL 2025/26 fixtures.
  console.log("Fetching Premier League 2025/26 fixtures from API-Football...");
  const allFixtures = await getFixtures(PREMIER_LEAGUE_ID, SEASON);
  console.log(`Fetched ${allFixtures.length} total fixtures.`);

  // Filter to only include fixtures on or after the competition start date.
  const fixtures = allFixtures.filter(
    (f) => toDateInCDMX(f.fixture.date) >= COMPETITION_START_DATE
  );
  console.log(
    `Keeping ${fixtures.length} fixtures from ${COMPETITION_START_DATE} onwards.`
  );

  // 1b. Clear existing data before re-seeding.
  // Order matters — delete child tables first to avoid FK violations:
  // user_picks → player_match_stats → matches → match_days
  console.log("Clearing existing data...");

  for (const table of ["pick_history", "user_picks", "player_match_stats", "matches", "match_days"] as const) {
    const { error } = await supabase.from(table).delete().neq("id", 0);
    if (error) {
      console.error(`Error deleting ${table}:`, error.message);
      process.exit(1);
    }
  }
  console.log("Cleared.");

  // 2. Load PL teams from DB to map external API IDs to internal DB IDs.
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

  // 3. Group fixtures by CDMX date.
  const fixturesByDate = new Map<string, ApiFixture[]>();

  for (const fixture of fixtures) {
    const date = toDateInCDMX(fixture.fixture.date);
    if (!fixturesByDate.has(date)) {
      fixturesByDate.set(date, []);
    }
    fixturesByDate.get(date)!.push(fixture);
  }

  // Sort dates chronologically.
  const sortedDates = [...fixturesByDate.keys()].sort();
  console.log(`\nFound ${sortedDates.length} match days.`);

  // 4. Upsert match_days, then matches.
  // day_number and match_number always start at 1 (fresh seed after cleanup).
  let matchDayNumber = 1;
  let totalMatchesSeeded = 0;
  let matchNumberCounter = 1;

  for (const date of sortedDates) {
    const dayFixtures = fixturesByDate.get(date)!;

    // Sort by kickoff time to find first and last match of the day.
    dayFixtures.sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    const lastKickoff = dayFixtures[dayFixtures.length - 1]!.fixture.date;
    const pickWindowOpensAt = midnightCDMX(date);
    const pickWindowClosesAt = toPickDeadline(lastKickoff);

    // 4a. Upsert match_day.
    const { data: matchDayRow, error: matchDayError } = await supabase
      .from("match_days")
      .upsert(
        {
          match_date: date,
          day_number: matchDayNumber,
          pick_window_opens_at: pickWindowOpensAt,
          pick_window_closes_at: pickWindowClosesAt,
          is_processed: false,
        },
        { onConflict: "match_date" }
      )
      .select("id, match_date, day_number")
      .single();

    if (matchDayError) {
      console.error(`Error upserting match_day for ${date}:`, matchDayError.message);
      continue;
    }

    matchDayNumber++;

    // 4b. Upsert matches for this day.
    const matchRows = dayFixtures.map((f) => {
      const homeTeamId = teamIdByApiId.get(String(f.teams.home.id)) ?? null;
      const awayTeamId = teamIdByApiId.get(String(f.teams.away.id)) ?? null;

      if (!homeTeamId || !awayTeamId) {
        console.warn(
          `  Warning: team not found in DB for fixture ${f.fixture.id}` +
          ` (home API ID: ${f.teams.home.id}, away API ID: ${f.teams.away.id}).` +
          ` Run seed-pl-teams.ts first.`
        );
      }

      const currentCounter = matchNumberCounter++;

      return {
        match_day_id: matchDayRow.id,
        match_number: currentCounter,
        // Premier League regular season = 'group' (closest match for our schema)
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
      console.error(
        `  Error upserting matches for ${date}:`,
        matchesError.message
      );
    } else {
      console.log(
        `  ✓ Day ${matchDayRow.day_number} (${date}): ${matchRows.length} matches.`
      );
      totalMatchesSeeded += matchRows.length;
    }
  }

  console.log(
    `\nDone! ${sortedDates.length} match days and ${totalMatchesSeeded} matches seeded.`
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
