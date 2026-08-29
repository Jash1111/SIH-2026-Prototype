import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";
import { api, catName, Category, Product } from "@/src/api";

export default function CategoryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useApp();
  const [items, setItems] = useState<Product[]>([]);
  const [cat, setCat] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!key) return;
    (async () => {
      const [prods, cats] = await Promise.all([api.products({ category: key }), api.categories()]);
      setItems(prods);
      setCat(cats.find((c) => c.key === key) || null);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [key]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable testID="cat-back" onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>{cat ? catName(cat, lang) : ""}</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading ? (
        <ActivityIndicator color={theme.colors.brand} size="large" style={{ marginTop: 32 }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>{t("empty_products")}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.md }}
          contentContainerStyle={{ paddingTop: theme.spacing.sm, gap: theme.spacing.md, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Pressable testID={`cat-prod-${item.id}`} onPress={() => router.push(`/product/${item.id}`)} style={styles.card}>
              <Image source={{ uri: item.image_urls[0] }} style={styles.img} contentFit="cover" />
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.sub}>{item.artisan_village}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md, gap: theme.spacing.md },
  title: { flex: 1, fontSize: theme.size.xl, fontWeight: "800", color: theme.colors.onSurface, textAlign: "center" },
  empty: { textAlign: "center", color: theme.colors.onSurfaceSecondary, fontSize: theme.size.base, marginTop: 40 },
  card: { flex: 1, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, overflow: "hidden" },
  img: { width: "100%", height: 150 },
  body: { padding: theme.spacing.sm, gap: 4 },
  name: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  sub: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary },
  price: { fontSize: theme.size.base, fontWeight: "800", color: theme.colors.brand },
});
