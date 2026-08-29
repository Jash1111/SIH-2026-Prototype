import { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, FlatList, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, catName, Category, Product } from "@/src/api";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";

export default function BuyerHome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useApp();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([api.categories(), api.products()]);
        setCats(c);
        setProducts(p);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (active !== "all") list = list.filter((p) => p.category_key === active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.artisan_name || "").toLowerCase().includes(q) ||
          (p.artisan_state || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [products, active, search]);

  const featured = products.slice(0, 4);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>KalaKriti</Text>
          <Text style={styles.tag}>{t("tagline")}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={theme.colors.onSurfaceSecondary} />
        <TextInput
          testID="search-input"
          value={search}
          onChangeText={setSearch}
          placeholder={t("search_placeholder")}
          placeholderTextColor={theme.colors.onSurfaceTertiary}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipContent}>
        <Pressable testID="chip-all" onPress={() => setActive("all")} style={[styles.chip, active === "all" && styles.chipActive]}>
          <Text style={[styles.chipText, active === "all" && styles.chipTextActive]}>{t("all_crafts")}</Text>
        </Pressable>
        {cats.map((c) => (
          <Pressable key={c.key} testID={`chip-${c.key}`} onPress={() => setActive(c.key)} style={[styles.chip, active === c.key && styles.chipActive]}>
            <Text style={[styles.chipText, active === c.key && styles.chipTextActive]}>{catName(c, lang)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          testID="products-list"
          ListHeaderComponent={
            featured.length > 0 && active === "all" && !search ? (
              <View style={{ marginBottom: theme.spacing.md }}>
                <Text style={styles.sectionTitle}>{t("featured_artisans")}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.md, gap: theme.spacing.md }}>
                  {featured.map((p) => (
                    <Pressable
                      key={p.id}
                      testID={`featured-${p.id}`}
                      onPress={() => router.push(`/product/${p.id}`)}
                      style={styles.featureCard}
                    >
                      <Image source={{ uri: p.artisan_photo || p.image_urls[0] }} style={{ flex: 1 }} contentFit="cover" />
                      <LinearGradient colors={["transparent", "rgba(43,37,33,0.9)"]} style={styles.featureScrim} />
                      <View style={styles.featureContent}>
                        <Text style={styles.featureName}>{p.artisan_name}</Text>
                        <Text style={styles.featureSub}>{p.artisan_village}, {p.artisan_state}</Text>
                        <View style={styles.featureCta}>
                          <Text style={styles.featureCtaText}>{t("view_story")}</Text>
                          <Ionicons name="arrow-forward" size={14} color={theme.colors.brand} />
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          numColumns={2}
          columnWrapperStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.md }}
          contentContainerStyle={{ paddingBottom: 24, gap: theme.spacing.md, paddingTop: theme.spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              testID={`product-card-${item.id}`}
              onPress={() => router.push(`/product/${item.id}`)}
              style={styles.prodCard}
            >
              <Image source={{ uri: item.image_urls[0] }} style={styles.prodImg} contentFit="cover" />
              <View style={styles.prodBody}>
                <Text style={styles.prodName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.prodArtisan} numberOfLines={1}>{t("from")} {item.artisan_village}</Text>
                <Text style={styles.prodPrice}>₹{item.price}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md, flexDirection: "row", alignItems: "center" },
  brand: { fontSize: theme.size.xxl, fontWeight: "800", color: theme.colors.brand },
  tag: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
  searchBox: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.pill,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    height: 52,
    gap: theme.spacing.sm,
  },
  searchInput: { flex: 1, fontSize: theme.size.base, color: theme.colors.onSurface },
  chipRow: { marginTop: theme.spacing.md, maxHeight: 56 },
  chipContent: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, alignItems: "center" },
  chip: {
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
  chipText: { fontSize: theme.size.sm, color: theme.colors.onSurface, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  sectionTitle: { fontSize: theme.size.lg, fontWeight: "700", color: theme.colors.onSurface, paddingHorizontal: theme.spacing.md, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm },
  featureCard: { width: 260, height: 300, borderRadius: theme.radius.md, overflow: "hidden", backgroundColor: theme.colors.surfaceTertiary },
  featureScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "60%" },
  featureContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: theme.spacing.md, gap: 4 },
  featureName: { fontSize: theme.size.xl, fontWeight: "800", color: "#fff" },
  featureSub: { fontSize: theme.size.sm, color: "#fff", opacity: 0.9 },
  featureCta: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", alignSelf: "flex-start", paddingHorizontal: theme.spacing.sm, paddingVertical: 6, borderRadius: theme.radius.pill, marginTop: theme.spacing.xs },
  featureCtaText: { color: theme.colors.brand, fontSize: theme.size.sm, fontWeight: "700" },
  prodCard: { flex: 1, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, overflow: "hidden" },
  prodImg: { width: "100%", height: 160 },
  prodBody: { padding: theme.spacing.sm, gap: 4 },
  prodName: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  prodArtisan: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary },
  prodPrice: { fontSize: theme.size.lg, fontWeight: "800", color: theme.colors.brand, marginTop: 4 },
});
