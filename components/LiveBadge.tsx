"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/client";

function getVisitorId(): string {
  const key = "cd_visitor_id";
  let id = typeof window !== "undefined" ? localStorage.getItem(key) : null;
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function LiveBadge({ initialVisitorCount }: { initialVisitorCount: number }) {
  const [onlineNow, setOnlineNow] = useState(1);
  const [visitorCount, setVisitorCount] = useState(initialVisitorCount);

  useEffect(() => {
    const visitorId = getVisitorId();
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    })
      .then((res) => res.json())
      .catch(() => {});

    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channel = supabase.channel("site-presence", {
      config: { presence: { key: visitorId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineNow(Object.keys(channel.presenceState()).length);
      })
      .subscribe((subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setVisitorCount(data.visitorCount))
      .catch(() => {});
  }, []);

  return (
    <div className="glass mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl px-4 py-2.5 text-xs sm:rounded-full sm:px-5 sm:text-sm">
      <span className="flex items-center gap-2 font-semibold text-green">
        <span className="h-2 w-2 rounded-full bg-green" />
        {onlineNow} online now
      </span>
      <span className="hidden text-ink-faint sm:inline">·</span>
      <span className="text-ink-soft">
        <span className="font-semibold text-ink">{visitorCount.toLocaleString()}</span> visitors so far
      </span>
      <span className="hidden text-ink-faint sm:inline">·</span>
      <Link href="/live-stats" className="font-semibold text-ink hover:text-blue">
        See live stats
      </Link>
    </div>
  );
}
