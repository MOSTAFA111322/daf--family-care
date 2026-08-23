import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cancelWeeklySummaryNotification, getWeeklySummarySchedule, scheduleWeeklySummaryNotification, WEEKLY_SUMMARY_DAY_KEY, WEEKLY_SUMMARY_HOUR_KEY, WEEKLY_SUMMARY_MINUTE_KEY } from "@/lib/weekly-summary-notification";

const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const hours = [8, 10, 12, 18, 20, 21];
const minutes = [0, 15, 30, 45];

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [weekday, setWeekday] = useState(6);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem("dafء-weekly-summary"), getWeeklySummarySchedule()]).then(([stored, schedule]) => {
      setEnabled(stored !== "false");
      setWeekday(schedule.weekday);
      setHour(schedule.hour);
      setMinute(schedule.minute ?? 0);
    });
  }, []);

  const applySchedule = async (next: { weekday: number; hour: number; minute: number }) => {
    setWeekday(next.weekday);
    setHour(next.hour);
    setMinute(next.minute);
    await AsyncStorage.multiSet([[WEEKLY_SUMMARY_DAY_KEY, String(next.weekday)], [WEEKLY_SUMMARY_HOUR_KEY, String(next.hour)], [WEEKLY_SUMMARY_MINUTE_KEY, String(next.minute)] ]);
    if (!enabled) return;
    setBusy(true);
    const scheduled = await scheduleWeeklySummaryNotification(next);
    setBusy(false);
    if (!scheduled) Alert.alert("تعذر تحديث الإشعار", "اسمح بالإشعارات من إعدادات الجهاز ثم حاول مرة أخرى.");
  };

  const toggle = async (value: boolean) => {
    setBusy(true);
    if (value) {
      const scheduled = await scheduleWeeklySummaryNotification({ weekday, hour, minute });
      if (!scheduled) {
        setBusy(false);
        Alert.alert("تعذر تفعيل الإشعار", "اسمح بالإشعارات من إعدادات الجهاز ثم حاول مرة أخرى.");
        return;
      }
    } else {
      await cancelWeeklySummaryNotification();
    }
    await AsyncStorage.setItem("dafء-weekly-summary", String(value));
    setEnabled(value);
    setBusy(false);
  };

  return <ScreenContainer className="px-5 pt-4"><Stack.Screen options={{ headerShown: false }} /><ScrollView contentContainerStyle={styles.content}><View className="flex-row items-center justify-between mb-7"><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={22} color={colors.foreground} /></Pressable><View className="items-end"><Text className="text-sm text-muted">التحكم والتنبيهات</Text><Text className="text-3xl font-bold text-foreground">الإشعارات</Text></View><View style={[styles.icon, { backgroundColor: colors.primary }]}><MaterialIcons name="notifications" size={21} color="white" /></View></View><View style={[styles.hero, { backgroundColor: "#F6DED0" }]}><Text className="text-lg font-bold text-foreground">ملخص أسبوعي بلطف</Text><Text className="text-sm text-muted mt-2 leading-5">اختر وقتًا مناسبًا لتذكيرك بمراجعة مشاعر الأسرة. الإشعار محلي ولا يغادر جهازك.</Text></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.row}><View className="flex-1"><Text className="text-base font-bold text-foreground">تفعيل الملخص الأسبوعي</Text><Text className="text-sm text-muted mt-1">يُرسل تذكيرًا واحدًا كل أسبوع</Text></View><Switch value={enabled} onValueChange={toggle} disabled={busy} trackColor={{ false: colors.border, true: colors.primary }} /></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><Text className="text-sm font-bold text-muted mb-3">اليوم</Text><View style={styles.options}>{days.map((day, index) => <Pressable key={day} onPress={() => applySchedule({ weekday: index + 1, hour, minute })} style={[styles.option, weekday === index + 1 && { backgroundColor: colors.primary }]}><Text style={[styles.optionText, { color: weekday === index + 1 ? "white" : colors.foreground }]}>{day}</Text></Pressable>)}</View><Text className="text-sm font-bold text-muted mt-5 mb-3">الساعة</Text><View style={styles.options}>{hours.map((value) => <Pressable key={value} onPress={() => applySchedule({ weekday, hour: value, minute })} style={[styles.option, hour === value && { backgroundColor: colors.primary }]}><Text style={[styles.optionText, { color: hour === value ? "white" : colors.foreground }]}>{String(value).padStart(2, "0")}:00</Text></Pressable>)}</View><Text className="text-sm font-bold text-muted mt-5 mb-3">الدقائق</Text><View style={styles.options}>{minutes.map((value) => <Pressable key={value} onPress={() => applySchedule({ weekday, hour, minute: value })} style={[styles.option, minute === value && { backgroundColor: colors.primary }]}><Text style={[styles.optionText, { color: minute === value ? "white" : colors.foreground }]}>{String(value).padStart(2, "0")}</Text></Pressable>)}</View><Text className="text-xs text-muted mt-3 text-right">موعد الإشعار الحالي: {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}</Text><View style={[styles.note, { backgroundColor: "#E5EBD9" }]}><MaterialIcons name="lock-outline" size={18} color={colors.success} /><Text className="flex-1 text-xs text-muted mr-2 leading-5">يُحفظ يوم ووقت الإشعار محليًا. يمكنك إيقافه في أي وقت.</Text></View></View></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingBottom: 40 }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(233,222,212,0.65)", alignItems: "center", justifyContent: "center" }, icon: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center" }, hero: { borderRadius: 21, padding: 18, marginBottom: 14 }, card: { borderRadius: 22, borderWidth: 1, padding: 16 }, row: { flexDirection: "row", alignItems: "center", minHeight: 60 }, divider: { height: 1, marginVertical: 12 }, options: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }, option: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, backgroundColor: "#F3EAE4" }, optionText: { fontSize: 13, fontWeight: "700" }, note: { flexDirection: "row-reverse", alignItems: "center", borderRadius: 14, padding: 12, marginTop: 20 } });
