/**
 * scripts/seed-pl-players.ts
 *
 * Seeds the `players` table with the squads of all 20 Premier League teams.
 * Depends on `teams` already being seeded (run seed-pl-teams.ts first).
 *
 * Run with:
 *   npx tsx scripts/seed-pl-players.ts
 *
 * Notes:
 * - Fetches all teams from DB (filtered by group_letter = 'X', our PL marker),
 *   then calls /players/squads for each team.
 * - Uses upsert so it's safe to run multiple times.
 * - Full name and display name are the same from the squads endpoint
 *   (API doesn't provide separate full/display names in this endpoint).
 * - Adds a 200ms delay between team requests to be kind to the API rate limit.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getSquad, mapSquadPosition } from "../lib/api-football/client";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch all PL teams from DB to get their internal IDs and external API IDs.
  console.log("Loading Premier League teams from DB...");
  const { data: dbTeams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, api_external_id")
    .eq("group_letter", "X"); // 'X' is our placeholder for PL teams

  if (teamsError) {
    console.error("Error loading teams:", teamsError.message);
    process.exit(1);
  }

  if (!dbTeams || dbTeams.length === 0) {
    console.error("No teams found in DB. Run seed-pl-teams.ts first.");
    process.exit(1);
  }

  console.log(`Found ${dbTeams.length} teams. Fetching squads...\n`);

  let totalPlayers = 0;

  // 2. For each team, fetch the squad from the API and upsert players.
  for (const team of dbTeams) {
    const apiTeamId = Number(team.api_external_id);
    console.log(`Fetching squad for ${team.name} (API ID: ${apiTeamId})...`);

    const squad = await getSquad(apiTeamId);

    if (!squad) {
      console.warn(`  No squad data returned for ${team.name}. Skipping.`);
      continue;
    }

    const rows = squad.players.map((p) => ({
      team_id: team.id,
      full_name: p.name,
      display_name: p.name,
      position: mapSquadPosition(p.position),
      jersey_number: p.number ?? null,
      photo_url: p.photo,
      api_external_id: String(p.id),
      is_active: true,
    }));

    const { error: upsertError } = await supabase
      .from("players")
      .upsert(rows, {
        onConflict: "api_external_id",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error(`  Error upserting players for ${team.name}:`, upsertError.message);
    } else {
      console.log(`  ✓ ${rows.length} players upserted for ${team.name}.`);
      totalPlayers += rows.length;
    }

    // Small delay to avoid hammering the API (7,500 req/day limit).
    await sleep(200);
  }

  console.log(`\nDone! ${totalPlayers} players seeded across ${dbTeams.length} teams.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
