/**
 * scripts/seed-wc-teams.ts
 *
 * Seeds the `teams` table with the 48 World Cup 2026 teams.
 * Uses API-Football /teams endpoint (league 1, season 2026).
 *
 * Run with:
 *   npx tsx scripts/seed-wc-teams.ts
 *
 * Notes:
 * - Uses upsert (ON CONFLICT on code) so it's safe to run multiple times.
 * - group_letter is set to '?' initially — updated from standings endpoint.
 * - Requires API_FOOTBALL_KEY and Supabase env vars in .env.local.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getTeams } from "../lib/api-football/client";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WORLD_CUP_LEAGUE_ID = 1;
const SEASON = 2026;

async function main() {
  // 1. Fetch teams
  console.log("Fetching World Cup 2026 teams from API-Football...");
  const apiTeams = await getTeams(WORLD_CUP_LEAGUE_ID, SEASON);
  console.log(`Found ${apiTeams.length} teams.`);

  if (apiTeams.length === 0) {
    console.error("No teams returned — check league/season IDs.");
    process.exit(1);
  }

  // 2. Try to get group assignments from standings
  console.log("Fetching standings to get group assignments...");
  const groupMap = new Map<number, string>(); // team API ID → group letter

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/standings?league=${WORLD_CUP_LEAGUE_ID}&season=${SEASON}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY! } }
    );
    const data = await res.json();

    // standings response: array of league objects, each with standings array
    // Each standings entry is a group (array of team rows)
    const leagueData = data.response?.[0]?.league;
    if (leagueData?.standings) {
      for (const group of leagueData.standings) {
        if (group.length > 0) {
          // Extract group letter from group name like "Group A"
          const groupName = group[0]?.group ?? "";
          const letter = groupName.replace(/^Group\s*/i, "").charAt(0);
          for (const entry of group) {
            groupMap.set(entry.team.id, letter || "?");
          }
        }
      }
      console.log(`Got group assignments for ${groupMap.size} teams.`);
    } else {
      console.log("Standings not available yet — using '?' as placeholder.");
    }
  } catch (err) {
    console.log("Could not fetch standings — using '?' as placeholder.");
  }

  // 3. Build rows — fix duplicate codes from API-Football
  //    API returns "AUS" for both Australia and Austria, "IRA" for Iran and Iraq.
  //    We use official FIFA codes instead.
  const CODE_FIXES: Record<number, string> = {
    775: "AUT",   // Austria (API returns "AUS", conflicts with Australia)
    1567: "IRQ",  // Iraq (API returns "IRA", conflicts with Iran)
    22: "IRN",    // Iran — use FIFA standard code
    5530: "CUW",  // Curaçao (API returns null)
  };

  const rows = apiTeams.map((t) => ({
    name: t.team.name,
    code: CODE_FIXES[t.team.id] ?? t.team.code,
    group_letter: groupMap.get(t.team.id) || "?",
    flag_url: t.team.logo,
    api_external_id: String(t.team.id),
  }));

  // 4. Upsert into Supabase (use api_external_id as conflict key)
  console.log("Upserting teams into Supabase...");

  const { data, error } = await supabase
    .from("teams")
    .upsert(rows, {
      onConflict: "code",
      ignoreDuplicates: false,
    })
    .select("id, name, code, group_letter");

  if (error) {
    console.error("Error inserting teams:", error.message);
    process.exit(1);
  }

  console.log(`\nDone! ${data?.length} teams seeded:\n`);

  // Print grouped by group letter
  const byGroup = new Map<string, typeof data>();
  for (const team of data ?? []) {
    const g = team.group_letter;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(team);
  }

  for (const [group, teams] of [...byGroup.entries()].sort()) {
    console.log(`  Group ${group}:`);
    for (const t of teams) {
      console.log(`    [${t.id}] ${t.name} (${t.code})`);
    }
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
