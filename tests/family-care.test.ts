import { describe, expect, it } from "vitest";

import { buildFamilyReportHtml, calculateWeeklySummary } from "../lib/family-care";
import { appendReportOperation, clearReportOperations, createReportOperation, DEFAULT_REPORT_STATUS_DURATIONS, dismissStatusMessage, filterReportOperations, getReportStatusDuration, getStatusExpiry, isStatusMessageVisible, removeReportOperation, toggleSortDirection } from "../lib/report-ui";

describe("family care analytics", () => {
  it("updates the weekly family summary after a new mood entry", () => {
    const now = new Date("2026-08-23T12:00:00");
    const summary = calculateWeeklySummary([
      { entries: [{ mood: "سعيد", score: 5, date: "2026-08-23" }] },
      { entries: [{ mood: "متعب", score: 2, date: "2026-08-20" }] },
    ], now);

    expect(summary.recorded).toBe(2);
    expect(summary.membersWithEntries).toBe(2);
    expect(summary.average).toBe(3.5);
  });

  it("ignores entries outside the last seven days and supports empty data", () => {
    const now = new Date("2026-08-23T12:00:00");
    expect(calculateWeeklySummary([
      { entries: [{ mood: "قلق", score: 1, date: "2026-08-15" }] },
    ], now)).toEqual({ recorded: 0, average: 0, membersWithEntries: 0 });
  });

  it("toggles report sort direction and dismisses status feedback", () => {
    expect(toggleSortDirection("asc")).toBe("desc");
    expect(toggleSortDirection("desc")).toBe("asc");

    const now = 1_000;
    const expiresAt = getStatusExpiry(now, 4_500);
    expect(isStatusMessageVisible("تم تجهيز التقرير", expiresAt, now + 100)).toBe(true);
    expect(isStatusMessageVisible("تم تجهيز التقرير", expiresAt, now + 4_500)).toBe(false);
    expect(dismissStatusMessage()).toBeNull();
  });

  it("uses an independent duration for each report action and clears the log", () => {
    expect(getReportStatusDuration("create", DEFAULT_REPORT_STATUS_DURATIONS)).toBe(4500);
    expect(getReportStatusDuration("share", DEFAULT_REPORT_STATUS_DURATIONS)).toBe(6000);
    expect(getReportStatusDuration("download", DEFAULT_REPORT_STATUS_DURATIONS)).toBe(8000);
    const operation = createReportOperation("share", "2026-08-23T12:00:00.000Z");
    expect(appendReportOperation([], operation)).toEqual([operation]);
    expect(clearReportOperations()).toEqual([]);
  });

  it("filters report operations by action and time period and removes one operation", () => {
    const now = new Date("2026-08-23T12:00:00.000Z").getTime();
    const create = createReportOperation("create", "2026-08-23T10:00:00.000Z");
    const share = createReportOperation("share", "2026-08-10T10:00:00.000Z");
    const download = createReportOperation("download", "2026-08-22T10:00:00.000Z");
    const history = [create, share, download];

    expect(filterReportOperations(history, "create", "all", now)).toEqual([create]);
    expect(filterReportOperations(history, "all", "7days", now)).toEqual([create, download]);
    expect(filterReportOperations(history, "all", "today", now)).toEqual([create]);
    expect(removeReportOperation(history, share.id)).toEqual([create, download]);
    expect(removeReportOperation(history, "missing")).toEqual(history);
  });

  it("builds a safe family report even when a member has no entries", () => {
    const html = buildFamilyReportHtml([
      { id: "1", name: "سارة & عمر", role: "الأسرة", mood: "هادئة", note: "ملاحظة" },
      { id: "2", name: "ليان", role: "الابنة", mood: "سعيدة", note: "" },
    ], {
      "1": [{ mood: "سعيد", score: 5, date: "2026-08-23" }],
      "2": [],
    }, "أغسطس 2026", [createReportOperation("download", "2026-08-23T12:00:00.000Z")]);

    expect(html).toContain("سارة &amp; عمر");
    expect(html).toContain("لا توجد بيانات");
    expect(html).toContain("عدد التسجيلات: 1");
    expect(html).toContain("تنزيل تقرير");
    expect(html).toContain("2026");
  });
});
