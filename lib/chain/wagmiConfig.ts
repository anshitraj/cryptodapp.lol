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

// Curated EVM-only list, deliberately excluding both `injectedWallet` and
// EIP-6963 auto-discovery (see multiInjectedProviderDiscovery below).
// Discovery surfaced Phantom in the EVM connect modal — Phantom announces
// itself as an EVM provider, so it looked like a valid choice here and then
// stalled on connect. Phantom belongs in the Solana group instead, which is
// where PayStep now lists it.
//
// Coinbase Wallet is also intentionally absent: its connector pulls in
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
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
  ssr: true,
});
