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

export function evmChainConfig(chain: EvmChainKey): EvmChainConfig {
  return EVM_CHAINS[chain];
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

export function solanaRpcUrl(): string {
  return process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
}
