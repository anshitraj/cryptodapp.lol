export default function Hero() {
  return (
    <div className="mx-auto max-w-4xl px-6 text-center">
      <h1 className="text-[38px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[56px] md:text-[68px]">
        Claim{" "}
        <span className="font-wordmark align-middle text-[1.35em] text-blue">#1</span>{" "}
        for your
        <br />
        Crypto Dapp
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">
        <span className="font-semibold text-green">Bids start at $1.</span> Bid under
        the #1 price and you still land on the board — exactly where your amount
        ranks. Paid in USDC or USDT, straight from your wallet, on Solana,
        Ethereum, Base, BNB Chain, or Polygon.
      </p>
    </div>
  );
}
