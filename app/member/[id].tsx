import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Member = { id: string; name: string; role: string; mood: string; moodIcon: string; note: string; accent: string };
const fallback: Member[] = [
  { id: "1", name: "سارة", role: "الزوجة", mood: "هادئة", moodIcon: "☁️", note: "تحب كوب قهوة هادئًا هذا الصباح", accent: "#F6DED0" },
  { id: "2", name: "عمر", role: "الابن", mood: "متحمس", moodIcon: "☀️", note: "لديه نشاط مدرسي يوم الخميس", accent: "#E5EBD9" },
  { id: "3", name: "ليان", role: "الابنة", mood: "سعيدة", moodIcon: "🌷", note: "تحدثت عن قصة تحبها قبل النوم", accent: "#F8E6C9" },
];

export default function MemberDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("dafء-members").then((saved) => {
      const list: Member[] = saved ? JSON.parse(saved) : fallback;
      setMember(list.find((item) => item.id === id) ?? list[0]);
    });
  }, [id]);

  const saveUpdate = async () => {
    if (!member || (!note.trim() && !mood)) return;
    const saved = await AsyncStorage.getItem("dafء-members");
    const list: Member[] = saved ? JSON.parse(saved) : fallback;
    const next = list.map((item) => item.id === member.id ? { ...item, note: note.trim() || item.note, mood: mood || item.mood, moodIcon: mood ? "♡" : item.moodIcon } : item);
    await AsyncStorage.setItem("dafء-members", JSON.stringify(next));
    setMember(next.find((item) => item.id === member.id) ?? member);
    setNote("");
    setMood("");
  };

  if (!member) return <ScreenContainer className="items-center justify-center"><Text className="text-muted">جاري تحميل الملف...</Text></ScreenContainer>;

  return (
    <ScreenContainer className="px-5" containerClassName="bg-background">
      <Stack.Screen options={{ title: member.name, headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View className="flex-row items-center justify-between mb-7">
          <Pressable onPress={() => router.back()} style={styles.backButton}><MaterialIcons name="arrow-forward" size={22} color={colors.foreground} /></Pressable>
          <Text className="text-base font-bold text-foreground">ملف {member.name}</Text>
          <View style={{ width: 42 }} />
        </View>
        <View style={[styles.profileCard, { backgroundColor: member.accent }]}>
          <View style={styles.profileAvatar}><Text style={styles.profileLetter}>{member.name.slice(0, 1)}</Text></View>
          <Text className="text-2xl font-bold text-foreground mt-3">{member.name}</Text>
          <Text className="text-sm text-muted mt-1">{member.role}</Text>
          <View style={styles.moodPill}><Text className="text-sm text-foreground">{member.moodIcon}  {member.mood}</Text></View>
        </View>

        <Text className="text-xl font-bold text-foreground mt-8 mb-3">نظرة عامة</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View className="flex-row items-center mb-3"><MaterialIcons name="favorite-border" size={20} color={colors.primary} /><Text className="text-sm font-bold text-foreground mr-2">آخر ملاحظة</Text></View>
          <Text className="text-base text-muted leading-6">{member.note}</Text>
        </View>

        <Text className="text-xl font-bold text-foreground mt-8 mb-3">أضف اهتمامًا اليوم</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text className="text-sm text-muted mb-3">كيف يبدو شعوره الآن؟</Text>
          <View className="flex-row flex-wrap mb-3">
            {["سعيد", "هادئ", "متعب", "قلق"].map((item) => (
              <Pressable key={item} onPress={() => setMood(item)} style={[styles.moodChoice, { borderColor: mood === item ? colors.primary : colors.border, backgroundColor: mood === item ? "#F6DED0" : colors.background }]}><Text className="text-sm text-foreground">{item}</Text></Pressable>
            ))}
          </View>
          <TextInput value={note} onChangeText={setNote} placeholder="ملاحظة قصيرة أو شيء تريد تذكره..." placeholderTextColor={colors.muted} multiline style={[styles.textInput, { borderColor: colors.border, color: colors.foreground }]} />
          <Pressable onPress={saveUpdate} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}><Text className="text-white font-bold">حفظ الاهتمام</Text></Pressable>
        </View>

        <View style={[styles.nextCard, { backgroundColor: "#E5EBD9" }]}><MaterialIcons name="event" size={22} color={colors.success} /><View className="flex-1 mr-3"><Text className="text-base font-bold text-foreground">المناسبات والمتابعة</Text><Text className="text-sm text-muted mt-1">لا توجد مناسبات مسجلة بعد</Text></View><MaterialIcons name="chevron-left" size={22} color={colors.muted} /></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 36 }, backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(233,222,212,0.65)", alignItems: "center", justifyContent: "center" }, profileCard: { borderRadius: 26, alignItems: "center", padding: 24 }, profileAvatar: { width: 78, height: 78, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.65)", alignItems: "center", justifyContent: "center" }, profileLetter: { fontSize: 34, fontWeight: "700", color: "#5C4438" }, moodPill: { marginTop: 14, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.55)" }, infoCard: { borderRadius: 20, borderWidth: 1, padding: 16 }, moodChoice: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 15, borderWidth: 1, marginLeft: 8, marginBottom: 8 }, textInput: { minHeight: 86, borderWidth: 1, borderRadius: 15, padding: 12, textAlignVertical: "top", fontSize: 15, marginBottom: 12 }, saveButton: { height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" }, nextCard: { borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", marginTop: 18 }, });
