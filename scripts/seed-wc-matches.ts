/**
 * scripts/seed-wc-matches.ts
 *
 * Seeds `match_days` and `matches` with the World Cup 2026 group stage fixtures.
 * Depends on `teams` already being seeded (run seed-wc-teams.ts first).
 *
 * Run with:
 *   npx tsx scripts/seed-wc-matches.ts
 *
 * Logic:
 * 1. Fetch all World Cup 2026 fixtures from API-Football (league 1, season 2026).
 * 2. Group fixtures by date (in America/Mexico_City timezone).
 * 3. For each unique date, upsert a `match_day` row.
 * 4. For each fixture, upsert a `matches` row linked to its match_day.
 *
 * Notes:
 * - Safe to run multiple times (upsert on match_date and api_external_id).
 * - Does NOT delete existing data — only inserts/updates.
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

const WORLD_CUP_LEAGUE_ID = 1;
const SEASON = 2026;
const CDMX_TIMEZONE = "America/Mexico_City";
const PICK_DEADLINE_BUFFER_MINUTES = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateInCDMX(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString("en-CA", {
    timeZone: CDMX_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Midnight CDMX = 06:00 UTC (Mexico is permanently UTC-6, no DST)
function midnightCDMX(dateStr: string): string {
  return `${dateStr}T06:00:00.000Z`;
}

function toPickDeadline(kickoffUtc: string): string {
  const ms = new Date(kickoffUtc).getTime();
  return new Date(ms - PICK_DEADLINE_BUFFER_MINUTES * 60 * 1000).toISOString();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch all World Cup 2026 fixtures
  console.log("Fetching World Cup 2026 fixtures from API-Football...");
  const allFixtures = await getFixtures(WORLD_CUP_LEAGUE_ID, SEASON);
  console.log(`Fetched ${allFixtures.length} total fixtures.`);

  if (allFixtures.length === 0) {
    console.error("No fixtures returned — check league/season IDs.");
    process.exit(1);
  }

  // 2. Load teams from DB to map API external IDs to internal DB IDs
  const { data: dbTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, api_external_id");

  if (teamsError) {
    console.error("Error loading teams:", teamsError.message);
    process.exit(1);
  }

  const teamIdByApiId = new Map<string, number>(
    (dbTeams ?? []).map((t) => [t.api_external_id, t.id])
  );

  // 3. Group fixtures by CDMX date
  const fixturesByDate = new Map<string, ApiFixture[]>();

  for (const fixture of allFixtures) {
    const date = toDateInCDMX(fixture.fixture.date);
    if (!fixturesByDate.has(date)) {
      fixturesByDate.set(date, []);
    }
    fixturesByDate.get(date)!.push(fixture);
  }

  const sortedDates = [...fixturesByDate.keys()].sort();
  console.log(`\nFound ${sortedDates.length} match days.\n`);

  // 4. Upsert match_days, then matches
  let matchDayNumber = 1;
  let totalMatchesSeeded = 0;
  let matchNumberCounter = 1;

  for (const date of sortedDates) {
    const dayFixtures = fixturesByDate.get(date)!;

    // Sort by kickoff time
    dayFixtures.sort(
      (a, b) =>
        new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime()
    );

    const lastKickoff = dayFixtures[dayFixtures.length - 1]!.fixture.date;
    const pickWindowOpensAt = midnightCDMX(date);
    const pickWindowClosesAt = toPickDeadline(lastKickoff);

    // 4a. Upsert match_day
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

    // 4b. Upsert matches for this day
    const matchRows = dayFixtures.map((f) => {
      const homeTeamId = teamIdByApiId.get(String(f.teams.home.id)) ?? null;
      const awayTeamId = teamIdByApiId.get(String(f.teams.away.id)) ?? null;

      if (!homeTeamId || !awayTeamId) {
        console.warn(
          `  ⚠ Team not found for fixture ${f.fixture.id}` +
          ` (${f.teams.home.name} vs ${f.teams.away.name}).` +
          ` Run seed-wc-teams.ts first.`
        );
      }

      const currentCounter = matchNumberCounter++;

      return {
        match_day_id: matchDayRow.id,
        match_number: currentCounter,
        stage: "group" as const,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        kickoff_time: f.fixture.date,
        pick_deadline: toPickDeadline(f.fixture.date),
        venue: f.fixture.venue?.name ?? null,
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
      // Show matches for this day
      const timeRange = dayFixtures.map(f => {
        const h = new Date(f.fixture.date).toLocaleTimeString("es-MX", {
          timeZone: CDMX_TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false,
        });
        return h;
      });
      console.log(
        `  ✓ Día ${matchDayRow.day_number} (${date}): ${matchRows.length} partido${matchRows.length > 1 ? 's' : ''} [${timeRange[0]}–${timeRange[timeRange.length - 1]} CDMX]`
      );
      for (const f of dayFixtures) {
        const time = new Date(f.fixture.date).toLocaleTimeString("es-MX", {
          timeZone: CDMX_TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false,
        });
        console.log(`      ${time} ${f.teams.home.name} vs ${f.teams.away.name} (${f.league.round})`);
      }
      totalMatchesSeeded += matchRows.length;
    }
  }

  console.log(
    `\n✅ Done! ${sortedDates.length} match days and ${totalMatchesSeeded} matches seeded.`
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
