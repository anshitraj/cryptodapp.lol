"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { nextTopBidUsd } from "@/lib/bidding";
import { formatUsd, timeAgo } from "@/lib/format";
import { faviconFallbackUrl } from "@/lib/listing-icon";
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
  const [iconUrl, setIconUrl] = useState(entry.icon_url);

  useEffect(() => {
    setIconUrl(entry.icon_url);
  }, [entry.icon_url]);

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
  const fallbackIconUrl = faviconFallbackUrl(entry.link);

  function handleIconError() {
    setIconUrl((currentUrl) => {
      if (!fallbackIconUrl || currentUrl === fallbackIconUrl) return null;
      return fallbackIconUrl;
    });
  }

  return (
    <div className={isTop ? "relative" : undefined}>
      {isTop && (
        <div className="absolute -top-3 left-5 z-10 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-blue/20">
          <span aria-hidden="true" className="text-blue">✦</span>
          Top bid · #1
        </div>
      )}
      <div
        role="link"
        tabIndex={0}
        aria-label={`Open ${listingName}`}
        onClick={openListing}
        onKeyDown={handleCardKeyDown}
        className={`glass flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue sm:p-5 ${
          isTop
            ? "!border-blue/60 !bg-[linear-gradient(135deg,rgba(47,134,255,0.24),rgba(255,255,255,0.94)_48%,rgba(22,163,74,0.18))] pt-7 shadow-[0_18px_45px_rgba(47,134,255,0.2)]"
            : ""
        }`}
      >
        {isTop ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-sm font-extrabold tracking-tight text-white shadow-md shadow-blue/20 sm:h-12 sm:w-12">
            #1
          </span>
        ) : (
          <span className="w-6 shrink-0 text-center text-sm font-semibold text-ink-faint sm:w-8">
            #{entry.rank}
          </span>
        )}

        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-soft sm:h-11 sm:w-11 ${
            isTop ? "ring-2 ring-white/80 shadow-md shadow-blue/20" : ""
          }`}
        >
          {iconUrl ? (
            <Image
              src={iconUrl}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              onError={handleIconError}
            />
          ) : (
            <span className="text-lg font-bold text-blue">{listingName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-40">
          <p className={`truncate text-[15px] font-semibold text-ink ${isTop ? "sm:text-base" : ""}`}>{listingName}</p>
          <p className="mt-1 line-clamp-3 min-h-[3.75rem] max-w-[58ch] text-sm leading-5 text-ink-soft">
            {entry.description}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-blue-soft px-2.5 py-1 font-semibold text-blue">
              {entry.clicks} clicks
            </span>
            <span className="text-ink-faint">{timeAgo(entry.paid_at)}</span>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end">
          <span
            className={`font-bold text-blue ${
              isTop ? "rounded-xl bg-white/65 px-3 py-1.5 text-xl shadow-sm" : "text-lg"
            }`}
          >
            {formatUsd(entry.amount_usd)}
          </span>
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
