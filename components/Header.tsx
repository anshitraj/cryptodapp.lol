import Link from "next/link";
import WordMark from "./WordMark";
import { getSiteStats } from "@/lib/stats";
import { formatUsd } from "@/lib/format";

const NAV = [
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/live-stats", label: "Live stats" },
  { href: "/about", label: "About" },
  { href: "/rules", label: "Rules" },
];

export default async function Header() {
  const stats = await getSiteStats();

  return (
    <header className="glass-strong sticky top-2 z-20 mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-3xl px-4 py-3 sm:top-4 sm:gap-4 sm:px-6 sm:py-4">
      <WordMark className="text-2xl sm:text-3xl" />
      <p className="hidden text-[15px] text-ink-soft sm:block">
        made <span className="font-semibold text-green">{formatUsd(stats.totalRaisedUsd)}</span>{" "}
        in {stats.hoursSinceLaunch}h
      </p>
      <nav className="flex items-center gap-3 text-sm font-semibold text-ink sm:gap-7 sm:text-[15px]">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="opacity-80 hover:opacity-100">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
