import Header from "@/components/Header";
import LiveStatsClient from "@/components/LiveStatsClient";
import { getSiteStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function LiveStatsPage() {
  const stats = await getSiteStats();

  return (
    <main className="pb-24">
      <Header />
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="mb-8 text-3xl font-extrabold text-ink">Live stats</h1>
        <LiveStatsClient initialStats={stats} />
        <p className="mt-8 text-sm text-ink-faint">
          Numbers refresh every 5 seconds from confirmed on-chain payments only —
          pending bids don&apos;t count until the deposit clears.
        </p>
      </div>
    </main>
  );
}
