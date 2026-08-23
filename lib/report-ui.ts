export type SortDirection = "asc" | "desc";

export type ReportOperation = {
  id: string;
  action: "create" | "share" | "download";
  label: string;
  createdAt: string;
};

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

export function createReportOperation(
  action: ReportOperation["action"],
  createdAt = new Date().toISOString(),
): ReportOperation {
  const labels: Record<ReportOperation["action"], string> = {
    create: "إنشاء تقرير",
    share: "مشاركة تقرير",
    download: "تنزيل تقرير",
  };
  return { id: `${action}-${createdAt}`, action, label: labels[action], createdAt };
}

export function appendReportOperation(
  history: ReportOperation[],
  operation: ReportOperation,
  limit = 12,
): ReportOperation[] {
  return [operation, ...history].slice(0, limit);
}

export function getStatusDurationLabel(durationMs: number): string {
  return durationMs >= 8000 ? "8 ثوانٍ" : durationMs >= 6000 ? "6 ثوانٍ" : "4 ثوانٍ";
}
