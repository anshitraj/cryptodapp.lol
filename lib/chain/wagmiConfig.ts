"use client";

import { createConfig, http } from "wagmi";
import { mainnet, base, bsc, polygon } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Hand-picked wallet list instead of RainbowKit's getDefaultConfig(): its
// default set pulls in Coinbase's "Base Account" connector, which drags in
// @coinbase/cdp-sdk's x402 client and breaks the Turbopack build. Injected +
// WalletConnect covers essentially every wallet anyway — Coinbase Wallet's
// mobile app still connects fine through WalletConnect.
//
// walletConnectWallet's own factory throws at construction time if given an
// empty projectId (crashing every page via the shared layout import), so it
// only gets included once a real one is configured — until then, injected
// wallets (MetaMask/Rabby/etc extensions) still work fine on desktop.
const wallets = [
  {
    groupName: "Popular",
    wallets: walletConnectProjectId
      ? [injectedWallet, metaMaskWallet, rainbowWallet, trustWallet, walletConnectWallet]
      : [injectedWallet, metaMaskWallet, rainbowWallet, trustWallet],
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
