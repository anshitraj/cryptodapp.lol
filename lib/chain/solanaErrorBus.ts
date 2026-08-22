type Handler = (err: Error) => void;

let handler: Handler | null = null;

// wallet-adapter swallows adapter errors into WalletProvider's onError rather
// than rejecting the connect() promise the caller awaited, so a failure like
// "Local Network Access permission denied" never reaches the component that
// asked to connect — it just sits there until a timeout. This hands those
// errors back to whoever is currently driving a connection.
export function setSolanaErrorHandler(next: Handler | null) {
  handler = next;
}

export function emitSolanaError(err: Error) {
  handler?.(err);
}
