"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/format";
import type { SiteStats } from "@/lib/stats";

const POLL_MS = 5000;

export default function LiveStatsClient({ initialStats }: { initialStats: SiteStats }) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const timer = setInterval(() => {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data: SiteStats) => setStats(data))
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const cards = [
    { label: "Total raised", value: formatUsd(stats.totalRaisedUsd) },
    { label: "Hours live", value: `${stats.hoursSinceLaunch}h` },
    { label: "Visitors so far", value: stats.visitorCount.toLocaleString() },
    { label: "Dapps listed", value: stats.listingCount.toLocaleString() },
    { label: "Paid bids", value: stats.paidBidCount.toLocaleString() },
    { label: "Total clicks", value: stats.totalClicks.toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="glass rounded-2xl p-6">
          <p className="text-sm text-ink-soft">{card.label}</p>
          <p className="mt-2 text-3xl font-extrabold text-ink tabular-nums">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
