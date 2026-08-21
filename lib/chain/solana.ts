import { Connection } from "@solana/web3.js";
import { SOLANA_TOKENS, TokenSymbol, solanaRpcUrl, treasurySolanaAddress } from "./constants";

export type ChainVerifyResult =
  | { ok: true; payerAddress: string | null }
  | { ok: false; reason: string };

// Confirms a USDC/USDT transfer to our treasury by reading the transaction's
// own token balance deltas — no reliance on any third-party payment API,
// just the Solana RPC.
export async function verifySolanaPayment(
  token: TokenSymbol,
  signature: string,
  expectedUsd: number
): Promise<ChainVerifyResult> {
  const mint = SOLANA_TOKENS[token].address;
  const connection = new Connection(solanaRpcUrl(), "confirmed");
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) return { ok: false, reason: "transaction not found (not yet confirmed?)" };
  if (tx.meta?.err) return { ok: false, reason: `transaction failed on-chain: ${JSON.stringify(tx.meta.err)}` };

  const treasury = treasurySolanaAddress();
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];

  const postEntry = post.find((b) => b.owner === treasury && b.mint === mint);
  if (!postEntry) return { ok: false, reason: `no ${token} transfer to treasury found in this transaction` };

  const preEntry = pre.find((b) => b.accountIndex === postEntry.accountIndex);
  const decimals = postEntry.uiTokenAmount.decimals;
  const postRaw = BigInt(postEntry.uiTokenAmount.amount);
  const preRaw = preEntry ? BigInt(preEntry.uiTokenAmount.amount) : BigInt(0);
  const receivedRaw = postRaw - preRaw;
  const expectedRaw = BigInt(Math.round(expectedUsd * 10 ** decimals));

  if (receivedRaw < expectedRaw) {
    return { ok: false, reason: `received ${receivedRaw} short of expected ${expectedRaw} (base units)` };
  }

  const payerAccountKeys = tx.transaction.message.accountKeys;
  const payerAddress = payerAccountKeys?.[0]?.pubkey?.toBase58() ?? null;

  return { ok: true, payerAddress };
}
