"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
};

export default function BidStepper({ value, onChange, min = 1, step = 1 }: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw: string) {
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    const parsed = Number(digitsOnly);
    const next = digitsOnly && Number.isFinite(parsed) ? Math.max(min, parsed) : min;
    setDraft(String(next));
    onChange(next);
  }

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      <button
        type="button"
        aria-label="Decrease bid"
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-soft text-3xl font-bold text-blue transition hover:brightness-95 active:scale-95 sm:h-16 sm:w-16 sm:text-4xl"
      >
        −
      </button>
      <div className="flex items-center font-wordmark text-5xl text-blue tabular-nums sm:text-7xl">
        <span>$</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Bid amount in dollars"
          className="min-w-0 bg-transparent text-center outline-none"
          style={{ width: `${Math.max(1, draft.length)}ch` }}
        />
      </div>
      <button
        type="button"
        aria-label="Increase bid"
        onClick={() => onChange(value + step)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-soft text-3xl font-bold text-blue transition hover:brightness-95 active:scale-95 sm:h-16 sm:w-16 sm:text-4xl"
      >
        +
      </button>
    </div>
  );
}
