import { supabaseAdmin } from "@/lib/supabase/server";

export type LeaderboardEntry = {
  id: string;
  name: string;
  description: string;
  link: string;
  icon_url: string | null;
  clicks: number;
  amount_usd: number;
  paid_at: string;
  rank: number;
};

// One source of truth for every place we show paid listings. The SQL view
// already picks each listing's best paid bid and assigns its current rank.
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db.from("leaderboard").select("*");

    if (error) throw error;
    return (data ?? []) as LeaderboardEntry[];
  } catch (err) {
    console.error("[leaderboard] falling back to empty list:", err);
    return [];
  }
}
