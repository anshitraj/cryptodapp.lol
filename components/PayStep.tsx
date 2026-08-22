"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { PublicKey } from "@solana/web3.js";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { buildSolanaTransfer } from "@/lib/chain/solanaWallet";
import { payEvmToken } from "@/lib/chain/evmWallet";
import {
  CHAIN_ID_TO_KEY,
  CHAIN_LABELS,
  ChainKey,
  EvmChainKey,
  FALLBACK_EVM_CHAIN,
  TokenSymbol,
  chainsForToken,
  evmChainsForToken,
} from "@/lib/chain/constants";
import ListingEditor, { EditableListing } from "./ListingEditor";
import TokenIcon from "./TokenIcon";
import { setSolanaErrorHandler } from "@/lib/chain/solanaErrorBus";

type Treasury = { solana: string; evm: string };
type Stage = "choose-token" | "choose-wallet" | "connecting" | "paying" | "confirming" | "done" | "error";

const CONNECT_TIMEOUT_MS = 30000;

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
  const {
    wallets,
    wallet: solanaWallet,
    select,
    connect,
    connected: solanaConnected,
    disconnect,
    publicKey,
    sendTransaction,
  } = useWallet();
  const { isConnected: evmConnected, chainId: evmChainId } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();

  const [stage, setStage] = useState<Stage>("choose-token");
  const [token, setToken] = useState<TokenSymbol | null>(null);
  const [payingOn, setPayingOn] = useState<ChainKey | null>(null);
  const [error, setError] = useState("");
  const [listing, setListing] = useState<EditableListing | null>(null);

  const wantsSolanaPay = useRef(false);
  const wantsEvmPay = useRef(false);
  const prevModalOpen = useRef(false);
  const connectingRef = useRef(false);
  const activeWalletName = useRef<string>("");
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearConnectTimer() {
    if (connectTimer.current) {
      clearTimeout(connectTimer.current);
      connectTimer.current = null;
    }
  }

  // Whatever we're waiting on next (a wallet's own popup, an extension that
  // never responds, a modal stuck behind the window) — if it doesn't land in
  // 30s, hand control back instead of leaving the screen stuck forever.
  function armConnectTimeout(onExpire: () => void) {
    clearConnectTimer();
    connectTimer.current = setTimeout(onExpire, CONNECT_TIMEOUT_MS);
  }

  useEffect(() => clearConnectTimer, []);

  // Registered for the component's whole lifetime, not per attempt —
  // scoping it to a single connect() call races the adapter, whose onError
  // can fire after that call has already settled and torn the handler down.
  useEffect(() => {
    setSolanaErrorHandler((err) => {
      if (!wantsSolanaPay.current) return;
      wantsSolanaPay.current = false;
      connectingRef.current = false;
      fail(solanaConnectError(err, activeWalletName.current || "Your wallet"));
    });
    return () => setSolanaErrorHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fail(message: string) {
    clearConnectTimer();
    setError(message);
    setStage("error");
  }

  async function confirmWithServer(chain: ChainKey, chosenToken: TokenSymbol, txRef: string) {
    setStage("confirming");
    try {
      const res = await fetch(`/api/bids/${bidId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain, token: chosenToken, txRef }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.listing) setListing(data.listing);
        setStage("done");
        onDone();
      } else {
        fail(data.reason ?? data.error ?? "Payment could not be confirmed.");
      }
    } catch (err) {
      fail((err as Error).message);
    }
  }

  // ---- Solana ----

  // Polls signature status directly instead of the blockhash-object form of
  // confirmTransaction — that form fails if the locally-tracked blockhash
  // doesn't line up with what a (possibly multi-node, free-tier) RPC actually
  // used to land the transaction. This only cares whether the signature
  // itself landed.
  async function waitForSolanaConfirmation(signature: string, timeoutMs = 45000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const { value } = await connection.getSignatureStatuses([signature]);
      const status = value[0];
      if (status?.err) throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
      if (status?.confirmationStatus === "confirmed" || status?.confirmationStatus === "finalized") return;
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error(
      "Timed out waiting for on-chain confirmation. If it actually went through, check the leaderboard in a minute — otherwise try again."
    );
  }

  async function runSolanaPayment(chosenToken: TokenSymbol) {
    if (!publicKey) return;
    clearConnectTimer();
    setPayingOn("solana");
    setStage("paying");
    setError("");
    try {
      const treasuryKey = new PublicKey(treasury.solana);
      const tx = await buildSolanaTransfer(connection, publicKey, treasuryKey, chosenToken, amountUsd);
      const signature = await sendTransaction(tx, connection);
      setStage("confirming");
      await waitForSolanaConfirmation(signature);
      await confirmWithServer("solana", chosenToken, signature);
    } catch (err) {
      fail((err as Error).message);
    }
  }

  function solanaConnectError(err: unknown, walletName: string): string {
    const msg = (err as Error)?.message ?? String(err);
    if (/user rejected|user denied|rejected the request/i.test(msg)) {
      return "You declined the connection request in your wallet.";
    }
    if (/not detected|not installed|no provider/i.test(msg)) {
      return `${walletName} isn't available in this browser. Make sure the extension is enabled, then reload.`;
    }
    if (/local network access/i.test(msg)) {
      return "Mobile Wallet Adapter only works on Android. On desktop, use the Phantom/Solflare/Backpack extension instead.";
    }
    return `${walletName} couldn't connect: ${msg}`;
  }

  async function connectSolana(walletName: string) {
    if (connectingRef.current) return;
    connectingRef.current = true;
    activeWalletName.current = walletName;
    try {
      await connect();
    } catch (err) {
      if (wantsSolanaPay.current) {
        wantsSolanaPay.current = false;
        fail(solanaConnectError(err, walletName));
      }
    } finally {
      connectingRef.current = false;
    }
  }

  // Only fires when select() actually swapped in a *different* adapter. The
  // already-selected case is handled in pickSolanaWallet — see the note there.
  useEffect(() => {
    if (wantsSolanaPay.current && solanaWallet && !solanaConnected && !connectingRef.current) {
      connectSolana(solanaWallet.adapter.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solanaWallet, solanaConnected]);

  useEffect(() => {
    if (wantsSolanaPay.current && solanaConnected && publicKey && token) {
      wantsSolanaPay.current = false;
      runSolanaPayment(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solanaConnected, publicKey]);

  function pickSolanaWallet(name: (typeof wallets)[number]["adapter"]["name"]) {
    if (!token) return;
    setError("");
    setPayingOn("solana");

    if (solanaConnected && publicKey) {
      runSolanaPayment(token);
      return;
    }

    wantsSolanaPay.current = true;
    setStage("connecting");
    armConnectTimeout(() => {
      if (wantsSolanaPay.current) {
        wantsSolanaPay.current = false;
        fail(`${name} didn't respond — check for a popup (it can open behind this window), or try again.`);
      }
    });

    // wallet-adapter persists the last chosen wallet in localStorage
    // (`walletName`), so on every visit after the first the adapter is
    // ALREADY selected at mount. select() is then a no-op, the effect above
    // never re-fires, and connect() never gets called — the wallet is never
    // actually asked to open, and this just sat on "connecting" until the
    // timeout. Connect straight away when it's already the active adapter.
    if (solanaWallet?.adapter.name === name) {
      connectSolana(name);
      return;
    }

    select(name);
  }

  // Clears the persisted wallet selection and drops any half-open session,
  // for when a wallet is wedged badly enough that reconnecting won't help.
  async function resetSolanaWallet() {
    wantsSolanaPay.current = false;
    connectingRef.current = false;
    clearConnectTimer();
    try {
      await disconnect();
    } catch {
      // Already disconnected — nothing to undo.
    }
    try {
      localStorage.removeItem("walletName");
    } catch {
      // Storage blocked; the disconnect above is the part that matters.
    }
    setStage("choose-wallet");
    setPayingOn(null);
    setError("");
  }

  // ---- EVM ----

  async function runEvmPayment(chosenToken: TokenSymbol) {
    setError("");
    // Pay on whatever chain the wallet is already on, as long as it carries
    // the chosen token — no chain picker, no mismatch possible. Only fall
    // back (and prompt a switch) if they're somewhere we don't accept.
    const supported = evmChainsForToken(chosenToken);
    const current = evmChainId ? CHAIN_ID_TO_KEY[evmChainId] : undefined;
    const target = current && supported.includes(current) ? current : FALLBACK_EVM_CHAIN[chosenToken];

    setPayingOn(target);
    setStage("paying");
    try {
      const hash = await payEvmToken(target, chosenToken, treasury.evm as `0x${string}`, amountUsd);
      await confirmWithServer(target, chosenToken, hash);
    } catch (err) {
      fail((err as Error).message);
    }
  }

  function startEvm() {
    if (!token) return;
    setError("");
    wantsEvmPay.current = true;
    if (evmConnected) {
      runEvmPayment(token);
      return;
    }

    // RainbowKit only hands over openConnectModal once its provider is
    // mounted and no other modal owns the screen. Optional-chaining a
    // missing one away would silently do nothing and then sit on
    // "connecting" until the timeout — say so immediately instead.
    if (!openConnectModal) {
      wantsEvmPay.current = false;
      fail("Wallet chooser isn't ready yet — give it a second and try again.");
      return;
    }

    setStage("connecting");
    openConnectModal();
    armConnectTimeout(() => {
      if (wantsEvmPay.current) {
        wantsEvmPay.current = false;
        fail("Wallet connection didn't complete — check for a popup, or try again.");
      }
    });
  }

  useEffect(() => {
    if (wantsEvmPay.current && evmConnected && token) {
      wantsEvmPay.current = false;
      clearConnectTimer();
      runEvmPayment(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evmConnected]);

  // Closing the connect modal without connecting shouldn't strand the UI on
  // "connecting".
  useEffect(() => {
    if (prevModalOpen.current && !connectModalOpen && !evmConnected && wantsEvmPay.current) {
      wantsEvmPay.current = false;
      fail("Wallet connection cancelled.");
    }
    prevModalOpen.current = connectModalOpen ?? false;
  }, [connectModalOpen, evmConnected]);

  // ---- render ----

  function reset() {
    wantsSolanaPay.current = false;
    wantsEvmPay.current = false;
    clearConnectTimer();
    setStage("choose-token");
    setToken(null);
    setPayingOn(null);
    setError("");
  }

  function backToWallets() {
    wantsSolanaPay.current = false;
    wantsEvmPay.current = false;
    clearConnectTimer();
    setStage("choose-wallet");
    setPayingOn(null);
    setError("");
  }

  if (stage === "done") {
    if (listing) return <ListingEditor bidId={bidId} listing={listing} />;
    return <p className="text-center font-semibold text-green">Payment confirmed — you&apos;re on the board.</p>;
  }

  if (stage === "choose-token") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-ink-soft">Pay ${amountUsd} — choose a stablecoin</p>
        <div className="flex flex-wrap justify-center gap-3">
          {(["USDC", "USDT"] as TokenSymbol[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setToken(t);
                setStage("choose-wallet");
              }}
              className="glass flex flex-col items-center gap-1.5 rounded-2xl px-8 py-4 hover:border-blue"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <TokenIcon token={t} />
                {t}
              </span>
              <span className="text-[11px] text-ink-faint">
                {chainsForToken(t)
                  .map((c) => CHAIN_LABELS[c])
                  .join(" · ")}
              </span>
            </button>
          ))}
        </div>
        <p className="max-w-sm text-center text-xs text-ink-faint">
          We use whichever of those networks your wallet is already on — no chain
          picker needed.
        </p>
      </div>
    );
  }

  if (stage === "choose-wallet" && token) {
    const solanaWallets = wallets.filter(
      (w) =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable
    );

    return (
      <div className="flex flex-col items-center gap-5">
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          Pay ${amountUsd} in <TokenIcon token={token} size={16} /> {token} — connect a wallet
        </p>

        <div className="flex w-full max-w-sm flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Solana</p>
          {solanaWallets.length > 0 ? (
            solanaWallets.map((w) => (
              <button
                key={w.adapter.name}
                onClick={() => pickSolanaWallet(w.adapter.name)}
                className="glass flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold text-ink hover:border-blue"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.adapter.icon} alt="" className="h-5 w-5 rounded" />
                {w.adapter.name}
              </button>
            ))
          ) : (
            <p className="text-xs text-ink-faint">
              No Solana wallet detected — install Phantom, Solflare, or Backpack.
            </p>
          )}
        </div>

        <div className="flex w-full max-w-sm flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Ethereum · Base · BNB Chain · Polygon
          </p>
          <button
            onClick={startEvm}
            className="glass rounded-2xl px-5 py-3 text-sm font-semibold text-ink hover:border-blue"
          >
            MetaMask, Rainbow, Trust &amp; more
          </button>
        </div>

        <button onClick={reset} className="text-xs text-ink-faint hover:text-ink">
          ← pay in a different stablecoin
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        Paying ${amountUsd} in {token && <TokenIcon token={token} size={16} />} {token}
        {payingOn ? ` on ${CHAIN_LABELS[payingOn]}` : ""}
      </p>
      {stage === "connecting" && (
        <p className="text-sm text-ink-faint">Waiting for your wallet to connect…</p>
      )}
      {stage === "paying" && <p className="text-sm text-ink-faint">Confirm the transfer in your wallet…</p>}
      {stage === "confirming" && <p className="text-sm text-ink-faint">Confirming on-chain…</p>}
      {(stage === "connecting" || stage === "paying") && (
        <button onClick={backToWallets} className="text-xs text-ink-faint hover:text-ink">
          Stuck? ← cancel and pick again
        </button>
      )}
      {error && (
        <>
          <p className="max-w-md text-center text-sm text-red-600">{error}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={reset} className="text-xs text-ink-faint hover:text-ink">
              ← try again
            </button>
            <button onClick={resetSolanaWallet} className="text-xs text-ink-faint hover:text-ink">
              reset wallet connection
            </button>
          </div>
        </>
      )}
    </div>
  );
}
