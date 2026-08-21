import Header from "@/components/Header";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <main className="pb-24">
      <Header />
      <div className="mx-auto max-w-2xl px-6">
        <h1 className="mb-6 text-3xl font-extrabold text-ink">About</h1>
        <div className="glass space-y-4 rounded-2xl p-6 text-[15px] leading-relaxed text-ink-soft">
          <p>
            BidYourDapp!#1 is a paid leaderboard for crypto dapps. The board is
            ranked purely by bid size — the highest confirmed on-chain payment
            holds #1, and every other bid lands exactly where its amount ranks
            against everyone else.
          </p>
          <p>
            There&apos;s no algorithm and no editorial pick. Bids are paid in USDC
            or USDT, straight from your wallet, on Solana, Ethereum, Base, BNB
            Chain, or Polygon, and a spot is only confirmed once the payment
            settles on-chain.
          </p>
          <p>
            Anyone can take a spot from anyone else at any time by placing a
            higher bid — see the <a href="/rules" className="font-semibold text-blue">rules</a> for
            specifics.
          </p>
        </div>
      </div>
    </main>
  );
}
