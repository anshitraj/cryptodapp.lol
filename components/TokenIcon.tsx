import { TokenSymbol } from "@/lib/chain/constants";

const STYLES: Record<TokenSymbol, { bg: string; glyph: string }> = {
  USDC: { bg: "#2775CA", glyph: "$" },
  USDT: { bg: "#26A17B", glyph: "T" },
};

export default function TokenIcon({ token, size = 20 }: { token: TokenSymbol; size?: number }) {
  const { bg, glyph } = STYLES[token];
  return (
    <span
      style={{ width: size, height: size, minWidth: size, background: bg, fontSize: size * 0.58 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
