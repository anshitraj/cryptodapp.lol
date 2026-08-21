"use client";

import { createPublicClient, createWalletClient, custom, http, parseAbi, parseUnits } from "viem";
import { mainnet, bsc, polygon, base } from "viem/chains";
import { EvmChainKey, TokenSymbol, evmRpcUrl, evmTokenInfo } from "./constants";

const VIEM_CHAINS = { ethereum: mainnet, bsc, polygon, base };

const ERC20_TRANSFER_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

async function ensureChain(provider: any, chain: EvmChainKey) {
  const viemChain = VIEM_CHAINS[chain];
  const chainIdHex = `0x${viemChain.id.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: viemChain.name,
          nativeCurrency: viemChain.nativeCurrency,
          rpcUrls: [evmRpcUrl(chain)],
          blockExplorerUrls: [viemChain.blockExplorers?.default.url].filter(Boolean),
        },
      ],
    });
  }
}

// Sends a USDC/USDT transfer on the given EVM chain using whatever EIP-1193
// wallet the browser has injected (MetaMask, Coinbase Wallet, etc) — no
// wagmi/RainbowKit/WalletConnect project id required to get a working path.
export async function payEvmToken(
  chain: EvmChainKey,
  token: TokenSymbol,
  treasury: `0x${string}`,
  amountUsd: number
): Promise<`0x${string}`> {
  const provider = (window as any).ethereum;
  if (!provider) {
    throw new Error("No EVM wallet found — install MetaMask or Coinbase Wallet.");
  }

  const tokenInfo = evmTokenInfo(chain, token);
  const viemChain = VIEM_CHAINS[chain];

  const [rawAccount] = await provider.request({ method: "eth_requestAccounts" });
  const account = rawAccount as `0x${string}`;
  await ensureChain(provider, chain);

  const client = createWalletClient({ chain: viemChain, transport: custom(provider), account });
  const value = parseUnits(amountUsd.toString(), tokenInfo.decimals);

  const hash = await client.writeContract({
    address: tokenInfo.address as `0x${string}`,
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [treasury, value],
    account,
    chain: viemChain,
  });

  // Wait for the receipt here so callers always hand a settled tx to the
  // server's /confirm endpoint, instead of racing an RPC that hasn't seen it yet.
  const publicClient = createPublicClient({ chain: viemChain, transport: http(evmRpcUrl(chain)) });
  await publicClient.waitForTransactionReceipt({ hash });

  return hash;
}
