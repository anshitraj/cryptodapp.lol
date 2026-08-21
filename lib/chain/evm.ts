import { createPublicClient, http, decodeEventLog, parseAbi } from "viem";
import { mainnet, bsc, polygon, base } from "viem/chains";
import {
  EvmChainKey,
  TokenSymbol,
  evmRpcUrl,
  evmTokenInfo,
  treasuryEvmAddress,
} from "./constants";
import type { ChainVerifyResult } from "./solana";

const VIEM_CHAINS = { ethereum: mainnet, bsc, polygon, base };

const ERC20_TRANSFER_ABI = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

// Confirms a USDC/USDT transfer to our treasury by reading the transaction
// receipt's own Transfer log — no third-party payment API, just each
// chain's public RPC.
export async function verifyEvmPayment(
  chain: EvmChainKey,
  token: TokenSymbol,
  txHash: `0x${string}`,
  expectedUsd: number
): Promise<ChainVerifyResult> {
  const tokenInfo = evmTokenInfo(chain, token);
  const client = createPublicClient({ chain: VIEM_CHAINS[chain], transport: http(evmRpcUrl(chain)) });

  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt) return { ok: false, reason: "transaction not found (not yet confirmed?)" };
  if (receipt.status !== "success") return { ok: false, reason: "transaction reverted on-chain" };

  const treasury = treasuryEvmAddress().toLowerCase();
  const expectedRaw = BigInt(Math.round(expectedUsd * 10 ** tokenInfo.decimals));

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== tokenInfo.address.toLowerCase()) continue;
    try {
      const event = decodeEventLog({ abi: ERC20_TRANSFER_ABI, data: log.data, topics: log.topics });
      if (event.args.to.toLowerCase() === treasury && event.args.value >= expectedRaw) {
        return { ok: true, payerAddress: event.args.from };
      }
    } catch {
      continue;
    }
  }

  return { ok: false, reason: `no matching ${token} transfer to treasury found in this transaction` };
}
