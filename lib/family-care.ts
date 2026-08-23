export type FamilyReportMember = {
  id: string;
  name: string;
  role: string;
  mood: string;
  note: string;
};

export type FamilyReportMood = {
  mood: string;
  score: number;
  date: string;
};

export type WeeklySummary = {
  recorded: number;
  average: number;
  membersWithEntries: number;
};

export function getRecentMoodEntries(entries: FamilyReportMood[], now = new Date()): FamilyReportMood[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return entries.filter((entry) => {
    const date = new Date(`${entry.date}T12:00:00`);
    return date >= start && date <= now;
  });
}

export function calculateWeeklySummary(
  histories: Array<{ entries: FamilyReportMood[] }>,
  now = new Date(),
): WeeklySummary {
  const recentByMember = histories.map(({ entries }) => getRecentMoodEntries(entries, now));
  const entries = recentByMember.flat();
  return {
    recorded: entries.length,
    average: entries.length ? entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length : 0,
    membersWithEntries: recentByMember.filter((memberEntries) => memberEntries.length > 0).length,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export function buildFamilyReportHtml(
  members: FamilyReportMember[],
  histories: Record<string, FamilyReportMood[]>,
  periodLabel: string,
): string {
  const rows = members.map((member) => {
    const entries = histories[member.id] ?? [];
    const average = entries.length ? entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length : 0;
    const latest = entries[entries.length - 1];
    return `<tr><td>${escapeHtml(member.name)}</td><td>${escapeHtml(member.role)}</td><td>${latest ? escapeHtml(latest.mood) : "لا توجد بيانات"}</td><td>${average ? average.toFixed(1) : "—"}</td><td>${escapeHtml(member.note || "—")}</td></tr>`;
  }).join("");
  const totalEntries = Object.values(histories).reduce((total, entries) => total + entries.length, 0);
  const average = totalEntries ? Object.values(histories).flat().reduce((sum, entry) => sum + entry.score, 0) / totalEntries : 0;
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:Arial;color:#352D2A;padding:28px}h1{color:#8D5E4D}h2{margin-top:26px}table{width:100%;border-collapse:collapse}th,td{padding:9px;border-bottom:1px solid #eadfd8;text-align:right}th{background:#F6DED0} .metric{display:inline-block;background:#FFF0E8;padding:12px;margin:4px;border-radius:10px}</style></head><body><h1>تقرير دفء — ملخص الأسرة</h1><p>الفترة: ${escapeHtml(periodLabel)}</p><div class="metric">عدد الأفراد: ${members.length}</div><div class="metric">عدد التسجيلات: ${totalEntries}</div><div class="metric">متوسط الأسرة: ${average ? average.toFixed(1) : "—"} من 5</div><h2>نظرة عامة على الأسرة</h2><table><tr><th>الفرد</th><th>صلة القرابة</th><th>آخر شعور</th><th>المتوسط</th><th>آخر ملاحظة</th></tr>${rows || "<tr><td colspan=5>لا توجد بيانات</td></tr>"}</table><p style="margin-top:28px;color:#7b6b63">هذا التقرير محلي ومختصر، وقد تم إنشاؤه من البيانات المحفوظة على جهازك.</p></body></html>`;
}
