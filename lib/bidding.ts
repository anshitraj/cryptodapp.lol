export const MIN_BID_USD = 1;

/**
 * The board uses whole-dollar bid increments. A bid equal to the leader does
 * not take #1, so the displayed price must always be the next dollar above it.
 */
export function nextTopBidUsd(currentHighestUsd: number | null | undefined): number {
  const current = Number(currentHighestUsd);

  if (!Number.isFinite(current)) return MIN_BID_USD;

  return Math.max(MIN_BID_USD, Math.floor(current) + 1);
}
