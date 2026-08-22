"use client";

import { writeContract, waitForTransactionReceipt, switchChain } from "wagmi/actions";
import { parseAbi, parseUnits } from "viem";
import { wagmiConfig } from "./wagmiConfig";
import { EvmChainKey, TokenSymbol, evmTokenInfo } from "./constants";

const CHAIN_IDS: Record<EvmChainKey, number> = {
  ethereum: 1,
  base: 8453,
  bsc: 56,
  polygon: 137,
};

const ERC20_TRANSFER_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

// Sends a USDC/USDT transfer using whatever wallet wagmi/RainbowKit already
// connected — injected extension or WalletConnect (mobile deep-link), same
// code path either way.
export async function payEvmToken(
  chain: EvmChainKey,
  token: TokenSymbol,
  treasury: `0x${string}`,
  amountUsd: number
): Promise<`0x${string}`> {
  const tokenInfo = evmTokenInfo(chain, token);
  const chainId = CHAIN_IDS[chain];

  await switchChain(wagmiConfig, { chainId: chainId as 1 | 8453 | 56 | 137 });

  const value = parseUnits(amountUsd.toString(), tokenInfo.decimals);
  const hash = await writeContract(wagmiConfig, {
    address: tokenInfo.address as `0x${string}`,
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [treasury, value],
    chainId: chainId as 1 | 8453 | 56 | 137,
  });

  // Wait for the receipt here so callers always hand a settled tx to the
  // server's /confirm endpoint, instead of racing an RPC that hasn't seen it yet.
  await waitForTransactionReceipt(wagmiConfig, { hash, chainId: chainId as 1 | 8453 | 56 | 137 });

  return hash;
}
