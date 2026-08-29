import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp, LANG_OPTIONS } from "@/src/app-context";

export default function ArtisanProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, setRole, lang, setLang } = useApp();

  return (
    <ScrollView style={[styles.root, { paddingTop: insets.top }]} contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 32 }}>
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1721508490084-1b1de5b230d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=400" }}
        style={styles.avatar}
        contentFit="cover"
      />
      <Text style={styles.name}>Meena Devi</Text>
      <Text style={styles.sub}>Blue Pottery Artisan • Khurja, UP</Text>
      <View style={styles.badge}>
        <Ionicons name="ribbon" size={16} color={theme.colors.brandSecondary} />
        <Text style={styles.badgeText}>25 {t("years_experience")}</Text>
      </View>

      <Text style={styles.section}>{t("change_language")}</Text>
      <View style={styles.langRow}>
        {LANG_OPTIONS.map((o) => (
          <Pressable
            key={o.code}
            testID={`artisan-lang-${o.code}`}
            onPress={() => setLang(o.code)}
            style={[styles.langChip, lang === o.code && styles.langChipActive]}
          >
            <Text style={[styles.langChipText, lang === o.code && { color: "#fff" }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        testID="artisan-switch-role"
        style={styles.actionRow}
        onPress={async () => { await setRole(null); router.replace("/"); }}
      >
        <Ionicons name="swap-horizontal" size={24} color={theme.colors.brand} />
        <Text style={styles.actionText}>{t("switch_role")}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceSecondary} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: "center", marginTop: theme.spacing.md, backgroundColor: theme.colors.surfaceSecondary },
  name: { fontSize: theme.size.xxl, fontWeight: "800", color: theme.colors.onSurface, textAlign: "center", marginTop: theme.spacing.sm },
  sub: { fontSize: theme.size.base, color: theme.colors.onSurfaceSecondary, textAlign: "center", marginBottom: theme.spacing.sm },
  badge: { flexDirection: "row", alignSelf: "center", gap: 6, alignItems: "center", backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.radius.pill },
  badgeText: { fontSize: theme.size.sm, fontWeight: "700", color: theme.colors.onSurface },
  section: { fontSize: theme.size.lg, fontWeight: "700", color: theme.colors.onSurface, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  langChip: { paddingHorizontal: theme.spacing.md, height: 44, justifyContent: "center", borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceSecondary, borderWidth: 1, borderColor: theme.colors.border },
  langChipActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  langChipText: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  actionRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, marginTop: theme.spacing.md },
  actionText: { flex: 1, fontSize: theme.size.base, fontWeight: "600", color: theme.colors.onSurface },
});
