"use client";

import { useState } from "react";
import BidStepper from "./BidStepper";
import PayStep from "./PayStep";

const MIN_BID = 5;

type Treasury = { solana: string; evm: string };
type PendingBid = { bidId: string; treasury: Treasury };

export default function ClaimForm({
  prefillLink = "",
  floorUsd = MIN_BID,
}: {
  prefillLink?: string;
  floorUsd?: number;
}) {
  const [link, setLink] = useState(prefillLink);
  const [amount, setAmount] = useState(Math.max(MIN_BID, floorUsd));
  const [pendingBid, setPendingBid] = useState<PendingBid | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleClaim() {
    if (!link.trim()) {
      setError("Paste a dapp link or name first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: link.trim(), requestedUsd: amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.treasury) {
        throw new Error(data.error ?? "Could not start bid");
      }
      setPendingBid({ bidId: data.bidId, treasury: data.treasury });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingBid) {
    return (
      <div className="mx-auto mt-10 max-w-2xl px-6">
        <PayStep
          bidId={pendingBid.bidId}
          amountUsd={amount}
          treasury={pendingBid.treasury}
          onDone={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-7 px-6">
      <BidStepper value={amount} onChange={setAmount} />

      <div className="glass flex w-full flex-col gap-2 rounded-3xl p-2 sm:flex-row sm:items-center sm:rounded-full sm:pl-5">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:px-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint">
            <path
              d="M10.5 13.5a3.5 3.5 0 0 0 4.95 0l3-3a3.5 3.5 0 1 0-4.95-4.95l-1 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M13.5 10.5a3.5 3.5 0 0 0-4.95 0l-3 3a3.5 3.5 0 1 0 4.95 4.95l1-1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Contract address, dapp link, or name..."
            className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
          />
        </div>
        <button
          onClick={handleClaim}
          disabled={submitting}
          className="shrink-0 rounded-full bg-blue-claim px-6 py-3.5 font-semibold text-white transition hover:brightness-105 disabled:opacity-60 sm:py-3"
        >
          {submitting ? "Starting…" : "Claim #1"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-sm text-ink-faint">
        Already listed? Drop in the same link to push your bid
      </p>
    </div>
  );
}
