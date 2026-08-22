import Link from "next/link";
import Header from "@/components/Header";
import LiveBadge from "@/components/LiveBadge";
import Hero from "@/components/Hero";
import ClaimForm from "@/components/ClaimForm";
import LeaderboardRow from "@/components/Leaderboard/LeaderboardRow";
import { MIN_BID_USD, nextTopBidUsd } from "@/lib/bidding";
import { getLeaderboard } from "@/lib/leaderboard";
import { getSiteStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; bid?: string }>;
}) {
  const [stats, params, entries] = await Promise.all([
    getSiteStats(),
    searchParams,
    getLeaderboard(),
  ]);
  const bidToTakeTopUsd = nextTopBidUsd(entries[0]?.amount_usd);
  const requestedBidUsd = Number(params.bid);
  const prefilledBidUsd =
    Number.isFinite(requestedBidUsd) && requestedBidUsd >= MIN_BID_USD
      ? Math.ceil(requestedBidUsd)
      : bidToTakeTopUsd;

  return (
    <main className="pb-24">
      <Header />
      <LiveBadge initialVisitorCount={stats.visitorCount} />
      <div className="mt-14">
        <Hero bidToTakeTopUsd={bidToTakeTopUsd} />
        <ClaimForm
          prefillLink={params.link ?? ""}
          floorUsd={prefilledBidUsd}
        />
      </div>

      <section aria-labelledby="home-leaderboard-heading" className="mx-auto mt-16 max-w-3xl px-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-green">Live board</p>
            <h2 id="home-leaderboard-heading" className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
              Current rankings
            </h2>
          </div>
          <Link href="/leaderboard" className="shrink-0 text-sm font-semibold text-blue hover:text-blue-deep">
            View all →
          </Link>
        </div>

        {entries.length === 0 ? (
          <p className="glass rounded-2xl p-8 text-center text-ink-soft">
            No paid bids yet — be the first to claim #1.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <LeaderboardRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
