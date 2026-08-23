import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { buildFamilyReportHtml, type FamilyReportMember, type FamilyReportMood, getRecentMoodEntries } from "@/lib/family-care";

type ReportMember = FamilyReportMember & { id: string };

export default function FamilyReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const [members, setMembers] = useState<ReportMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [histories, setHistories] = useState<Record<string, FamilyReportMood[]>>({});
  const [periodType, setPeriodType] = useState<"weekly" | "monthly">("monthly");
  const [month, setMonth] = useState(new Date());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      const savedMembers = await AsyncStorage.getItem("dafء-members");
      const list: ReportMember[] = savedMembers ? JSON.parse(savedMembers) : [];
      const pairs = await Promise.all(list.map(async (member) => {
        const raw = await AsyncStorage.getItem(`dafء-moods-${member.id}`);
        return [member.id, raw ? (JSON.parse(raw) as FamilyReportMood[]) : []] as const;
      }));
      setMembers(list);
      setSelectedIds(list.map((member) => member.id));
      setHistories(Object.fromEntries(pairs));
    };
    load();
  }, []);

  const periodLabel = useMemo(() => periodType === "weekly" ? "آخر 7 أيام" : month.toLocaleDateString("ar-SA", { month: "long", year: "numeric" }), [month, periodType]);
  const filteredHistories = useMemo(() => Object.fromEntries(members.filter((member) => selectedIds.includes(member.id)).map((member) => {
    const entries = histories[member.id] ?? [];
    if (periodType === "weekly") return [member.id, getRecentMoodEntries(entries)];
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    return [member.id, entries.filter((entry) => entry.date.slice(0, 7) === key)];
  })), [histories, members, month, periodType, selectedIds]);

  const toggleMember = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const createPdf = async () => {
    setBusy(true);
    try {
      const html = buildFamilyReportHtml(members, filteredHistories, periodLabel);
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch {
      Alert.alert("تعذر إنشاء التقرير", "حاول مرة أخرى بعد التأكد من توفر مساحة كافية.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const shareReport = async () => {
    const uri = await createPdf();
    if (!uri) return;
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = uri;
      link.download = `dafء-تقرير-الأسرة-${periodType}.pdf`;
      link.click();
    } else if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "مشاركة تقرير الأسرة" });
    } else {
      await Print.printAsync({ uri });
    }
  };

  const downloadReport = async () => {
    const uri = await createPdf();
    if (!uri) return;
    if (Platform.OS === "web") {
      const link = document.createElement("a");
      link.href = uri;
      link.download = `dafء-تقرير-الأسرة-${periodType}.pdf`;
      link.click();
    } else if (FileSystem.cacheDirectory) {
      const target = `${FileSystem.cacheDirectory}dafء-family-report-${periodType}.pdf`;
      await FileSystem.copyAsync({ from: uri, to: target });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(target, { mimeType: "application/pdf", dialogTitle: "حفظ تقرير الأسرة" });
    }
  };

  return <ScreenContainer className="px-5 pt-4" containerClassName="bg-background"><Stack.Screen options={{ headerShown: false }} /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><View className="flex-row items-center justify-between mb-6"><Pressable onPress={() => router.back()} style={styles.backButton}><MaterialIcons name="arrow-forward" size={22} color={colors.foreground} /></Pressable><View className="items-end"><Text className="text-sm text-muted">ملف الأسرة</Text><Text className="text-3xl font-bold text-foreground">تقرير عائلي</Text></View><View style={[styles.headerIcon, { backgroundColor: colors.primary }]}><MaterialIcons name="summarize" size={21} color="white" /></View></View><View style={[styles.intro, { backgroundColor: "#F6DED0" }]}><Text className="text-base font-bold text-foreground">ملخص هادئ يساعدك على المتابعة</Text><Text className="text-sm text-muted mt-2 leading-5">يجمع التقرير آخر المشاعر والملاحظات لكل فرد في ملف واحد، ويبقى إنشاؤه محليًا على جهازك.</Text></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text className="text-sm font-bold text-muted mb-3">نطاق التقرير</Text><View style={styles.segment}><Pressable onPress={() => setPeriodType("monthly")} style={[styles.segmentButton, periodType === "monthly" && { backgroundColor: colors.primary }]}><Text style={[styles.segmentText, { color: periodType === "monthly" ? "white" : colors.foreground }]}>شهري</Text></Pressable><Pressable onPress={() => setPeriodType("weekly")} style={[styles.segmentButton, periodType === "weekly" && { backgroundColor: colors.primary }]}><Text style={[styles.segmentText, { color: periodType === "weekly" ? "white" : colors.foreground }]}>أسبوعي</Text></Pressable></View>{periodType === "monthly" && <View style={styles.monthPicker}><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><MaterialIcons name="chevron-right" size={24} color={colors.primary} /></Pressable><Text className="font-bold text-foreground">{periodLabel}</Text><Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><MaterialIcons name="chevron-left" size={24} color={colors.primary} /></Pressable></View>}<View style={styles.stats}><View style={[styles.stat, { backgroundColor: "#FFF0E8" }]}><Text className="text-xl font-bold text-primary">{members.length}</Text><Text className="text-xs text-muted mt-1">أفراد</Text></View><View style={[styles.stat, { backgroundColor: "#E5EBD9" }]}><Text className="text-xl font-bold text-foreground">{Object.values(filteredHistories).reduce((sum, entries) => sum + entries.length, 0)}</Text><Text className="text-xs text-muted mt-1">تسجيلات</Text></View></View></View><Text className="text-xl font-bold text-foreground mt-7 mb-3">الأفراد المشمولون</Text><View style={styles.selectionCard}>{members.map((member) => { const selected = selectedIds.includes(member.id); return <Pressable key={member.id} onPress={() => toggleMember(member.id)} style={[styles.selectionRow, selected && { borderColor: colors.primary, backgroundColor: "#FFF0E8" }]}><MaterialIcons name={selected ? "check-circle" : "radio-button-unchecked"} size={22} color={selected ? colors.primary : colors.muted} /><Text className="flex-1 text-sm font-bold text-foreground mr-2">{member.name}</Text><Text className="text-xs text-muted">{member.role}</Text></Pressable>; })}</View><Text className="text-xl font-bold text-foreground mt-7 mb-3">معاينة المحتوى</Text>{members.length ? members.map((member) => { const entries = filteredHistories[member.id] ?? []; const latest = entries[entries.length - 1]; return <View key={member.id} style={[styles.memberRow, { backgroundColor: colors.surface, borderColor: colors.border }]}><View className="flex-1 mr-3"><Text className="text-base font-bold text-foreground">{member.name}</Text><Text className="text-xs text-muted mt-1">{member.role} · {latest ? `آخر شعور: ${latest.mood}` : "لا توجد تسجيلات في الفترة"}</Text></View><Text className="text-sm font-bold text-primary">{entries.length ? `${(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length).toFixed(1)} / 5` : "—"}</Text></View>; }) : <View style={[styles.empty, { borderColor: colors.border }]}><Text className="text-sm text-muted">لا توجد أفراد محفوظون بعد.</Text></View>}<Pressable disabled={!selectedIds.length} onPress={() => setShowPreview(true)} style={[styles.previewButton, { borderColor: colors.primary }, !selectedIds.length && styles.disabled]}><MaterialIcons name="visibility" size={19} color={colors.primary} /><Text className="text-primary font-bold mr-2">معاينة التقرير</Text></Pressable><View style={styles.actions}><Pressable disabled={busy || !selectedIds.length} onPress={shareReport} style={[styles.primaryButton, { backgroundColor: colors.primary }, busy && styles.disabled]}><MaterialIcons name="share" size={19} color="white" /><Text className="text-white font-bold mr-2">مشاركة التقرير</Text></Pressable><Pressable disabled={busy} onPress={downloadReport} style={[styles.outlineButton, { borderColor: colors.primary }, busy && styles.disabled]}><MaterialIcons name="download" size={19} color={colors.primary} /><Text className="text-primary font-bold mr-2">تنزيل PDF</Text></Pressable></View></ScrollView><Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}><ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5 pt-4"><View className="flex-row items-center justify-between mb-5"><Pressable onPress={() => setShowPreview(false)} style={styles.back}><MaterialIcons name="close" size={22} color={colors.foreground} /></Pressable><Text className="text-2xl font-bold text-foreground">معاينة التقرير</Text><View style={{ width: 42 }} /></View><ScrollView showsVerticalScrollIndicator={false}><View style={[styles.previewPaper, { backgroundColor: colors.surface }]}><Text className="text-2xl font-bold text-foreground text-center">دفء — تقرير الأسرة</Text><Text className="text-sm text-muted text-center mt-2">{periodLabel}</Text><View style={[styles.previewDivider, { backgroundColor: colors.border }]} />{members.filter((member) => selectedIds.includes(member.id)).map((member) => { const entries = filteredHistories[member.id] ?? []; const average = entries.length ? entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length : 0; return <View key={member.id} style={styles.previewMember}><Text className="text-base font-bold text-foreground">{member.name}</Text><Text className="text-sm text-muted mt-1">{member.role}</Text><Text className="text-sm text-primary mt-2">{entries.length ? `المتوسط: ${average.toFixed(1)} من 5 · التسجيلات: ${entries.length}` : "لا توجد بيانات في هذه الفترة"}</Text></View>; })}</View><Pressable onPress={() => { setShowPreview(false); shareReport(); }} style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: 16 }]}><Text className="text-white font-bold">إنشاء ومشاركة PDF</Text></Pressable></ScrollView></ScreenContainer></Modal></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingBottom: 40 }, selectionCard: { gap: 8 }, selectionRow: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: "transparent", paddingHorizontal: 13, flexDirection: "row-reverse", alignItems: "center" }, previewButton: { minHeight: 50, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(233,222,212,0.65)", alignItems: "center", justifyContent: "center" }, previewPaper: { borderRadius: 18, padding: 20 }, previewDivider: { height: 1, marginVertical: 18 }, previewMember: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#E8DED7" }, backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(233,222,212,0.65)", alignItems: "center", justifyContent: "center" }, headerIcon: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center" }, intro: { borderRadius: 21, padding: 17, marginBottom: 14 }, card: { borderRadius: 22, borderWidth: 1, padding: 16 }, segment: { flexDirection: "row-reverse", backgroundColor: "#F3EAE4", borderRadius: 14, padding: 3, marginBottom: 12 }, segmentButton: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 11 }, segmentText: { fontSize: 14, fontWeight: "700" }, monthPicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "rgba(246,222,208,0.45)" }, stats: { flexDirection: "row", gap: 8, marginTop: 12 }, stat: { flex: 1, borderRadius: 16, padding: 13, alignItems: "center" }, memberRow: { minHeight: 70, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 9 }, empty: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: "center" }, actions: { gap: 9, marginTop: 18 }, primaryButton: { minHeight: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" }, outlineButton: { minHeight: 52, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" }, disabled: { opacity: 0.5 } });
