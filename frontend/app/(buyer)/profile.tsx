import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp, LANG_OPTIONS } from "@/src/app-context";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, setRole, lang, setLang } = useApp();

  return (
    <ScrollView style={[styles.root, { paddingTop: insets.top }]} contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 32 }}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={48} color={theme.colors.brand} />
      </View>
      <Text style={styles.name}>Guest Buyer</Text>
      <Text style={styles.sub}>KalaKriti Explorer</Text>

      <Text style={styles.section}>{t("change_language")}</Text>
      <View style={styles.langRow}>
        {LANG_OPTIONS.map((o) => (
          <Pressable
            key={o.code}
            testID={`profile-lang-${o.code}`}
            onPress={() => setLang(o.code)}
            style={[styles.langChip, lang === o.code && styles.langChipActive]}
          >
            <Text style={[styles.langChipText, lang === o.code && { color: "#fff" }]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        testID="switch-role"
        style={styles.actionRow}
        onPress={async () => {
          await setRole(null);
          router.replace("/");
        }}
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
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.surfaceSecondary, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: theme.spacing.md },
  name: { fontSize: theme.size.xl, fontWeight: "800", color: theme.colors.onSurface, textAlign: "center", marginTop: theme.spacing.sm },
  sub: { fontSize: theme.size.base, color: theme.colors.onSurfaceSecondary, textAlign: "center", marginBottom: theme.spacing.lg },
  section: { fontSize: theme.size.lg, fontWeight: "700", color: theme.colors.onSurface, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  langRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  langChip: { paddingHorizontal: theme.spacing.md, height: 44, justifyContent: "center", borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceSecondary, borderWidth: 1, borderColor: theme.colors.border },
  langChipActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  langChipText: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  actionRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, padding: theme.spacing.md, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, marginTop: theme.spacing.md },
  actionText: { flex: 1, fontSize: theme.size.base, fontWeight: "600", color: theme.colors.onSurface },
});
