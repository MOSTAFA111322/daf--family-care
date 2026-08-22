import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type Member = { id: string; name: string; role: string; mood: string; moodIcon: string; note: string; accent: string; imageUri?: string };
const fallback: Member[] = [
  { id: "1", name: "سارة", role: "الزوجة", mood: "هادئة", moodIcon: "☁️", note: "تحب كوب قهوة هادئًا هذا الصباح", accent: "#F6DED0" },
  { id: "2", name: "عمر", role: "الابن", mood: "متحمس", moodIcon: "☀️", note: "لديه نشاط مدرسي يوم الخميس", accent: "#E5EBD9" },
  { id: "3", name: "ليان", role: "الابنة", mood: "سعيدة", moodIcon: "🌷", note: "تحدثت عن قصة تحبها قبل النوم", accent: "#F8E6C9" },
];

export default function FamilyScreen() {
  const colors = useColors();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(fallback);
  const [query, setQuery] = useState("");
  useEffect(() => { AsyncStorage.getItem("dafء-members").then((saved) => saved && setMembers(JSON.parse(saved))); }, []);
  const filtered = useMemo(() => members.filter((member) => `${member.name} ${member.role}`.includes(query.trim())), [members, query]);
  const removeMember = (member: Member) => Alert.alert("حذف الفرد؟", `سيتم حذف ملف ${member.name} من هذا الجهاز.`, [{ text: "إلغاء", style: "cancel" }, { text: "حذف", style: "destructive", onPress: async () => { const next = members.filter((item) => item.id !== member.id); setMembers(next); await AsyncStorage.setItem("dafء-members", JSON.stringify(next)); } }]);
  return <ScreenContainer className="px-5 pt-4"><View className="flex-row items-center justify-between mb-5"><View><Text className="text-sm text-muted">مساحتكم العائلية</Text><Text className="text-3xl font-bold text-foreground">أفراد الأسرة</Text></View><View style={[styles.count, { backgroundColor: colors.primary }]}><Text className="text-white font-bold">{members.length}</Text></View></View><View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surface }]}><MaterialIcons name="search" size={21} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="ابحث بالاسم أو صلة القرابة" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} /></View><FlatList data={filtered} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: "/member/[id]", params: { id: item.id } })} onLongPress={() => removeMember(item)} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}><View style={[styles.avatar, { backgroundColor: item.accent }]}>{item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.avatarImage} /> : <Text style={styles.avatarLetter}>{item.name.slice(0, 1)}</Text>}</View><View className="flex-1 mr-3"><Text className="text-base font-bold text-foreground">{item.name}</Text><Text className="text-sm text-muted mt-1">{item.role}  ·  {item.moodIcon} {item.mood}</Text></View><MaterialIcons name="chevron-left" size={22} color={colors.muted} /></Pressable>} ListEmptyComponent={<Text className="text-center text-muted mt-8">لم نجد فردًا بهذا الاسم.</Text>} /></ScreenContainer>;
}
const styles = StyleSheet.create({ count: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }, search: { height: 52, borderRadius: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 }, searchInput: { flex: 1, marginRight: 8, textAlign: "right", fontSize: 15 }, list: { paddingTop: 18, paddingBottom: 30 }, card: { minHeight: 78, borderWidth: 1, borderRadius: 19, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 10 }, avatar: { width: 50, height: 50, borderRadius: 17, alignItems: "center", justifyContent: "center", overflow: "hidden" }, avatarImage: { width: "100%", height: "100%" }, avatarLetter: { fontSize: 21, fontWeight: "700", color: "#5C4438" } });
