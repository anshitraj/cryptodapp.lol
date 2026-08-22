import { supabaseAdmin } from "@/lib/supabase/server";
import { hoursSince } from "@/lib/format";

export type SiteStats = {
  totalRaisedUsd: number;
  hoursSinceLaunch: number;
  visitorCount: number;
  listingCount: number;
  paidBidCount: number;
  totalClicks: number;
};

const FALLBACK_STATS: SiteStats = {
  totalRaisedUsd: 0,
  hoursSinceLaunch: 0,
  visitorCount: 0,
  listingCount: 0,
  paidBidCount: 0,
  totalClicks: 0,
};

// Backed by Supabase, an external dependency — degrade to zeroed stats
// instead of 500ing the whole page if it's unreachable or misconfigured.
export async function getSiteStats(): Promise<SiteStats> {
  try {
    const db = supabaseAdmin();

    const [
      { data: meta },
      { data: paidBids },
      { count: visitorCount },
      { count: listingCount },
      { count: paidBidCount },
      { data: listings },
    ] = await Promise.all([
      db.from("site_meta").select("value").eq("key", "launched_at").maybeSingle(),
      db.from("bids").select("amount_usd").eq("status", "paid"),
      db.from("page_visits").select("id", { count: "exact", head: true }),
      db.from("listings").select("id", { count: "exact", head: true }),
      db.from("bids").select("id", { count: "exact", head: true }).eq("status", "paid"),
      db.from("listings").select("clicks"),
    ]);

    const totalRaisedUsd = (paidBids ?? []).reduce(
      (sum, b) => sum + Number(b.amount_usd ?? 0),
      0
    );
    const totalClicks = (listings ?? []).reduce((sum, l) => sum + Number(l.clicks ?? 0), 0);

    const launchedAt = meta?.value ?? new Date().toISOString();

    return {
      totalRaisedUsd,
      hoursSinceLaunch: Math.floor(hoursSince(launchedAt)),
      visitorCount: visitorCount ?? 0,
      listingCount: listingCount ?? 0,
      paidBidCount: paidBidCount ?? 0,
      totalClicks,
    };
  } catch (err) {
    console.error("[getSiteStats] falling back to zeroed stats:", err);
    return FALLBACK_STATS;
  }
}
