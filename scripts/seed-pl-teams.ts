/**
 * scripts/seed-pl-teams.ts
 *
 * Seeds the `teams` table with the 20 Premier League teams (2024/25 season).
 * Uses API-Football /teams endpoint (league 39, season 2024).
 *
 * Run with:
 *   npx tsx scripts/seed-pl-teams.ts
 *
 * Notes:
 * - Uses upsert (ON CONFLICT DO UPDATE) so it's safe to run multiple times.
 * - `group_letter` is set to 'X' as a placeholder — this field is used for
 *   World Cup groups; PL teams don't have one.
 * - Requires API_FOOTBALL_KEY and Supabase env vars in .env.local.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getTeams } from "../lib/api-football/client";

// Load .env.local into process.env (Next.js does this automatically at runtime,
// but standalone scripts need to do it manually).
config({ path: ".env.local" });

// ─── Supabase admin client ────────────────────────────────────────────────────
// We use the service role key to bypass RLS — this script runs server-side only.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Constants ────────────────────────────────────────────────────────────────

const PREMIER_LEAGUE_ID = 39;
const SEASON = 2025; // 2025/26 season

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching Premier League teams from API-Football...");
  const apiTeams = await getTeams(PREMIER_LEAGUE_ID, SEASON);
  console.log(`Found ${apiTeams.length} teams.`);

  const rows = apiTeams.map((t) => ({
    name: t.team.name,
    code: t.team.code,
    // PL teams don't have a World Cup group. 'X' is a safe placeholder.
    group_letter: "X",
    flag_url: t.team.logo,
    api_external_id: String(t.team.id),
  }));

  console.log("Upserting teams into Supabase...");

  const { data, error } = await supabase
    .from("teams")
    .upsert(rows, {
      // `code` is the unique constraint on teams (api_external_id has no unique index).
      onConflict: "code",
      ignoreDuplicates: false,
    })
    .select("id, name, code");

  if (error) {
    console.error("Error inserting teams:", error.message);
    process.exit(1);
  }

  console.log(`\nDone! ${data?.length} teams seeded:\n`);
  data?.forEach((team) => console.log(`  [${team.id}] ${team.name} (${team.code})`));
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
