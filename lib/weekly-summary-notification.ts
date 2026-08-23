import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const WEEKLY_SUMMARY_NOTIFICATION_ID_KEY = "dafء-weekly-summary-notification-id";

export async function cancelWeeklySummaryNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  const existingId = await AsyncStorage.getItem(WEEKLY_SUMMARY_NOTIFICATION_ID_KEY);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId);
    await AsyncStorage.removeItem(WEEKLY_SUMMARY_NOTIFICATION_ID_KEY);
  }
}

export async function scheduleWeeklySummaryNotification(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return false;
  await cancelWeeklySummaryNotification();
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "ملخص دفء الأسبوعي",
      body: "خذ لحظة للاطمئنان على مشاعر أفراد أسرتك وتسجيل ما يحتاج اهتمامك.",
      data: { url: "/" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6,
      hour: 20,
      minute: 0,
    },
  });
  await AsyncStorage.setItem(WEEKLY_SUMMARY_NOTIFICATION_ID_KEY, notificationId);
  return true;
}
