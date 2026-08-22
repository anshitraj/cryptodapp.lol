import Image from "next/image";
import Link from "next/link";
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
    <header className="glass-strong sticky top-2 z-20 mx-auto mb-4 w-[calc(100%-1rem)] max-w-6xl rounded-3xl px-4 py-3 sm:top-4 sm:w-[calc(100%-2rem)] sm:px-6 sm:py-4 lg:flex lg:items-center lg:justify-between lg:gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="cryptobid.lol home"
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-ink sm:text-xl"
        >
          <Image
            src="/cryptobid-mark.png"
            alt=""
            width={32}
            height={32}
            className="h-6 w-6 object-contain sm:h-7 sm:w-7"
            priority
          />
          <span>
            crypto<span className="text-blue">bid</span><span className="font-semibold text-ink-soft">.lol</span>
          </span>
        </Link>
        <p className="hidden text-[15px] text-ink-soft lg:block">
          made <span className="font-semibold text-green">{formatUsd(stats.totalRaisedUsd)}</span>{" "}
          in {stats.hoursSinceLaunch}h
        </p>
      </div>
      <nav
        aria-label="Primary navigation"
        className="mt-2 grid grid-cols-4 border-t border-border/70 pt-2 text-center text-xs font-semibold text-ink lg:mt-0 lg:flex lg:items-center lg:gap-7 lg:border-0 lg:p-0 lg:text-[15px]"
      >
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="opacity-80 hover:opacity-100">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
