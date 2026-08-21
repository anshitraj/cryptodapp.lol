export function formatUsd(amount: number): string {
  if (amount >= 1000) {
    return `$${Math.round(amount).toLocaleString("en-US")}`;
  }
  return `$${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const units: [string, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value} ${label}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function hoursSince(iso: string): number {
  return Math.max(1, (Date.now() - new Date(iso).getTime()) / 3600000);
}
