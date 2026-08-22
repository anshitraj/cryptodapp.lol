export type TokenSymbol = "USDC" | "USDT";
export type EvmChainKey = "ethereum" | "bsc" | "polygon" | "base";
export type ChainKey = "solana" | EvmChainKey;

type TokenInfo = { address: string; decimals: number };

type EvmChainConfig = {
  chainId: number;
  name: string;
  defaultRpc: string;
  rpcEnvVar: string;
  tokens: Partial<Record<TokenSymbol, TokenInfo>>;
};

// Every address below was checked against a block explorer or Circle/Tether's
// own docs, and every decimals value against the contract's own decimals()
// call — not assumed. BSC in particular uses 18 decimals for both tokens,
// unlike every other chain here (6) — a easy detail to get catastrophically
// wrong (10^12x) if assumed instead of checked.
export const EVM_CHAINS: Record<EvmChainKey, EvmChainConfig> = {
  ethereum: {
    chainId: 1,
    name: "Ethereum",
    defaultRpc: "https://ethereum-rpc.publicnode.com",
    rpcEnvVar: "ETHEREUM_RPC_URL",
    tokens: {
      USDC: { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
      USDT: { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    },
  },
  bsc: {
    chainId: 56,
    name: "BNB Smart Chain",
    defaultRpc: "https://bsc-dataseed.binance.org",
    rpcEnvVar: "BSC_RPC_URL",
    tokens: {
      // Binance-Peg (bridged), not native Circle/Tether issuance — this is
      // still the de facto standard USDC/USDT on BSC that wallets/exchanges use.
      USDC: { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
      USDT: { address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
    },
  },
  polygon: {
    chainId: 137,
    name: "Polygon",
    defaultRpc: "https://polygon-bor-rpc.publicnode.com",
    rpcEnvVar: "POLYGON_RPC_URL",
    tokens: {
      USDC: { address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 }, // native Circle
      USDT: { address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
    },
  },
  base: {
    chainId: 8453,
    name: "Base",
    defaultRpc: "https://mainnet.base.org",
    rpcEnvVar: "BASE_RPC_URL",
    tokens: {
      USDC: { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 }, // native Circle
      // USDT deliberately not offered on Base: the only USDT there
      // (0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2) is a third-party bridge
      // that Tether explicitly disclaims as not issued/backed/redeemable by them.
    },
  },
};

export const SOLANA_TOKENS: Record<TokenSymbol, TokenInfo> = {
  USDC: { address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  USDT: { address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
};

export const CHAIN_LABELS: Record<ChainKey, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
  bsc: "BNB Chain",
  polygon: "Polygon",
};

export const CHAIN_ID_TO_KEY: Record<number, EvmChainKey> = {
  1: "ethereum",
  56: "bsc",
  137: "polygon",
  8453: "base",
};

// Which EVM chains actually carry this token — Base has no USDT we're
// willing to accept (see the note on EVM_CHAINS.base).
export function evmChainsForToken(token: TokenSymbol): EvmChainKey[] {
  return (Object.keys(EVM_CHAINS) as EvmChainKey[]).filter((c) => EVM_CHAINS[c].tokens[token]);
}

// Where to send someone whose wallet is sitting on a chain we don't take.
// Both picks are the cheapest-gas option that carries the token.
export const FALLBACK_EVM_CHAIN: Record<TokenSymbol, EvmChainKey> = {
  USDC: "base",
  USDT: "polygon",
};

export function evmChainConfig(chain: EvmChainKey): EvmChainConfig {
  return EVM_CHAINS[chain];
}

// All chains (Solana included) that accept a given token — for surfacing
// "USDC works on X, Y, Z" copy before someone picks a wallet.
export function chainsForToken(token: TokenSymbol): ChainKey[] {
  return ["solana", ...evmChainsForToken(token)];
}

export function evmTokenInfo(chain: EvmChainKey, token: TokenSymbol): TokenInfo {
  const info = EVM_CHAINS[chain].tokens[token];
  if (!info) throw new Error(`${token} is not offered on ${EVM_CHAINS[chain].name}`);
  return info;
}

export function evmRpcUrl(chain: EvmChainKey): string {
  const config = EVM_CHAINS[chain];
  return process.env[config.rpcEnvVar] || config.defaultRpc;
}

export function treasurySolanaAddress(): string {
  const addr = process.env.NEXT_PUBLIC_TREASURY_SOLANA_ADDRESS;
  if (!addr) throw new Error("Missing NEXT_PUBLIC_TREASURY_SOLANA_ADDRESS");
  return addr;
}

// Same EOA works across every EVM chain, so one address covers Ethereum,
// BSC, Polygon, and Base.
export function treasuryEvmAddress(): `0x${string}` {
  const addr = process.env.NEXT_PUBLIC_TREASURY_EVM_ADDRESS;
  if (!addr) throw new Error("Missing NEXT_PUBLIC_TREASURY_EVM_ADDRESS");
  return addr as `0x${string}`;
}

// api.mainnet-beta.solana.com 403s browser traffic outright, so it can't be
// the default anywhere the browser will hit it. publicnode does serve
// browsers, and works with no key — good enough to run on, though a
// dedicated Helius/QuickNode endpoint is worth it under real traffic.
const DEFAULT_SOLANA_RPC = "https://solana-rpc.publicnode.com";

// Client-side (wallet connection, sending the transfer). Must be NEXT_PUBLIC_
// or the browser silently can't see it and falls back to the default.
export function solanaRpcUrlPublic(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || DEFAULT_SOLANA_RPC;
}

// Server-side (verifying a payment landed). Prefers the private key-bearing
// endpoint if one is set, so a paid RPC plan isn't exposed to the browser.
export function solanaRpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    DEFAULT_SOLANA_RPC
  );
}
