"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { solanaRpcUrlPublic } from "@/lib/chain/constants";

// Wallet Standard wallets (Phantom, Solflare, Backpack, etc) register
// themselves automatically — nothing needed in the `wallets` array below.
export default function SolanaProviders({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => solanaRpcUrlPublic(), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
