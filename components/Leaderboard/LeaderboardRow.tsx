"use client";

import Link from "next/link";
import Image from "next/image";
import { formatUsd, timeAgo } from "@/lib/format";

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

export default function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  function trackClick() {
    fetch(`/api/listings/${entry.id}/click`, { method: "POST" }).catch(() => {});
  }

  const isTop = entry.rank === 1;

  return (
    <div className={isTop ? "relative" : undefined}>
      {isTop && (
        <div className="absolute -top-3 left-5 z-10 rounded-full bg-green px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
          Holding #1
        </div>
      )}
      <div
        className={`glass flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-4 sm:p-5 ${
          isTop ? "border-2 border-green/50 pt-6" : ""
        }`}
      >
        <span className="w-6 shrink-0 text-center text-sm font-semibold text-ink-faint sm:w-8">
          #{entry.rank}
        </span>

        <a
          href={entry.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={trackClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-soft sm:h-11 sm:w-11"
        >
          {entry.icon_url ? (
            <Image src={entry.icon_url} alt="" width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-blue">{entry.name.charAt(0).toUpperCase()}</span>
          )}
        </a>

        <div className="min-w-0 flex-1 basis-40">
          <a
            href={entry.link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={trackClick}
            className="truncate text-[15px] font-semibold text-ink hover:text-blue"
          >
            {entry.name}
          </a>
          <p className="truncate text-sm text-ink-soft">{entry.description}</p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-blue-soft px-2.5 py-1 font-semibold text-blue">
              {entry.clicks} clicks
            </span>
            <span className="text-ink-faint">{timeAgo(entry.paid_at)}</span>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
          <span className="text-lg font-bold text-blue">{formatUsd(entry.amount_usd)}</span>
          <Link
            href={`/?link=${encodeURIComponent(entry.link)}&floor=${Math.ceil(entry.amount_usd)}`}
            className="rounded-full bg-peach px-4 py-2 text-sm font-semibold text-peach-ink hover:brightness-95"
          >
            Take this spot
          </Link>
        </div>
      </div>
    </div>
  );
}
