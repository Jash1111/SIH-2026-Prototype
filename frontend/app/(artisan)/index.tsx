import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";
import { api, Product } from "@/src/api";

const DEFAULT_ARTISAN_ID = "art-1"; // demo artisan session

export default function ArtisanDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [inqCount, setInqCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [p, i] = await Promise.all([
        api.products({ artisan_id: DEFAULT_ARTISAN_ID }),
        api.inquiries(DEFAULT_ARTISAN_ID),
      ]);
      setProducts(p);
      setInqCount(i.length);
    } catch (e) { console.log(e); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView style={[styles.root, { paddingTop: insets.top }]} contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 32, gap: theme.spacing.md }}>
      <View>
        <Text style={styles.greet}>Namaste, Meena Devi 🙏</Text>
        <Text style={styles.village}>Khurja, Uttar Pradesh</Text>
      </View>

      {/* Massive AI CTA */}
      <Pressable
        testID="add-product-ai"
        onPress={() => router.push("/add-product")}
        style={styles.aiCard}
      >
        <LinearGradient
          colors={[theme.colors.brand, "#E0783F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={36} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTitle}>{t("add_product_ai")}</Text>
          <Text style={styles.aiSub}>{t("add_product_sub")}</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={44} color="#fff" />
      </Pressable>

      {/* Simple stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{products.length}</Text>
          <Text style={styles.statLabel}>{t("my_crafts")}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{inqCount}</Text>
          <Text style={styles.statLabel}>{t("people_asked")}</Text>
        </View>
      </View>

      <Text style={styles.section}>{t("my_crafts")}</Text>
      {products.length === 0 ? (
        <Text style={styles.empty}>{t("empty_products")}</Text>
      ) : (
        <View style={{ gap: theme.spacing.sm }}>
          {products.slice(0, 5).map((p) => (
            <Pressable key={p.id} testID={`my-prod-${p.id}`} style={styles.prodRow} onPress={() => router.push(`/product/${p.id}`)}>
              <Image source={{ uri: p.image_urls[0] }} style={styles.prodImg} contentFit="cover" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.prodName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.prodPrice}>₹{p.price}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.colors.onSurfaceSecondary} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  greet: { fontSize: theme.size.xxl, fontWeight: "800", color: theme.colors.onSurface },
  village: { fontSize: theme.size.base, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  aiCard: { minHeight: 130, borderRadius: theme.radius.lg, padding: theme.spacing.lg, flexDirection: "row", alignItems: "center", gap: theme.spacing.md, overflow: "hidden" },
  aiIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  aiTitle: { color: "#fff", fontSize: theme.size.xl, fontWeight: "800" },
  aiSub: { color: "#fff", fontSize: theme.size.sm, opacity: 0.95, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: theme.spacing.md },
  statCard: { flex: 1, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.md, minHeight: 100, justifyContent: "center" },
  statNum: { fontSize: theme.size.xxxl, fontWeight: "800", color: theme.colors.brand },
  statLabel: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, marginTop: 4 },
  section: { fontSize: theme.size.lg, fontWeight: "700", color: theme.colors.onSurface, marginTop: theme.spacing.sm },
  empty: { color: theme.colors.onSurfaceSecondary, fontStyle: "italic", padding: theme.spacing.md },
  prodRow: { flexDirection: "row", gap: theme.spacing.md, alignItems: "center", backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.sm },
  prodImg: { width: 60, height: 60, borderRadius: theme.radius.sm },
  prodName: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  prodPrice: { fontSize: theme.size.base, fontWeight: "800", color: theme.colors.brand },
});
