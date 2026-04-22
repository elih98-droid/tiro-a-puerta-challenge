/**
 * scripts/insert-test-picks.ts
 *
 * Inserts test picks for Day 1 (2026-04-22) for all users in the DB.
 * Used to verify the full game loop before the UI of picks is built.
 *
 * Run with:
 *   npx tsx scripts/insert-test-picks.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Get Day 1 match_day
  const { data: matchDay, error: dayError } = await supabase
    .from("match_days")
    .select("id, match_date")
    .eq("day_number", 1)
    .single();

  if (dayError || !matchDay) {
    console.error("Could not find day 1:", dayError?.message);
    process.exit(1);
  }
  console.log(`Day 1: ${matchDay.match_date} (id: ${matchDay.id})`);

  // 2. Get matches for Day 1 with team names
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, kickoff_time, pick_deadline, home_team_id, away_team_id, api_external_id")
    .eq("match_day_id", matchDay.id);

  if (matchesError || !matches?.length) {
    console.error("No matches found for day 1:", matchesError?.message);
    process.exit(1);
  }

  console.log(`\nMatches on day 1:`);
  matches.forEach((m) =>
    console.log(
      `  [${m.id}] home_team: ${m.home_team_id} vs away_team: ${m.away_team_id} — kickoff: ${m.kickoff_time}`
    )
  );

  // 3. Get all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, username");

  if (usersError || !users?.length) {
    console.error("No users found:", usersError?.message);
    process.exit(1);
  }

  // 4. Insert specific picks for each user.
  //
  // elias_test → E. Haaland (Man City FWD) en Burnley vs Man City
  //   Alta probabilidad de tiro a puerta → esperamos que sobreviva.
  //
  // El_Conde → Đ. Petrović (Bournemouth GK) en Bournemouth vs Leeds
  //   Portero = bajísima probabilidad de tiro a puerta → esperamos que sea eliminado.

  const picks = [
    {
      username: "elias_test",
      playerId: 396,   // E. Haaland — Man City FWD
      matchIndex: 1,   // Burnley vs Man City (away)
    },
    {
      username: "El_Conde",
      playerId: 65,    // Đ. Petrović — Bournemouth GK
      matchIndex: 0,   // Bournemouth vs Leeds (home)
    },
  ];

  for (const pick of picks) {
    const user = users.find((u) => u.username === pick.username);
    const match = matches[pick.matchIndex];

    if (!user) { console.error(`User ${pick.username} not found.`); continue; }
    if (!match) { console.error(`Match index ${pick.matchIndex} not found.`); continue; }

    const { data: player } = await supabase
      .from("players")
      .select("id, display_name, position")
      .eq("id", pick.playerId)
      .single();

    if (!player) { console.error(`Player id ${pick.playerId} not found.`); continue; }

    console.log(
      `\nInserting pick for ${user.username}: ${player.display_name} ` +
      `(${player.position}) in match ${match.id}`
    );

    const { error: pickError } = await supabase.from("user_picks").upsert(
      {
        user_id: user.id,
        match_day_id: matchDay.id,
        player_id: player.id,
        match_id: match.id,
        effective_deadline: match.pick_deadline,
        is_locked: false,
        result: null,
      },
      { onConflict: "user_id,match_day_id" }
    );

    if (pickError) {
      console.error(`  Error:`, pickError.message);
    } else {
      console.log(`  ✓ Pick insertado.`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
