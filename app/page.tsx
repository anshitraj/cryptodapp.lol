import Header from "@/components/Header";
import LiveBadge from "@/components/LiveBadge";
import Hero from "@/components/Hero";
import ClaimForm from "@/components/ClaimForm";
import { getSiteStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; floor?: string }>;
}) {
  const [stats, params] = await Promise.all([getSiteStats(), searchParams]);

  return (
    <main className="pb-24">
      <Header />
      <LiveBadge initialVisitorCount={stats.visitorCount} />
      <div className="mt-14">
        <Hero />
        <ClaimForm
          prefillLink={params.link ?? ""}
          floorUsd={params.floor ? Number(params.floor) : undefined}
        />
      </div>
    </main>
  );
}
