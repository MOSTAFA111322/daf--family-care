import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, Switch, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const colors = useColors();
  const [lockEnabled, setLockEnabled] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  useEffect(() => { AsyncStorage.multiGet(["dafء-lock-enabled", "dafء-reminders-enabled"]).then((entries) => { setLockEnabled(entries[0][1] === "true"); setRemindersEnabled(entries[1][1] !== "false"); }); }, []);
  const toggleLock = async (value: boolean) => {
    if (Platform.OS === "web") { Alert.alert("الحماية متاحة على الجوال", "يمكن تفعيل Face ID أو البصمة عند فتح التطبيق على جهاز iPhone أو Android."); return; }
    if (value) { const hasHardware = await LocalAuthentication.hasHardwareAsync(); const enrolled = await LocalAuthentication.isEnrolledAsync(); if (!hasHardware || !enrolled) { Alert.alert("المصادقة غير متاحة", "فعّل Face ID أو البصمة على جهازك أولًا."); return; } const result = await LocalAuthentication.authenticateAsync({ promptMessage: "فعّل حماية دفء", fallbackLabel: "استخدم رمز الجهاز" }); if (!result.success) return; }
    setLockEnabled(value); await AsyncStorage.setItem("dafء-lock-enabled", String(value));
  };
  const toggleReminders = async (value: boolean) => { setRemindersEnabled(value); await AsyncStorage.setItem("dafء-reminders-enabled", String(value)); };
  return <ScreenContainer className="px-5 pt-4"><Text className="text-sm text-muted">التحكم والخصوصية</Text><Text className="text-3xl font-bold text-foreground mt-1 mb-7">الإعدادات</Text><View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text className="text-sm font-bold text-muted mb-3">الخصوصية</Text><View style={styles.row}><View style={[styles.icon, { backgroundColor: "#F6DED0" }]}><MaterialIcons name="lock-outline" size={22} color={colors.primary} /></View><View className="flex-1 mr-3"><Text className="text-base font-bold text-foreground">حماية التطبيق</Text><Text className="text-sm text-muted mt-1">Face ID أو البصمة عند العودة للتطبيق</Text></View><Switch value={lockEnabled} onValueChange={toggleLock} trackColor={{ false: colors.border, true: colors.primary }} /></View><View style={[styles.divider, { backgroundColor: colors.border }]} /><View style={styles.row}><View style={[styles.icon, { backgroundColor: "#E5EBD9" }]}><MaterialIcons name="notifications-none" size={22} color={colors.success} /></View><View className="flex-1 mr-3"><Text className="text-base font-bold text-foreground">تذكيرات المناسبات</Text><Text className="text-sm text-muted mt-1">السماح للتطبيق بتنبيهك محليًا</Text></View><Switch value={remindersEnabled} onValueChange={toggleReminders} trackColor={{ false: colors.border, true: colors.success }} /></View></View><View style={[styles.about, { backgroundColor: "#F6DED0" }]}><Text className="text-xl font-bold text-foreground">دفء</Text><Text className="text-sm text-muted mt-2 leading-5">بيانات الأسرة محفوظة محليًا على جهازك في هذه النسخة. لا تحتاج إلى إنشاء حساب.</Text></View></ScreenContainer>;
}
const styles = StyleSheet.create({ section: { borderRadius: 22, borderWidth: 1, padding: 16 }, row: { flexDirection: "row", alignItems: "center", minHeight: 64 }, icon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" }, divider: { height: 1, marginVertical: 9 }, about: { borderRadius: 22, padding: 18, marginTop: 18 } });
