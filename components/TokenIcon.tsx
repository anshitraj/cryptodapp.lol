import { TokenSymbol } from "@/lib/chain/constants";

// Real brand assets in /public — USDT's is a wide non-square mark, USDC's is
// a circular badge. object-contain + a fixed square box keeps them the same
// visual size and baseline-aligned next to text regardless of that.
const SRC: Record<TokenSymbol, string> = {
  USDC: "/Circle_USDC_Logo.svg",
  USDT: "/logo.svg",
};

export default function TokenIcon({ token, size = 20 }: { token: TokenSymbol; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[token]}
      alt={token}
      width={size}
      height={size}
      style={{ width: size, height: size, minWidth: size }}
      className="inline-block shrink-0 object-contain align-middle"
    />
  );
}
