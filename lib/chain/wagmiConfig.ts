"use client";

import { createConfig, http } from "wagmi";
import { mainnet, base, bsc, polygon } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  trustWallet,
  okxWallet,
  zerionWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Curated EVM-only list, deliberately excluding `injectedWallet` (the
// generic "Browser Wallet" fallback) — Phantom announces itself as an EVM
// provider too and injectedWallet would surface it here, which belongs in
// the Solana group PayStep already lists it under instead.
//
// EIP-6963 discovery (multiInjectedProviderDiscovery) is left ON, not off.
// Each named connector below matches its own extension by EIP-6963 `rdns`,
// which is what actually works when several wallet extensions are
// installed at once — legacy window.ethereum.isMetaMask-style flag sniffing
// (what you fall back to with discovery off) breaks the moment more than
// one extension is fighting over that global. If a stuck connect ever
// happens now, PayStep's 30s timeout + cancel button gets you out of it.
//
// Coinbase Wallet is intentionally absent: its connector pulls in
// @coinbase/cdp-sdk's x402 client, which breaks the Turbopack build. Coinbase
// Wallet users can still connect through WalletConnect.
//
// walletConnectWallet's factory throws at module-eval time on an empty
// projectId, so it only joins the list once one is configured.
const wallets = [
  {
    groupName: "Popular",
    wallets: walletConnectProjectId
      ? [metaMaskWallet, rabbyWallet, rainbowWallet, trustWallet, okxWallet, zerionWallet, walletConnectWallet]
      : [metaMaskWallet, rabbyWallet, rainbowWallet, trustWallet, okxWallet, zerionWallet],
  },
];

const connectors = connectorsForWallets(wallets, {
  appName: "BidYourDapp!#1",
  projectId: walletConnectProjectId || "unconfigured",
});

export const wagmiConfig = createConfig({
  connectors,
  chains: [mainnet, base, bsc, polygon],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
  ssr: true,
});
