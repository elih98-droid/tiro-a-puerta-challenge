import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. User picks — resultado final
  const { data: picks, error: picksErr } = await supabase
    .from("user_picks")
    .select(`
      id,
      is_locked,
      result,
      shots_on_target_count,
      goals_scored,
      processed_at,
      users ( username ),
      players ( display_name, position ),
      match_days ( match_date )
    `)
    .order("created_at", { ascending: false })
    .limit(10);
  console.log("USER PICKS:", JSON.stringify(picks, null, 2));
  if (picksErr) console.error("PICKS ERROR:", picksErr.message);

  // 2. User status — supervivencia
  const { data: statuses, error: statusErr } = await supabase
    .from("user_status")
    .select(`
      is_alive,
      elimination_reason,
      eliminated_on_match_day_id,
      days_survived,
      total_goals_accumulated,
      users ( username )
    `);
  console.log("USER STATUS:", JSON.stringify(statuses, null, 2));
  if (statusErr) console.error("STATUS ERROR:", statusErr.message);

  // 3. Match day — procesado?
  const { data: matchDay, error: dayErr } = await supabase
    .from("match_days")
    .select("id, match_date, is_processed")
    .eq("day_number", 1)
    .single();
  console.log("MATCH DAY 1:", JSON.stringify(matchDay, null, 2));
  if (dayErr) console.error("MATCH DAY ERROR:", dayErr.message);
}

main();
