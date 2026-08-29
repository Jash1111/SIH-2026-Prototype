import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, LANG_OPTIONS, LangCode } from "@/src/app-context";
import { theme } from "@/src/theme";

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, setLang, setRole, role, hydrated } = useApp();
  const [step, setStep] = useState<"lang" | "role">("lang");

  useEffect(() => {
    if (hydrated && role) {
      router.replace(role === "artisan" ? "/(artisan)" : "/(buyer)");
    }
  }, [hydrated, role]);

  const pickLang = async (code: LangCode) => {
    await setLang(code);
    setStep("role");
  };

  const pickRole = async (r: "buyer" | "artisan") => {
    await setRole(r);
    router.replace(r === "artisan" ? "/(artisan)" : "/(buyer)");
  };

  const t = (key: string) => {
    const map: Record<string, Record<LangCode, string>> = {
      welcome: {
        en: "Welcome to KalaKriti",
        hi: "कलाकृति में आपका स्वागत है",
        ta: "கலாக்ரிதிக்கு வரவேற்கிறோம்",
        bn: "কলাকৃতিতে স্বাগতম",
      },
      choose_language: {
        en: "Choose your language",
        hi: "अपनी भाषा चुनें",
        ta: "உங்கள் மொழியைத் தேர்ந்தெடுங்கள்",
        bn: "আপনার ভাষা নির্বাচন করুন",
      },
      i_want_to_buy: { en: "I want to Buy", hi: "मुझे खरीदना है", ta: "நான் வாங்க வேண்டும்", bn: "আমি কিনতে চাই" },
      i_want_to_sell: { en: "I want to Sell", hi: "मुझे बेचना है", ta: "நான் விற்க வேண்டும்", bn: "আমি বিক্রি করতে চাই" },
      buyer_subtitle: {
        en: "Discover handmade crafts from village artisans",
        hi: "गांव के कारीगरों की हस्तनिर्मित कलाएं देखें",
        ta: "கிராம கைவினைஞர்களின் கைவினைப்பொருட்களைக் கண்டறியுங்கள்",
        bn: "গ্রামের কারিগরদের হস্তনির্মিত কারুশিল্প আবিষ্কার করুন",
      },
      seller_subtitle: {
        en: "Sell your handmade crafts online with AI help",
        hi: "AI की मदद से अपनी कला बेचें",
        ta: "AI உதவியுடன் உங்கள் கைவினைகளை விற்கவும்",
        bn: "AI সহায়তায় আপনার কারুশিল্প বিক্রি করুন",
      },
    };
    return map[key]?.[lang] || map[key]?.en || key;
  };

  if (!hydrated) return <View style={{ flex: 1, backgroundColor: theme.colors.surface }} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top + theme.spacing.lg, paddingBottom: insets.bottom + theme.spacing.lg }]}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>KalaKriti</Text>
        <Text style={styles.brandSub}>कलाकृति</Text>
      </View>

      {step === "lang" ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} testID="lang-scroll">
          <Text style={styles.stepTitle}>{t("choose_language")}</Text>
          <View style={styles.langGrid}>
            {LANG_OPTIONS.map((opt) => (
              <Pressable
                key={opt.code}
                testID={`lang-option-${opt.code}`}
                onPress={() => pickLang(opt.code)}
                style={({ pressed }) => [
                  styles.langCard,
                  lang === opt.code && styles.langCardActive,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.langLabel}>{opt.label}</Text>
                <Text style={styles.langScript}>{opt.script}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} testID="role-scroll">
          <Text style={styles.stepTitle}>{t("welcome")}</Text>

          <Pressable testID="role-buyer" onPress={() => pickRole("buyer")} style={({ pressed }) => [styles.roleCard, pressed && { transform: [{ scale: 0.98 }] }]}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1631507623312-64cae4e8b0e8?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" }}
              style={styles.roleImg}
              contentFit="cover"
            />
            <LinearGradient colors={["transparent", "rgba(43,37,33,0.9)"]} style={styles.roleScrim} />
            <View style={styles.roleContent}>
              <Ionicons name="bag-handle" size={36} color="#fff" />
              <Text style={styles.roleTitle}>{t("i_want_to_buy")}</Text>
              <Text style={styles.roleSub}>{t("buyer_subtitle")}</Text>
            </View>
          </Pressable>

          <Pressable testID="role-artisan" onPress={() => pickRole("artisan")} style={({ pressed }) => [styles.roleCard, pressed && { transform: [{ scale: 0.98 }] }]}>
            <Image
              source={{ uri: "https://images.unsplash.com/photo-1721508490084-1b1de5b230d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" }}
              style={styles.roleImg}
              contentFit="cover"
            />
            <LinearGradient colors={["transparent", "rgba(43,37,33,0.9)"]} style={styles.roleScrim} />
            <View style={styles.roleContent}>
              <Ionicons name="hammer" size={36} color="#fff" />
              <Text style={styles.roleTitle}>{t("i_want_to_sell")}</Text>
              <Text style={styles.roleSub}>{t("seller_subtitle")}</Text>
            </View>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg },
  brandTitle: { fontSize: 40, fontWeight: "700", color: theme.colors.brand },
  brandSub: { fontSize: theme.size.lg, color: theme.colors.onSurfaceSecondary, marginTop: 4 },
  body: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  stepTitle: { fontSize: theme.size.xl, fontWeight: "700", color: theme.colors.onSurface, marginBottom: theme.spacing.lg },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  langCard: {
    width: "47%",
    height: 120,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  langCardActive: { borderColor: theme.colors.brand, backgroundColor: "#F9E9DF" },
  langLabel: { fontSize: 22, fontWeight: "700", color: theme.colors.onSurface },
  langScript: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, marginTop: 4 },
  roleCard: {
    height: 220,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceTertiary,
  },
  roleImg: { position: "absolute", inset: 0, width: "100%", height: "100%" } as any,
  roleScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "70%" },
  roleContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: theme.spacing.lg, gap: 6 },
  roleTitle: { color: "#fff", fontSize: theme.size.xxl, fontWeight: "800" },
  roleSub: { color: "#fff", fontSize: theme.size.base, opacity: 0.95 },
});
