import { formatUsd } from "@/lib/format";

export default function Hero({ bidToTakeTopUsd }: { bidToTakeTopUsd: number }) {
  return (
    <div className="mx-auto max-w-4xl px-6 text-center">
      <h1 className="text-[38px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[56px] md:text-[68px]">
        Claim{" "}
        <span className="font-wordmark align-middle text-[1.35em] text-blue">#1</span>{" "}
        for {" "}
        <span className="text-blue">{formatUsd(bidToTakeTopUsd)}</span>
        <br />
        Crypto Dapp
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">
        <span className="font-semibold text-green">
          {bidToTakeTopUsd === 1
            ? "Bids start at $1."
            : `${formatUsd(bidToTakeTopUsd)} takes the #1 spot.`}
        </span>{" "}
        Bid less and you still land on the board — exactly where your amount
        ranks. Paid in USDC or USDT, straight from your wallet, on Solana,
        Ethereum, Base, BNB Chain, or Polygon.
      </p>
    </div>
  );
}
