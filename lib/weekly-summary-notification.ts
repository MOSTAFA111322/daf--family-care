import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const WEEKLY_SUMMARY_NOTIFICATION_ID_KEY = "dafء-weekly-summary-notification-id";
export const WEEKLY_SUMMARY_DAY_KEY = "dafء-weekly-summary-day";
export const WEEKLY_SUMMARY_HOUR_KEY = "dafء-weekly-summary-hour";
export const WEEKLY_SUMMARY_MINUTE_KEY = "dafء-weekly-summary-minute";
export const DEFAULT_WEEKLY_SUMMARY_DAY = 6;
export const DEFAULT_WEEKLY_SUMMARY_HOUR = 20;
export const DEFAULT_WEEKLY_SUMMARY_MINUTE = 0;

export type WeeklySummarySchedule = { weekday: number; hour: number; minute?: number };

export async function getWeeklySummarySchedule(): Promise<WeeklySummarySchedule> {
  const [day, hour, minute] = await AsyncStorage.multiGet([WEEKLY_SUMMARY_DAY_KEY, WEEKLY_SUMMARY_HOUR_KEY, WEEKLY_SUMMARY_MINUTE_KEY]);
  return {
    weekday: Number(day[1]) || DEFAULT_WEEKLY_SUMMARY_DAY,
    hour: Number(hour[1]) || DEFAULT_WEEKLY_SUMMARY_HOUR,
    minute: Number.isFinite(Number(minute[1])) ? Number(minute[1]) : DEFAULT_WEEKLY_SUMMARY_MINUTE,
  };
}

export async function cancelWeeklySummaryNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  const existingId = await AsyncStorage.getItem(WEEKLY_SUMMARY_NOTIFICATION_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await AsyncStorage.removeItem(WEEKLY_SUMMARY_NOTIFICATION_ID_KEY);
  }
}

export async function scheduleWeeklySummaryNotification(schedule?: WeeklySummarySchedule): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return false;
  const selected = schedule ?? await getWeeklySummarySchedule();
  await cancelWeeklySummaryNotification();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "ملخص دفء الأسبوعي",
      body: "خذ لحظة للاطمئنان على مشاعر أفراد أسرتك وتسجيل ما يحتاج اهتمامك.",
      data: { url: "/" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: selected.weekday,
      hour: selected.hour,
      minute: selected.minute ?? 0,
    },
  });
  await AsyncStorage.multiSet([
    [WEEKLY_SUMMARY_DAY_KEY, String(selected.weekday)],
    [WEEKLY_SUMMARY_HOUR_KEY, String(selected.hour)],
    [WEEKLY_SUMMARY_MINUTE_KEY, String(selected.minute ?? 0)],
    [WEEKLY_SUMMARY_NOTIFICATION_ID_KEY, notificationId],
  ]);
  return true;
}
