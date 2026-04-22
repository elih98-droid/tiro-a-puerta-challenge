import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Check live/in-play matches
  const { data: liveMatches, error: liveErr } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, status, match_day_id, api_external_id")
    .in("status", ["live", "scheduled", "finished"]);
  console.log("MATCHES (live/scheduled/finished):", JSON.stringify(liveMatches, null, 2));
  if (liveErr) console.error("MATCHES ERROR:", liveErr.message);

  // 2. Check player_match_stats for our two test picks: Haaland and Petrović
  const { data: stats, error: statsErr } = await supabase
    .from("player_match_stats")
    .select(`
      id,
      shots_on_target,
      goals,
      minutes_played,
      is_final,
      last_api_sync_at,
      players ( display_name, position ),
      matches ( status, api_external_id )
    `)
    .ilike("players.display_name", "%Haaland%")
    .order("last_api_sync_at", { ascending: false });

  // Also fetch Petrović separately
  const { data: petrovicStats, error: petrovicErr } = await supabase
    .from("player_match_stats")
    .select(`
      id,
      shots_on_target,
      goals,
      minutes_played,
      is_final,
      last_api_sync_at,
      players ( display_name, position ),
      matches ( status, api_external_id )
    `)
    .ilike("players.display_name", "%Petrov%")
    .order("last_api_sync_at", { ascending: false });

  console.log("HAALAND STATS:", JSON.stringify(stats, null, 2));
  if (statsErr) console.error("HAALAND STATS ERROR:", statsErr.message);
  console.log("PETROVIĆ STATS:", JSON.stringify(petrovicStats, null, 2));
  if (petrovicErr) console.error("PETROVIĆ STATS ERROR:", petrovicErr.message);

  // 3. Check user_picks for today
  const { data: picks, error: picksErr } = await supabase
    .from("user_picks")
    .select(`
      id,
      is_locked,
      result,
      users ( username ),
      players ( display_name ),
      match_days ( match_date )
    `)
    .order("created_at", { ascending: false })
    .limit(10);
  console.log("USER PICKS:", JSON.stringify(picks, null, 2));
  if (picksErr) console.error("PICKS ERROR:", picksErr.message);
}

main();
