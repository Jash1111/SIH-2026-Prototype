import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, catName, Category } from "@/src/api";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";

export default function Categories() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lang, t } = useApp();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then((c) => { setCats(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>{t("categories")}</Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {cats.map((c) => (
            <Pressable
              key={c.key}
              testID={`cat-${c.key}`}
              onPress={() => router.push({ pathname: "/category/[key]", params: { key: c.key } })}
              style={styles.card}
            >
              <Image source={{ uri: c.image_url }} style={styles.img} contentFit="cover" />
              <LinearGradient colors={["transparent", "rgba(43,37,33,0.85)"]} style={styles.scrim} />
              <Text style={styles.label}>{catName(c, lang)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  title: { fontSize: theme.size.xxl, fontWeight: "800", color: theme.colors.onSurface, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md },
  grid: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.md, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingBottom: 32 },
  card: { width: "47%", height: 160, borderRadius: theme.radius.md, overflow: "hidden", marginBottom: theme.spacing.md, backgroundColor: theme.colors.surfaceTertiary },
  img: { width: "100%", height: "100%" },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" },
  label: { position: "absolute", left: theme.spacing.md, bottom: theme.spacing.md, color: "#fff", fontSize: theme.size.lg, fontWeight: "800" },
});
