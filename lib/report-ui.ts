export type SortDirection = "asc" | "desc";

export function toggleSortDirection(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}

export function isStatusMessageVisible(
  message: string | null,
  expiresAt: number | null,
  now = Date.now(),
): boolean {
  return Boolean(message && expiresAt && expiresAt > now);
}

export function dismissStatusMessage(): null {
  return null;
}

export function getStatusExpiry(now = Date.now(), durationMs = 4500): number {
  return now + durationMs;
}
