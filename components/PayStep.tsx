"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { buildSolanaTransfer } from "@/lib/chain/solanaWallet";
import { payEvmToken } from "@/lib/chain/evmWallet";
import { ChainKey, EvmChainKey, TokenSymbol } from "@/lib/chain/constants";
import ListingEditor, { EditableListing } from "./ListingEditor";

type Treasury = { solana: string; evm: string };
type Stage = "choose-chain" | "choose-token" | "picking-wallet" | "paying" | "confirming" | "done" | "error";

const CHAINS: { key: ChainKey; label: string; tokens: TokenSymbol[] }[] = [
  { key: "solana", label: "Solana", tokens: ["USDC", "USDT"] },
  { key: "ethereum", label: "Ethereum", tokens: ["USDC", "USDT"] },
  { key: "base", label: "Base", tokens: ["USDC"] },
  { key: "bsc", label: "BNB Chain", tokens: ["USDC", "USDT"] },
  { key: "polygon", label: "Polygon", tokens: ["USDC", "USDT"] },
];

export default function PayStep({
  bidId,
  amountUsd,
  treasury,
  onDone,
}: {
  bidId: string;
  amountUsd: number;
  treasury: Treasury;
  onDone: () => void;
}) {
  const { connection } = useConnection();
  const { wallets, wallet, select, connect, connected, publicKey, sendTransaction } = useWallet();
  const [stage, setStage] = useState<Stage>("choose-chain");
  const [chain, setChain] = useState<ChainKey | null>(null);
  const [token, setToken] = useState<TokenSymbol | null>(null);
  const [error, setError] = useState("");
  const [listing, setListing] = useState<EditableListing | null>(null);
  const wantsSolanaPay = useRef(false);

  async function confirmWithServer(chosenChain: ChainKey, chosenToken: TokenSymbol, txRef: string) {
    setStage("confirming");
    try {
      const res = await fetch(`/api/bids/${bidId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: chosenChain, token: chosenToken, txRef }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.listing) setListing(data.listing);
        setStage("done");
        onDone();
      } else {
        setError(data.reason ?? data.error ?? "Payment could not be confirmed.");
        setStage("error");
      }
    } catch (err) {
      setError((err as Error).message);
      setStage("error");
    }
  }

  async function sendSolanaPayment(chosenToken: TokenSymbol) {
    if (!publicKey) return;
    setStage("paying");
    setError("");
    try {
      const treasuryKey = new PublicKey(treasury.solana);
      const tx = await buildSolanaTransfer(connection, publicKey, treasuryKey, chosenToken, amountUsd);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(
        { signature, blockhash: tx.recentBlockhash!, lastValidBlockHeight: tx.lastValidBlockHeight! },
        "confirmed"
      );
      await confirmWithServer("solana", chosenToken, signature);
    } catch (err) {
      setError((err as Error).message);
      setStage("error");
    }
  }

  // select() only updates which adapter is active — connect() has to follow
  // once that state lands, so this fires the moment `wallet` changes.
  useEffect(() => {
    if (wantsSolanaPay.current && wallet && !connected) {
      connect().catch((err) => {
        setError((err as Error).message);
        setStage("error");
      });
    }
  }, [wallet, connected, connect]);

  useEffect(() => {
    if (wantsSolanaPay.current && connected && publicKey && token) {
      wantsSolanaPay.current = false;
      sendSolanaPayment(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  function startSolana(chosenToken: TokenSymbol) {
    setError("");
    if (connected) {
      sendSolanaPayment(chosenToken);
      return;
    }
    if (wallets.length === 0) {
      setError("No Solana wallet found — install Phantom, Solflare, or Backpack.");
      setStage("error");
      return;
    }
    if (wallets.length === 1) {
      wantsSolanaPay.current = true;
      select(wallets[0].adapter.name);
      setStage("paying");
      return;
    }
    setStage("picking-wallet");
  }

  function pickWallet(name: (typeof wallets)[number]["adapter"]["name"]) {
    wantsSolanaPay.current = true;
    select(name);
    setStage("paying");
  }

  async function startEvm(chosenChain: EvmChainKey, chosenToken: TokenSymbol) {
    setError("");
    setStage("paying");
    try {
      const hash = await payEvmToken(chosenChain, chosenToken, treasury.evm as `0x${string}`, amountUsd);
      await confirmWithServer(chosenChain, chosenToken, hash);
    } catch (err) {
      setError((err as Error).message);
      setStage("error");
    }
  }

  function pickToken(t: TokenSymbol) {
    setToken(t);
    if (!chain) return;
    if (chain === "solana") {
      startSolana(t);
    } else {
      startEvm(chain, t);
    }
  }

  if (stage === "done") {
    if (listing) return <ListingEditor bidId={bidId} listing={listing} />;
    return <p className="text-center font-semibold text-green">Payment confirmed — you're on the board.</p>;
  }

  if (stage === "picking-wallet") {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-ink-soft">Choose a Solana wallet</p>
        {wallets.map((w) => (
          <button
            key={w.adapter.name}
            onClick={() => pickWallet(w.adapter.name)}
            className="glass w-full max-w-xs rounded-full px-5 py-3 text-sm font-semibold text-ink hover:border-blue"
          >
            {w.adapter.name}
          </button>
        ))}
      </div>
    );
  }

  if (stage === "choose-chain" || (stage === "error" && !chain)) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-ink-soft">Pay ${amountUsd} — choose a chain</p>
        <div className="flex flex-wrap justify-center gap-2">
          {CHAINS.map((c) => (
            <button
              key={c.key}
              onClick={() => {
                setChain(c.key);
                setError("");
                setStage("choose-token");
              }}
              className="glass rounded-full px-5 py-3 text-sm font-semibold text-ink hover:border-blue"
            >
              {c.label}
            </button>
          ))}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (stage === "choose-token" && chain) {
    const chainInfo = CHAINS.find((c) => c.key === chain)!;
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-ink-soft">
          Pay ${amountUsd} on {chainInfo.label} — choose a token
        </p>
        <div className="flex gap-2">
          {chainInfo.tokens.map((t) => (
            <button
              key={t}
              onClick={() => pickToken(t)}
              className="glass rounded-full px-6 py-3 text-sm font-semibold text-ink hover:border-blue"
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setStage("choose-chain")} className="text-xs text-ink-faint hover:text-ink">
          ← choose a different chain
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-ink-soft">
        Pay ${amountUsd} in {token} on {CHAINS.find((c) => c.key === chain)?.label}
      </p>
      {stage === "paying" && <p className="text-sm text-ink-faint">Confirm the transfer in your wallet…</p>}
      {stage === "confirming" && <p className="text-sm text-ink-faint">Confirming on-chain…</p>}
      {error && (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => {
              setStage("choose-chain");
              setChain(null);
              setToken(null);
              setError("");
            }}
            className="text-xs text-ink-faint hover:text-ink"
          >
            ← try again
          </button>
        </>
      )}
    </div>
  );
}
