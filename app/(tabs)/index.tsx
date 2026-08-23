import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { calculateWeeklySummary } from "@/lib/family-care";

type MoodEntry = { mood: string; score: number; date: string };
type FamilyMember = {
  id: string;
  name: string;
  role: string;
  mood: string;
  moodIcon: string;
  note: string;
  accent: string;
};

const initialMembers: FamilyMember[] = [
  { id: "1", name: "سارة", role: "الزوجة", mood: "هادئة", moodIcon: "☁️", note: "تحب كوب قهوة هادئًا هذا الصباح", accent: "#F6DED0" },
  { id: "2", name: "عمر", role: "الابن", mood: "متحمس", moodIcon: "☀️", note: "لديه نشاط مدرسي يوم الخميس", accent: "#E5EBD9" },
  { id: "3", name: "ليان", role: "الابنة", mood: "سعيدة", moodIcon: "🌷", note: "تحدثت عن قصة تحبها قبل النوم", accent: "#F8E6C9" },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [note, setNote] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState({ average: 0, recorded: 0 });

  useEffect(() => {
    AsyncStorage.getItem("dafء-members").then((saved) => {
      if (saved) setMembers(JSON.parse(saved));
    });
  }, []);

  const loadWeeklySummary = useCallback(async () => {
    const enabled = await AsyncStorage.getItem("dafء-weekly-summary");
    setWeeklySummaryEnabled(enabled !== "false");
    const saved = await AsyncStorage.getItem("dafء-members");
    const list: FamilyMember[] = saved ? JSON.parse(saved) : initialMembers;
    const histories = await Promise.all(list.map(async (item) => {
      const raw = await AsyncStorage.getItem(`dafء-moods-${item.id}`);
      return { entries: raw ? (JSON.parse(raw) as MoodEntry[]) : [] };
    }));
    const summary = calculateWeeklySummary(histories);
    setWeeklySummary({ recorded: summary.recorded, average: summary.average });
  }, []);

  useFocusEffect(useCallback(() => {
    loadWeeklySummary();
  }, [loadWeeklySummary]));

  const saveMembers = async (next: FamilyMember[]) => {
    setMembers(next);
    await AsyncStorage.setItem("dafء-members", JSON.stringify(next));
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "صباح الدفء" : hour < 18 ? "مساء الدفء" : "ليلة هادئة";
  }, []);

  const saveNote = async () => {
    if (!selectedMember || !note.trim()) return;
    const next = members.map((member) =>
      member.id === selectedMember.id ? { ...member, note: note.trim(), mood: "تمت المتابعة", moodIcon: "✓" } : member,
    );
    await saveMembers(next);
    setSelectedMember(null);
    setNote("");
  };

  const addMember = async () => {
    if (!newName.trim()) return;
    const next = [...members, { id: Date.now().toString(), name: newName.trim(), role: newRole.trim() || "فرد من الأسرة", mood: "لم يُسجل بعد", moodIcon: "♡", note: "أضف أول ملاحظة عنه", accent: "#E8E0D8" }];
    await saveMembers(next);
    setNewName("");
    setNewRole("");
    setShowAddMember(false);
  };

  const closeCheckIn = () => {
    if (!note.trim()) {
      setSelectedMember(null);
      return;
    }
    Alert.alert("ملاحظة غير محفوظة", "لديك نص لم يتم حفظه. هل تريد إغلاق النموذج؟", [
      { text: "متابعة الكتابة", style: "cancel" },
      { text: "إغلاق دون حفظ", style: "destructive", onPress: () => { setNote(""); setSelectedMember(null); } },
    ]);
  };

  const closeAddMember = () => {
    if (!newName.trim() && !newRole.trim()) {
      setShowAddMember(false);
      return;
    }
    Alert.alert("بيانات غير محفوظة", "لديك بيانات لم يتم حفظها. هل تريد إغلاق النموذج؟", [
      { text: "متابعة الإدخال", style: "cancel" },
      { text: "إغلاق دون حفظ", style: "destructive", onPress: () => { setNewName(""); setNewRole(""); setShowAddMember(false); } },
    ]);
  };

  return (
    <ScreenContainer className="px-5 pt-4" containerClassName="bg-background">
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View className="flex-row items-center justify-between mb-7">
              <View>
                <Text className="text-sm text-muted mb-1">أهلًا بك في بيتك</Text>
                <Text className="text-3xl font-bold text-foreground">{greeting}</Text>
              </View>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>أ</Text>
              </View>
            </View>

            <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
              <View style={styles.heroText}>
                <Text className="text-xl font-bold text-white">كيف حال الأسرة اليوم؟</Text>
                <Text className="text-sm text-white/80 mt-2 leading-5">لحظة اهتمام صغيرة تصنع فرقًا كبيرًا.</Text>
              </View>
              <Text style={styles.heroHeart}>♡</Text>
            </View>

            {weeklySummaryEnabled ? <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.summaryIcon, { backgroundColor: "#F6DED0" }]}><MaterialIcons name="insights" size={20} color={colors.primary} /></View><View className="flex-1 mr-3"><Text className="text-base font-bold text-foreground">ملخص هذا الأسبوع</Text><Text className="text-sm text-muted mt-1">{weeklySummary.recorded ? `متوسط المزاج ${weeklySummary.average.toFixed(1)} من 5 عبر ${weeklySummary.recorded} تسجيلات` : "لم تُسجل مشاعر هذا الأسبوع بعد"}</Text></View></View> : null}

            <View className="flex-row items-center justify-between mt-8 mb-3">
              <Text className="text-xl font-bold text-foreground">أفرادك اليوم</Text>
              <Text className="text-sm text-muted">{members.length} أفراد</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`فتح ملف ${item.name}`}
            accessibilityHint="عرض تفاصيل المتابعة والمشاعر والمناسبات"
            onPress={() => router.push({ pathname: "/member/[id]", params: { id: item.id } })}
            style={({ pressed }) => [styles.memberCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <View style={[styles.memberAvatar, { backgroundColor: item.accent }]}>
              <Text style={styles.memberAvatarText}>{item.name.slice(0, 1)}</Text>
            </View>
            <View className="flex-1 mr-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-foreground">{item.name}</Text>
                <Text className="text-xs text-muted">{item.role}</Text>
              </View>
              <Text className="text-sm text-muted mt-1" numberOfLines={1}>{item.note}</Text>
              <View className="flex-row items-center mt-2">
                <Text className="text-xs text-primary">{item.moodIcon}  {item.mood}</Text>
                <Text className="text-xs text-muted mr-3">اضغط للاطمئنان</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-left" size={22} color={colors.muted} />
          </Pressable>
        )}
        ListFooterComponent={
          <View>
            <View className="flex-row items-center justify-between mt-7 mb-3">
              <Text className="text-xl font-bold text-foreground">يحتاج انتباهك</Text>
              <MaterialIcons name="more-horiz" size={22} color={colors.muted} />
            </View>
            <View style={[styles.reminderCard, { backgroundColor: "#F8E6C9" }]}>
              <View style={styles.reminderIcon}><MaterialIcons name="cake" size={22} color="#B86B4B" /></View>
              <View className="flex-1 mr-3">
                <Text className="text-base font-bold text-foreground">مناسبة قريبة</Text>
                <Text className="text-sm text-muted mt-1">أضف مناسبتك الأولى لتظهر هنا</Text>
              </View>
              <MaterialIcons name="chevron-left" size={22} color={colors.muted} />
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="إضافة فرد من الأسرة" onPress={() => setShowAddMember(true)} style={({ pressed }) => [styles.addButton, { borderColor: colors.primary }, pressed && styles.pressed]}>
              <MaterialIcons name="person-add" size={20} color={colors.primary} />
              <Text className="font-bold text-primary mr-2">إضافة فرد من الأسرة</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={Boolean(selectedMember)} transparent animationType="slide" onRequestClose={closeCheckIn}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            <Text className="text-2xl font-bold text-foreground">اطمئن على {selectedMember?.name}</Text>
            <Text className="text-sm text-muted mt-2 mb-5">ما الشيء الصغير الذي تريد تذكره اليوم؟</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="اكتب ملاحظة دافئة..." placeholderTextColor={colors.muted} multiline style={[styles.input, { borderColor: colors.border, color: colors.foreground }]} />
            <Pressable accessibilityRole="button" accessibilityLabel="حفظ المتابعة" onPress={saveNote} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
              <Text className="text-white font-bold text-base">حفظ المتابعة</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="إغلاق متابعة الفرد دون حفظ" onPress={closeCheckIn} style={styles.cancelButton}><Text className="font-bold text-muted">ليس الآن</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddMember} transparent animationType="slide" onRequestClose={closeAddMember}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            <Text className="text-2xl font-bold text-foreground">أضف فردًا جديدًا</Text>
            <Text className="text-sm text-muted mt-2 mb-5">ابدأ بالاسم فقط، ويمكنك إضافة التفاصيل لاحقًا.</Text>
            <TextInput value={newName} onChangeText={setNewName} placeholder="الاسم" placeholderTextColor={colors.muted} style={[styles.inputSingle, { borderColor: colors.border, color: colors.foreground }]} />
            <TextInput value={newRole} onChangeText={setNewRole} placeholder="صلة القرابة (اختياري)" placeholderTextColor={colors.muted} style={[styles.inputSingle, { borderColor: colors.border, color: colors.foreground }]} />
            <Pressable onPress={addMember} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><Text className="text-white font-bold text-base">إضافة إلى الأسرة</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="إلغاء إضافة فرد" onPress={closeAddMember} style={styles.cancelButton}><Text className="font-bold text-muted">إلغاء</Text></Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 34 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "white", fontSize: 18, fontWeight: "700" },
  heroCard: { minHeight: 132, borderRadius: 26, padding: 20, flexDirection: "row", alignItems: "center", overflow: "hidden" },
  heroText: { flex: 1 },
  heroHeart: { color: "rgba(255,255,255,0.75)", fontSize: 78, lineHeight: 78, transform: [{ rotate: "-12deg" }] },
  memberCard: { minHeight: 92, borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  memberAvatar: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 22, fontWeight: "700", color: "#5C4438" },
  summaryCard: { borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", marginTop: 14 },
  summaryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  reminderCard: { borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center" },
  reminderIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.55)", alignItems: "center", justifyContent: "center" },
  addButton: { borderWidth: 1, borderStyle: "dashed", borderRadius: 18, minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", marginTop: 14 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(45,41,38,0.32)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 },
  sheetHandle: { width: 42, height: 4, borderRadius: 4, backgroundColor: "#D5C7BC", alignSelf: "center", marginBottom: 22 },
  input: { minHeight: 112, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: "top", fontSize: 16, marginBottom: 14 },
  inputSingle: { height: 52, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, fontSize: 16, marginBottom: 10, textAlign: "right" },
  primaryButton: { height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2 },
  cancelButton: { height: 48, alignItems: "center", justifyContent: "center", marginTop: 4 },
});
