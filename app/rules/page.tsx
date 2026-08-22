import Header from "@/components/Header";

const RULES = [
  {
    title: "Ranking",
    body: "Listings are sorted by highest confirmed paid bid. Ties rank by whichever payment settled first.",
  },
  {
    title: "Minimum bid",
    body: "Every bid starts at $1. There's no maximum — bid whatever it takes to hold the spot you want.",
  },
  {
    title: "Payment",
    body: "Bids are paid in USDC or USDT, straight from your wallet, on Solana, Ethereum, Base, BNB Chain, or Polygon (Base is USDC-only). A bid only counts once the on-chain payment is confirmed — pending or failed payments never appear on the board.",
  },
  {
    title: "Taking a spot",
    body: "Anyone can outbid any listing at any time, including #1. There's no cooldown and no notice given to the listing being outbid.",
  },
  {
    title: "Refunds",
    body: "Bids are payments for placement, not deposits or holds, so they're final once confirmed on-chain.",
  },
  {
    title: "Content",
    body: "Listings must link to a real, working dapp, app, or project. We remove listings that are broken, malicious, or impersonating another project.",
  },
];

export const dynamic = "force-dynamic";

export default function RulesPage() {
  return (
    <main className="pb-24">
      <Header />
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="mb-6 text-3xl font-extrabold text-ink">Rules</h1>
        <div className="flex flex-col gap-5">
          {RULES.map((rule) => (
            <div key={rule.title} className="glass rounded-2xl p-6">
              <h2 className="mb-2 text-lg font-bold text-ink">{rule.title}</h2>
              <p className="text-[15px] leading-relaxed text-ink-soft">{rule.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
