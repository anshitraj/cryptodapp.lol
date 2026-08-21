"use client";

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
};

export default function BidStepper({ value, onChange, min = 5, step = 5 }: Props) {
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
      <div className="font-wordmark text-5xl text-blue tabular-nums sm:text-7xl">
        ${value}
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
