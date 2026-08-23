export type SortDirection = "asc" | "desc";
export type ReportAction = "create" | "share" | "download";
export type ReportStatusDurations = Record<ReportAction, number>;
export type ReportLogActionFilter = "all" | ReportAction;
export type ReportLogPeriodFilter = "all" | "today" | "7days" | "30days" | "custom";
export type ReportLogCustomRange = { from: string; to: string };

export type ReportOperation = {
  id: string;
  action: ReportAction;
  label: string;
  createdAt: string;
};

export const DEFAULT_REPORT_STATUS_DURATIONS: ReportStatusDurations = { create: 4500, share: 6000, download: 8000 };
export const REPORT_STATUS_DURATION_OPTIONS = [4500, 6000, 8000] as const;

export function toggleSortDirection(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}

export function isStatusMessageVisible(message: string | null, expiresAt: number | null, now = Date.now()): boolean {
  return Boolean(message && expiresAt && expiresAt > now);
}

export function dismissStatusMessage(): null {
  return null;
}

export function getStatusExpiry(now = Date.now(), durationMs = 4500): number {
  return now + durationMs;
}

export function isReportStatusDuration(value: number): value is (typeof REPORT_STATUS_DURATION_OPTIONS)[number] {
  return REPORT_STATUS_DURATION_OPTIONS.includes(value as (typeof REPORT_STATUS_DURATION_OPTIONS)[number]);
}

export function getReportStatusDuration(action: ReportAction, durations: ReportStatusDurations): number {
  return isReportStatusDuration(durations[action]) ? durations[action] : DEFAULT_REPORT_STATUS_DURATIONS[action];
}

export function createReportOperation(action: ReportAction, createdAt = new Date().toISOString()): ReportOperation {
  const labels: Record<ReportAction, string> = { create: "إنشاء تقرير", share: "مشاركة تقرير", download: "تنزيل تقرير" };
  return { id: `${action}-${createdAt}`, action, label: labels[action], createdAt };
}

export function appendReportOperation(history: ReportOperation[], operation: ReportOperation, limit = 12): ReportOperation[] {
  return [operation, ...history].slice(0, limit);
}

export function clearReportOperations(): ReportOperation[] {
  return [];
}

export function removeReportOperation(history: ReportOperation[], operationId: string): ReportOperation[] {
  return history.filter((operation) => operation.id !== operationId);
}

export function filterReportOperations(
  history: ReportOperation[],
  action: ReportLogActionFilter = "all",
  period: ReportLogPeriodFilter = "all",
  now = Date.now(),
  customRange: ReportLogCustomRange = { from: "", to: "" },
): ReportOperation[] {
  const reference = new Date(now);
  const startOfToday = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate()).getTime();
  let cutoff: number | null = period === "today" ? startOfToday : period === "7days" ? now - 7 * 24 * 60 * 60 * 1000 : period === "30days" ? now - 30 * 24 * 60 * 60 * 1000 : null;
  let customEnd: number | null = null;
  if (period === "custom") {
    const from = Date.parse(`${customRange.from}T00:00:00`);
    const to = Date.parse(`${customRange.to}T23:59:59.999`);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) return [];
    cutoff = from;
    customEnd = to;
  }
  return history.filter((operation) => {
    if (action !== "all" && operation.action !== action) return false;
    if (cutoff === null) return true;
    const timestamp = Date.parse(operation.createdAt);
    return Number.isFinite(timestamp) && timestamp >= cutoff && (customEnd === null || timestamp <= customEnd);
  });
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function buildReportOperationsCsv(history: ReportOperation[]): string {
  const header = ["المعرّف", "العملية", "التاريخ"].map(escapeCsvCell).join(",");
  const rows = history.map((operation) => [operation.id, operation.label, operation.createdAt].map(escapeCsvCell).join(","));
  return `\uFEFF${[header, ...rows].join("\n")}\n`;
}

export function getStatusDurationLabel(durationMs: number): string {
  return durationMs >= 8000 ? "8 ثوانٍ" : durationMs >= 6000 ? "6 ثوانٍ" : "4 ثوانٍ";
}
