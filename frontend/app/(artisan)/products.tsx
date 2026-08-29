import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";
import { api, Product } from "@/src/api";

const DEFAULT_ARTISAN_ID = "art-1";

export default function MyProducts() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [items, setItems] = useState<Product[]>([]);

  useFocusEffect(useCallback(() => {
    api.products({ artisan_id: DEFAULT_ARTISAN_ID }).then(setItems).catch(() => {});
  }, []));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("my_crafts")}</Text>
        <Pressable testID="add-btn" onPress={() => router.push("/add-product")} style={styles.addBtn}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      </View>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cube-outline" size={80} color={theme.colors.borderStrong} />
          <Text style={styles.emptyText}>{t("empty_products")}</Text>
          <Pressable onPress={() => router.push("/add-product")} style={styles.emptyBtn} testID="empty-add-btn">
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.emptyBtnText}>{t("add_product_ai")}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.md }}
          contentContainerStyle={{ paddingTop: theme.spacing.sm, gap: theme.spacing.md, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Pressable testID={`my-craft-${item.id}`} style={styles.card} onPress={() => router.push(`/product/${item.id}`)}>
              <Image source={{ uri: item.image_urls[0] }} style={styles.img} contentFit="cover" />
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
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
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md },
  title: { flex: 1, fontSize: theme.size.xxl, fontWeight: "800", color: theme.colors.onSurface },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.brand, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md, padding: theme.spacing.lg },
  emptyText: { color: theme.colors.onSurfaceSecondary, fontSize: theme.size.lg, textAlign: "center" },
  emptyBtn: { flexDirection: "row", gap: theme.spacing.sm, backgroundColor: theme.colors.brand, paddingHorizontal: theme.spacing.lg, height: 56, borderRadius: theme.radius.pill, alignItems: "center" },
  emptyBtnText: { color: "#fff", fontSize: theme.size.base, fontWeight: "700" },
  card: { flex: 1, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, overflow: "hidden" },
  img: { width: "100%", height: 140 },
  body: { padding: theme.spacing.sm, gap: 4 },
  name: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  price: { fontSize: theme.size.base, fontWeight: "800", color: theme.colors.brand },
});
