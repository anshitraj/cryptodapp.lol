# cryptodapp.lol

Paid leaderboard for crypto dapps — clone of outbid.lol's UI/UX, paid in USDC
on Solana or Base, straight from the payer's wallet to yours. Next.js 16 +
Tailwind v4 + Supabase.

## Why no payment processor

Helio's exact API contract wasn't fully documented where I could check it,
and broke in practice. I then checked NOWPayments as a replacement and
confirmed (via their own supported-coins page) they don't support Base at
all — only Ethereum, BSC, Polygon, Solana, Tron, Arbitrum, Avalanche, zkSync.
Since Base is one of the two chains this site requires, that ruled it out
before any code was written.

Instead, payment is direct wallet-to-wallet USDC, verified by reading the
transaction straight off each chain's RPC — no third party in the loop at
all, so there's no processor-specific API contract left to get wrong:

- **Solana** — `@solana/wallet-adapter-react` connects the user's wallet
  (Phantom/Solflare/Backpack, auto-detected via Wallet Standard), builds a
  USDC SPL transfer with `@solana/spl-token`, sends it, waits for
  confirmation client-side.
- **Base** — reads `window.ethereum` directly with `viem` (no wagmi/
  RainbowKit needed for one ERC-20 transfer), sends USDC, waits for the
  receipt.
- Either way the client then calls `POST /api/bids/:id/confirm` with the
  tx signature/hash. The server independently re-reads that transaction from
  the chain (`lib/chain/solana.ts` / `lib/chain/base.ts`) and only marks the
  bid paid if it can see the USDC actually land in the treasury wallet for
  at least the bid amount. The client's report of "I paid" is never trusted
  on its own.

USDC contract/mint addresses are hardcoded in
[lib/chain/constants.ts](lib/chain/constants.ts) and were checked against
BaseScan + developers.circle.com/stablecoins/usdc-contract-addresses, not
guessed.

## Setup

1. **Supabase** — create a project at supabase.com, run
   [supabase/schema.sql](supabase/schema.sql) in the SQL editor, copy
   Project URL / `anon` key / `service_role` key into `.env.local`.
2. **Treasury wallets** — put your own Solana address and Base (EVM) address
   into `.env.local`. This is where bid payments land; there's no processor
   holding funds in between.
3. Copy `.env.local.example` → `.env.local`, fill in the above (RPC URLs
   have working public defaults, override later if they rate-limit you).
4. `npm install && npm run dev`.

## Notes

- Wordmark reads "BidYourDapp!#1", not a literal copy of outbid.lol's
  "BidYourApp!#1" string — same bubble-outline style/colors/layout, different
  text, so this isn't a direct brand copy.
- Bid amounts only ever get written from the server-side chain check in
  `/api/bids/[id]/confirm`, never from the client-submitted amount — the
  stepper amount is a request until the chain confirms it.
- USDC only for now (no native SOL/ETH) — that keeps the amount check a
  plain equality against the bid's USD amount instead of needing a live
  price feed. Native-token support would be a follow-up.
- Stats/leaderboard reads degrade to zero/empty if Supabase is unreachable
  instead of 500ing the page; the write endpoints (bids, visits) fail loudly
  instead, since a write that silently no-ops would be worse.
