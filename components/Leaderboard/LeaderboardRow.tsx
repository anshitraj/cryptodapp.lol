"use client";

import Link from "next/link";
import Image from "next/image";
import type { KeyboardEvent } from "react";
import { nextTopBidUsd } from "@/lib/bidding";
import { formatUsd, timeAgo } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/leaderboard";

export type { LeaderboardEntry } from "@/lib/leaderboard";

function displayListingName(entry: LeaderboardEntry): string {
  // New listings initially use their URL as a placeholder name. Present that
  // fallback as the recognisable host, while preserving any real custom name.
  if (entry.name !== entry.link && !/^https?:\/\//i.test(entry.name)) return entry.name;

  try {
    const hostname = new URL(entry.link).hostname.replace(/^www\./, "");
    return hostname.replace(/\.[^.]+$/, "");
  } catch {
    return entry.name;
  }
}

export default function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  function trackClick() {
    fetch(`/api/listings/${entry.id}/click`, { method: "POST" }).catch(() => {});
  }

  function openListing() {
    trackClick();
    window.location.assign(entry.link);
  }

  function handleCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.currentTarget !== event.target) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openListing();
    }
  }

  const isTop = entry.rank === 1;
  const listingName = displayListingName(entry);

  return (
    <div className={isTop ? "relative" : undefined}>
      {isTop && (
        <div className="absolute -top-3 left-5 z-10 rounded-full bg-green px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
          Holding #1
        </div>
      )}
      <div
        role="link"
        tabIndex={0}
        aria-label={`Open ${listingName}`}
        onClick={openListing}
        onKeyDown={handleCardKeyDown}
        className={`glass flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue sm:p-5 ${
          isTop ? "border-2 border-green/50 pt-6" : ""
        }`}
      >
        <span className="w-6 shrink-0 text-center text-sm font-semibold text-ink-faint sm:w-8">
          #{entry.rank}
        </span>

        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-soft sm:h-11 sm:w-11"
        >
          {entry.icon_url ? (
            <Image src={entry.icon_url} alt="" width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-blue">{listingName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-40">
          <p className="truncate text-[15px] font-semibold text-ink">{listingName}</p>
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
            href={`/?link=${encodeURIComponent(entry.link)}&bid=${nextTopBidUsd(entry.amount_usd)}`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-full bg-peach px-4 py-2 text-sm font-semibold text-peach-ink hover:brightness-95"
          >
            Take this spot
          </Link>
        </div>
      </div>
    </div>
  );
}
