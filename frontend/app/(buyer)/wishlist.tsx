import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";
import { storage } from "@/src/utils/storage";
import { api, Product } from "@/src/api";

export default function Wishlist() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [items, setItems] = useState<Product[]>([]);

  const load = useCallback(async () => {
    const ids = (await storage.getItem<string[]>("wishlist", [])) || [];
    if (!ids.length) { setItems([]); return; }
    try {
      const all = await api.products();
      setItems(all.filter((p) => ids.includes(p.id)));
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async (id: string) => {
    const ids = (await storage.getItem<string[]>("wishlist", [])) || [];
    await storage.setItem("wishlist", ids.filter((x) => x !== id));
    setItems((x) => x.filter((p) => p.id !== id));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>{t("wishlist")}</Text>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={80} color={theme.colors.borderStrong} />
          <Text style={styles.emptyText}>{t("empty_wishlist")}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <Pressable testID={`wishlist-item-${item.id}`} style={styles.row} onPress={() => router.push(`/product/${item.id}`)}>
              <Image source={{ uri: item.image_urls[0] }} style={styles.rowImg} contentFit="cover" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.artisan_name}</Text>
                <Text style={styles.rowPrice}>₹{item.price}</Text>
              </View>
              <Pressable testID={`remove-${item.id}`} onPress={() => remove(item.id)} hitSlop={12}>
                <Ionicons name="close-circle" size={28} color={theme.colors.error} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  title: { fontSize: theme.size.xxl, fontWeight: "800", color: theme.colors.onSurface, padding: theme.spacing.md },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md },
  emptyText: { color: theme.colors.onSurfaceSecondary, fontSize: theme.size.lg },
  row: { flexDirection: "row", gap: theme.spacing.md, alignItems: "center", backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.sm },
  rowImg: { width: 80, height: 80, borderRadius: theme.radius.sm },
  rowName: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  rowSub: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary },
  rowPrice: { fontSize: theme.size.base, fontWeight: "800", color: theme.colors.brand },
});
