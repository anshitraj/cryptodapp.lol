import Header from "@/components/Header";
import { getSiteStats } from "@/lib/stats";
import { formatUsd } from "@/lib/format";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function fetchCounts(): Promise<{ listingCount: number; paidBidCount: number; totalClicks: number }> {
  try {
    const db = supabaseAdmin();
    const [{ count: listingCount }, { count: paidBidCount }, { data: listings }] = await Promise.all([
      db.from("listings").select("id", { count: "exact", head: true }),
      db.from("bids").select("id", { count: "exact", head: true }).eq("status", "paid"),
      db.from("listings").select("clicks"),
    ]);
    const totalClicks = (listings ?? []).reduce((sum, l) => sum + Number(l.clicks ?? 0), 0);
    return { listingCount: listingCount ?? 0, paidBidCount: paidBidCount ?? 0, totalClicks };
  } catch (err) {
    console.error("[live-stats] falling back to zeroed counts:", err);
    return { listingCount: 0, paidBidCount: 0, totalClicks: 0 };
  }
}

export default async function LiveStatsPage() {
  const [stats, { listingCount, paidBidCount, totalClicks }] = await Promise.all([
    getSiteStats(),
    fetchCounts(),
  ]);

  const cards = [
    { label: "Total raised", value: formatUsd(stats.totalRaisedUsd) },
    { label: "Hours live", value: `${stats.hoursSinceLaunch}h` },
    { label: "Visitors so far", value: stats.visitorCount.toLocaleString() },
    { label: "Dapps listed", value: listingCount.toLocaleString() },
    { label: "Paid bids", value: paidBidCount.toLocaleString() },
    { label: "Total clicks", value: totalClicks.toLocaleString() },
  ];

  return (
    <main className="pb-24">
      <Header />
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="mb-8 text-3xl font-extrabold text-ink">Live stats</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="glass rounded-2xl p-6">
              <p className="text-sm text-ink-soft">{card.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-ink">{card.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink-faint">
          Numbers refresh every few seconds from confirmed on-chain payments only —
          pending bids don&apos;t count until the deposit clears.
        </p>
      </div>
    </main>
  );
}
