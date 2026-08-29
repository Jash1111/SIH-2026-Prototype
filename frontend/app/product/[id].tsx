import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";
import { api, Product } from "@/src/api";
import { storage } from "@/src/utils/storage";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.product(id).then(setProduct).catch(() => {});
    (async () => {
      const ids = (await storage.getItem<string[]>("wishlist", [])) || [];
      setLiked(ids.includes(id));
    })();
  }, [id]);

  const toggleLike = async () => {
    const ids = (await storage.getItem<string[]>("wishlist", [])) || [];
    if (ids.includes(id!)) {
      await storage.setItem("wishlist", ids.filter((x) => x !== id));
      setLiked(false);
    } else {
      await storage.setItem("wishlist", [...ids, id!]);
      setLiked(true);
    }
  };

  const contactWhatsApp = async () => {
    if (!product?.artisan) return;
    await api.createInquiry(product.id).catch(() => {});
    const phone = product.artisan.phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Hello ${product.artisan.name}, I'm interested in your "${product.name}" listed on KalaKriti.`);
    const url = `https://wa.me/${phone}?text=${msg}`;
    Linking.openURL(url).catch(() => {});
  };

  if (!product) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.imgWrap}>
          <Image source={{ uri: product.image_urls[0] }} style={styles.hero} contentFit="cover" />
          <LinearGradient colors={["rgba(43,37,33,0.55)", "transparent"]} style={styles.topScrim} />
          <View style={[styles.topBar, { top: insets.top + 8 }]}>
            <Pressable testID="back-btn" onPress={() => router.back()} style={styles.circleBtn}>
              <Ionicons name="chevron-back" size={26} color={theme.colors.onSurface} />
            </Pressable>
            <Pressable testID="fav-btn" onPress={toggleLike} style={styles.circleBtn}>
              <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? theme.colors.error : theme.colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.name} testID="product-name">{product.name}</Text>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.desc}>{product.description}</Text>

          {product.artisan && (
            <View style={styles.artisanCard}>
              <Image source={{ uri: product.artisan.photo_url }} style={styles.artisanImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.artisanLabel}>{t("about_artisan")}</Text>
                <Text style={styles.artisanName}>{product.artisan.name}</Text>
                <Text style={styles.artisanVillage}>{product.artisan.village}, {product.artisan.state}</Text>
                <Text style={styles.artisanYears}>{product.artisan.years_experience} {t("years_experience")}</Text>
              </View>
            </View>
          )}

          <Text style={styles.section}>{t("the_story")}</Text>
          <Text style={styles.story}>{product.story}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>{t("materials")}</Text>
              <Text style={styles.metaValue}>{product.materials || "—"}</Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>{t("dimensions")}</Text>
              <Text style={styles.metaValue}>{product.dimensions || "—"}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky WhatsApp CTA */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
        <Pressable testID="whatsapp-cta" onPress={contactWhatsApp} style={styles.waBtn}>
          <Ionicons name="logo-whatsapp" size={26} color="#fff" />
          <Text style={styles.waText}>{t("contact_whatsapp")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.surface },
  imgWrap: { width: "100%", height: 380, backgroundColor: theme.colors.surfaceTertiary },
  hero: { width: "100%", height: "100%" },
  topScrim: { position: "absolute", left: 0, right: 0, top: 0, height: 120 },
  topBar: { position: "absolute", left: theme.spacing.md, right: theme.spacing.md, flexDirection: "row", justifyContent: "space-between" },
  circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center" },
  body: { padding: theme.spacing.md, gap: theme.spacing.md },
  name: { fontSize: theme.size.xxl, fontWeight: "800", color: theme.colors.onSurface, lineHeight: 36 },
  price: { fontSize: theme.size.xl, fontWeight: "800", color: theme.colors.brand },
  desc: { fontSize: theme.size.base, color: theme.colors.onSurfaceSecondary, lineHeight: 24 },
  artisanCard: { flexDirection: "row", gap: theme.spacing.md, alignItems: "center", padding: theme.spacing.md, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.md },
  artisanImg: { width: 72, height: 72, borderRadius: 36 },
  artisanLabel: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, fontWeight: "600" },
  artisanName: { fontSize: theme.size.lg, fontWeight: "800", color: theme.colors.onSurface },
  artisanVillage: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary },
  artisanYears: { fontSize: theme.size.sm, color: theme.colors.brand, fontWeight: "700", marginTop: 2 },
  section: { fontSize: theme.size.lg, fontWeight: "700", color: theme.colors.onSurface },
  story: { fontSize: theme.size.base, color: theme.colors.onSurfaceSecondary, lineHeight: 26 },
  metaRow: { flexDirection: "row", gap: theme.spacing.md },
  metaCard: { flex: 1, backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.md, borderRadius: theme.radius.md, gap: 4 },
  metaLabel: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, fontWeight: "600" },
  metaValue: { fontSize: theme.size.base, color: theme.colors.onSurface, fontWeight: "700" },
  stickyBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.divider },
  waBtn: { flexDirection: "row", height: 60, backgroundColor: theme.colors.whatsapp, borderRadius: theme.radius.pill, alignItems: "center", justifyContent: "center", gap: theme.spacing.sm },
  waText: { color: "#fff", fontSize: theme.size.lg, fontWeight: "800" },
});
