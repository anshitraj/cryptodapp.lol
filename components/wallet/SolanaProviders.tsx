"use client";

import { useCallback, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { solanaRpcUrlPublic } from "@/lib/chain/constants";
import { emitSolanaError } from "@/lib/chain/solanaErrorBus";

// Wallet Standard wallets (Phantom, Solflare, Backpack, etc) register
// themselves automatically — nothing needed in the `wallets` array below.
export default function SolanaProviders({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => solanaRpcUrlPublic(), []);

  // Without this, adapter failures vanish into wallet-adapter's default
  // console-only handler and the UI waits on a connection that already died.
  const onError = useCallback((err: Error) => {
    console.error("[solana wallet]", err);
    emitSolanaError(err);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect={false} onError={onError}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
