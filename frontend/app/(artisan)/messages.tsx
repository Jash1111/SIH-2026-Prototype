import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";
import { api, Product } from "@/src/api";

const DEFAULT_ARTISAN_ID = "art-1";

export default function Messages() {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  const [rows, setRows] = useState<any[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});

  useFocusEffect(useCallback(() => {
    (async () => {
      const [inq, prods] = await Promise.all([
        api.inquiries(DEFAULT_ARTISAN_ID),
        api.products({ artisan_id: DEFAULT_ARTISAN_ID }),
      ]);
      const map: Record<string, Product> = {};
      prods.forEach((p) => (map[p.id] = p));
      setProductMap(map);
      setRows(inq);
    })().catch(() => {});
  }, []));

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.title}>{t("inquiries")}</Text>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={80} color={theme.colors.borderStrong} />
          <Text style={styles.emptyText}>{t("no_inquiries")}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: theme.spacing.md, gap: theme.spacing.sm }}
          renderItem={({ item }) => {
            const p = productMap[item.product_id];
            return (
              <View style={styles.row} testID={`inquiry-${item.id}`}>
                <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Buyer asked about {p?.name || "your craft"}</Text>
                  <Text style={styles.rowSub}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            );
          }}
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
  row: { flexDirection: "row", gap: theme.spacing.md, alignItems: "center", backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md, padding: theme.spacing.md },
  rowTitle: { fontSize: theme.size.base, fontWeight: "700", color: theme.colors.onSurface },
  rowSub: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, marginTop: 2 },
});
