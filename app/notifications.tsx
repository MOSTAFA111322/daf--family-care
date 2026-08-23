import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { cancelWeeklySummaryNotification, getWeeklySummarySchedule, scheduleWeeklySummaryNotification, WEEKLY_SUMMARY_DAY_KEY, WEEKLY_SUMMARY_HOUR_KEY, WEEKLY_SUMMARY_MINUTE_KEY } from "@/lib/weekly-summary-notification";

const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const hours = [8, 10, 12, 18, 20, 21];
const minutes = [0, 15, 30, 45];
const deviceHourCycle = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle;
const uses24HourClock = deviceHourCycle === "h23" || deviceHourCycle === "h24";
const formatTime = (hour: number, minute: number) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12: !uses24HourClock }).format(new Date(2020, 0, 1, hour, minute));

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [weekday, setWeekday] = useState(6);
  const [hour, setHour] = useState(20);
  const [minute, setMinute] = useState(0);
  const [customTime, setCustomTime] = useState("20:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem("dafء-weekly-summary"), getWeeklySummarySchedule()]).then(([stored, schedule]) => {
      setEnabled(stored !== "false");
      setWeekday(schedule.weekday);
      setHour(schedule.hour);
      setMinute(schedule.minute ?? 0);
      setCustomTime(`${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute ?? 0).padStart(2, "0")}`);
    });
  }, []);

  const applySchedule = async (next: { weekday: number; hour: number; minute: number }) => {
    setWeekday(next.weekday);
    setHour(next.hour);
    setMinute(next.minute);
    setCustomTime(`${String(next.hour).padStart(2, "0")}:${String(next.minute).padStart(2, "0")}`);
    await AsyncStorage.multiSet([[WEEKLY_SUMMARY_DAY_KEY, String(next.weekday)], [WEEKLY_SUMMARY_HOUR_KEY, String(next.hour)], [WEEKLY_SUMMARY_MINUTE_KEY, String(next.minute)] ]);
    if (!enabled) return;
    setBusy(true);
    const scheduled = await scheduleWeeklySummaryNotification(next);
    setBusy(false);
    if (!scheduled) Alert.alert("تعذر تحديث الإشعار", "اسمح بالإشعارات من إعدادات الجهاز ثم حاول مرة أخرى.");
  };

  const applyCustomTime = () => {
    const match = customTime.trim().match(/^(\d{1,2})[:.](\d{1,2})$/);
    if (!match) { Alert.alert("وقت غير صالح", "اكتب الوقت بصيغة ساعة:دقيقة مثل 20:30."); return; }
    const nextHour = Number(match[1]);
    const nextMinute = Number(match[2]);
    if (nextHour > 23 || nextMinute > 59) { Alert.alert("وقت غير صالح", "يجب أن تكون الساعة بين 00 و23 والدقائق بين 00 و59."); return; }
    void applySchedule({ weekday, hour: nextHour, minute: nextMinute });
  };

  const handleNativeTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (event.type === "dismissed" || !selected) return;
    const nextHour = selected.getHours();
    const nextMinute = selected.getMinutes();
    void applySchedule({ weekday, hour: nextHour, minute: nextMinute });
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

  return <ScreenContainer className="px-5 pt-4"><Stack.Screen options={{ headerShown: false }} /><ScrollView contentContainerStyle={styles.content}><View className="flex-row items-center justify-between mb-7"><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={22} color={colors.foreground} /></Pressable><View className="items-end"><Text className="text-sm text-muted">التحكم والتنبيهات</Text><Text className="text-3xl font-bold text-foreground">الإشعارات</Text></View><View style={[styles.icon, { backgroundColor: colors.primary }]}><MaterialIcons name="notifications" size={21} color="white" /></View></View><View style={[styles.hero, { backgroundColor: "#F6DED0" }]}><Text className="text-lg font-bold text-foreground">ملخص أسبوعي بلطف</Text><Text className="text-sm text-muted mt-2 leading-5">اختر وقتًا مناسبًا لتذكيرك بمراجعة مشاعر الأسرة. الإشعار محلي ولا يغادر جهازك.</Text></View><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.row}><View className="flex-1"><Text className="text-base font-bold text-foreground">تفعيل الملخص الأسبوعي</Text><Text className="text-sm text-muted mt-1">يُرسل تذكيرًا واحدًا كل أسبوع</Text></View><Switch value={enabled} onValueChange={toggle} disabled={busy} trackColor={{ false: colors.border, true: colors.primary }} /></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><Text className="text-sm font-bold text-muted mb-3">اليوم</Text><View style={styles.options}>{days.map((day, index) => <Pressable key={day} onPress={() => applySchedule({ weekday: index + 1, hour, minute })} style={[styles.option, weekday === index + 1 && { backgroundColor: colors.primary }]}><Text style={[styles.optionText, { color: weekday === index + 1 ? "white" : colors.foreground }]}>{day}</Text></Pressable>)}</View><Text className="text-sm font-bold text-muted mt-5 mb-3">الساعة</Text><View style={styles.options}>{hours.map((value) => <Pressable key={value} onPress={() => applySchedule({ weekday, hour: value, minute })} style={[styles.option, hour === value && { backgroundColor: colors.primary }]}><Text style={[styles.optionText, { color: hour === value ? "white" : colors.foreground }]}>{String(value).padStart(2, "0")}:00</Text></Pressable>)}</View><Text className="text-sm font-bold text-muted mt-5 mb-3">الدقائق</Text><View style={styles.options}>{minutes.map((value) => <Pressable key={value} onPress={() => applySchedule({ weekday, hour, minute: value })} style={[styles.option, minute === value && { backgroundColor: colors.primary }]}><Text style={[styles.optionText, { color: minute === value ? "white" : colors.foreground }]}>{String(value).padStart(2, "0")}</Text></Pressable>)}</View><Text className="text-sm font-bold text-muted mt-5 mb-3">وقت مخصص</Text>{Platform.OS === "web" ? <View style={styles.customTimeRow}><TextInput value={customTime} onChangeText={setCustomTime} onSubmitEditing={applyCustomTime} returnKeyType="done" keyboardType="numbers-and-punctuation" maxLength={5} placeholder="20:30" placeholderTextColor={colors.muted} style={[styles.timeInput, { borderColor: colors.border, color: colors.foreground }]} /><Pressable onPress={applyCustomTime} style={[styles.applyButton, { backgroundColor: colors.primary }]}><Text className="text-white font-bold">حفظ الوقت</Text></Pressable></View> : <><Pressable onPress={() => setShowTimePicker(true)} style={[styles.nativeTimeButton, { borderColor: colors.primary }]}><MaterialIcons name="schedule" size={20} color={colors.primary} /><Text className="text-primary font-bold mr-2">اختيار الوقت: {formatTime(hour, minute)}</Text></Pressable>{showTimePicker && <DateTimePicker value={new Date(2020, 0, 1, hour, minute)} mode="time" is24Hour={uses24HourClock} onChange={handleNativeTimeChange} />}</>}<Text className="text-xs text-muted mt-3 text-right">موعد الإشعار الحالي: {formatTime(hour, minute)}</Text><View style={[styles.note, { backgroundColor: "#E5EBD9" }]}><MaterialIcons name="lock-outline" size={18} color={colors.success} /><Text className="flex-1 text-xs text-muted mr-2 leading-5">يُحفظ يوم ووقت الإشعار محليًا. يمكنك إيقافه في أي وقت.</Text></View></View></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingBottom: 40 }, back: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(233,222,212,0.65)", alignItems: "center", justifyContent: "center" }, icon: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center" }, hero: { borderRadius: 21, padding: 18, marginBottom: 14 }, card: { borderRadius: 22, borderWidth: 1, padding: 16 }, row: { flexDirection: "row", alignItems: "center", minHeight: 60 }, divider: { height: 1, marginVertical: 12 }, options: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }, option: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 13, backgroundColor: "#F3EAE4" }, optionText: { fontSize: 13, fontWeight: "700" },   customTimeRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 }, nativeTimeButton: { minHeight: 50, borderWidth: 1, borderRadius: 13, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center" }, timeInput: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, textAlign: "right", fontSize: 16 }, applyButton: { minHeight: 48, borderRadius: 13, paddingHorizontal: 15, alignItems: "center", justifyContent: "center" }, note: { flexDirection: "row-reverse", alignItems: "center", borderRadius: 14, padding: 12, marginTop: 20 } });
