"use client";

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { SOLANA_TOKENS, TokenSymbol } from "./constants";

export async function buildSolanaTransfer(
  connection: Connection,
  payer: PublicKey,
  treasury: PublicKey,
  token: TokenSymbol,
  amountUsd: number
): Promise<Transaction> {
  const { address, decimals } = SOLANA_TOKENS[token];
  const mint = new PublicKey(address);
  const fromAta = await getAssociatedTokenAddress(mint, payer);
  const toAta = await getAssociatedTokenAddress(mint, treasury);

  const tx = new Transaction();

  const toAtaInfo = await connection.getAccountInfo(toAta);
  if (!toAtaInfo) {
    tx.add(createAssociatedTokenAccountInstruction(payer, toAta, treasury, mint));
  }

  const rawAmount = BigInt(Math.round(amountUsd * 10 ** decimals));
  tx.add(createTransferCheckedInstruction(fromAta, mint, toAta, payer, rawAmount, decimals));

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = payer;

  return tx;
}
