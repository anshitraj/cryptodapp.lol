/** Returns a dependable favicon endpoint for a listing URL, or null for invalid links. */
export function faviconFallbackUrl(link: string): string | null {
  try {
    const hostname = new URL(link).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return null;
  }
}
