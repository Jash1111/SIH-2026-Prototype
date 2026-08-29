import { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/src/theme";
import { useApp } from "@/src/app-context";
import { api, catName, Category, API_BASE } from "@/src/api";

const DEFAULT_ARTISAN_ID = "art-1";

type Step = 0 | 1 | 2 | 3;

export default function AddProduct() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, lang } = useApp();
  const [step, setStep] = useState<Step>(0);
  const [image, setImage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState<string>("");
  const [hint, setHint] = useState("");
  const [materials, setMaterials] = useState("");
  const [generating, setGenerating] = useState(false);
  const [ai, setAi] = useState<{ name: string; description: string; story: string; suggested_price: number; materials: string; dimensions: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [price, setPrice] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.categories().then(setCats).catch(() => {}); }, []);

  const pickImage = async (from: "camera" | "gallery") => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const perm = from === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const result = from === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"] as any, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"] as any, quality: 0.8 });
      if (result.canceled) return;
      const asset = result.assets[0];
      setImage(asset.uri);
      // Upload
      setUploading(true);
      const form = new FormData();
      const fileName = asset.uri.split("/").pop() || "photo.jpg";
      if (Platform.OS === "web") {
        const blob = await (await fetch(asset.uri)).blob();
        form.append("file", blob, fileName);
      } else {
        form.append("file", { uri: asset.uri, name: fileName, type: "image/jpeg" } as any);
      }
      try {
        const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
        const data = await res.json();
        if (data?.url) {
          setImageUrl(`${process.env.EXPO_PUBLIC_BACKEND_URL}${data.url}`);
        }
      } catch (e) { console.log("upload err", e); }
      setUploading(false);
    } catch (e) { console.log(e); }
  };

  const runAI = async () => {
    if (!cat) return;
    setGenerating(true);
    try {
      const data = await api.aiGenerate({ category_key: cat, voice_hint: hint, language: lang, materials });
      setAi(data);
      setName(data.name);
      setDescription(data.description);
      setStory(data.story);
      setPrice(String(data.suggested_price));
      setDimensions(data.dimensions);
      if (!materials && data.materials) setMaterials(data.materials);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setStep(3);
    } catch (e) { console.log(e); }
    setGenerating(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.createProduct({
        name,
        description,
        story,
        price: parseInt(price || "0", 10) || 0,
        category_key: cat,
        artisan_id: DEFAULT_ARTISAN_ID,
        image_urls: imageUrl ? [imageUrl] : image ? [image] : [],
        materials,
        dimensions,
        language: lang,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace("/(artisan)/products");
    } catch (e) { console.log(e); }
    setSaving(false);
  };

  const canNext = useMemo(() => {
    if (step === 0) return true; // photo optional
    if (step === 1) return !!cat;
    if (step === 2) return true;
    if (step === 3) return !!name && !!price;
    return false;
  }, [step, cat, name, price]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.surface }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <Pressable testID="wizard-back" onPress={() => (step === 0 ? router.back() : setStep((step - 1) as Step))}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.onSurface} />
        </Pressable>
        <View style={styles.progressWrap}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.progressDot, i <= step && { backgroundColor: theme.colors.brand }]} />
          ))}
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View>
            <Text style={styles.stepTitle}>{t("step_1_photo")}</Text>
            <Pressable testID="photo-slot" onPress={() => pickImage("camera")} style={styles.photoSlot}>
              {image ? (
                <Image source={{ uri: image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
              ) : (
                <View style={styles.photoEmpty}>
                  <Ionicons name="camera" size={64} color={theme.colors.brand} />
                  <Text style={styles.photoText}>{t("tap_to_take_photo")}</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              )}
            </Pressable>
            <View style={{ flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.md }}>
              <Pressable testID="camera-btn" onPress={() => pickImage("camera")} style={styles.smallBtn}>
                <Ionicons name="camera" size={22} color={theme.colors.brand} />
                <Text style={styles.smallBtnText}>{t("camera")}</Text>
              </Pressable>
              <Pressable testID="gallery-btn" onPress={() => pickImage("gallery")} style={styles.smallBtn}>
                <Ionicons name="images" size={22} color={theme.colors.brand} />
                <Text style={styles.smallBtnText}>{t("gallery")}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>{t("step_2_category")}</Text>
            <View style={styles.catGrid}>
              {cats.map((c) => (
                <Pressable
                  key={c.key}
                  testID={`cat-select-${c.key}`}
                  onPress={() => setCat(c.key)}
                  style={[styles.catCard, cat === c.key && styles.catCardActive]}
                >
                  <Image source={{ uri: c.image_url }} style={styles.catImg} contentFit="cover" />
                  <LinearGradient colors={["transparent", "rgba(43,37,33,0.9)"]} style={styles.catScrim} />
                  <Text style={styles.catLabel}>{catName(c, lang)}</Text>
                  {cat === c.key && (
                    <View style={styles.catCheck}>
                      <Ionicons name="checkmark-circle" size={28} color={theme.colors.brand} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>{t("step_3_tell")}</Text>
            <Text style={styles.helper}>{t("tell_us_input")}</Text>
            <TextInput
              testID="hint-input"
              value={hint}
              onChangeText={setHint}
              multiline
              placeholder="e.g., made from red clay from my village pond, blue floral design..."
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              style={styles.textArea}
            />
            <Text style={[styles.helper, { marginTop: theme.spacing.md }]}>{t("materials")}</Text>
            <TextInput
              testID="materials-input"
              value={materials}
              onChangeText={setMaterials}
              placeholder="clay, cotton, silver..."
              placeholderTextColor={theme.colors.onSurfaceTertiary}
              style={styles.input}
            />

            <Pressable
              testID="ai-generate-btn"
              onPress={runAI}
              disabled={!cat || generating}
              style={[styles.aiBtn, (!cat || generating) && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={[theme.colors.brand, "#E0783F"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {generating ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.aiBtnText}>{t("ai_working")}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={24} color="#fff" />
                  <Text style={styles.aiBtnText}>{t("generate_ai")}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>{t("step_4_review")}</Text>
            {ai && (
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={16} color={theme.colors.brand} />
                <Text style={styles.aiBadgeText}>{t("suggested")}</Text>
              </View>
            )}

            <Text style={styles.label}>{t("product_name")}</Text>
            <TextInput testID="review-name" value={name} onChangeText={setName} style={styles.input} />

            <Text style={styles.label}>{t("price")}</Text>
            <TextInput testID="review-price" value={price} onChangeText={setPrice} keyboardType="number-pad" style={styles.input} />

            <Text style={styles.label}>{t("description")}</Text>
            <TextInput testID="review-desc" value={description} onChangeText={setDescription} multiline style={[styles.input, { minHeight: 80 }]} />

            <Text style={styles.label}>{t("story")}</Text>
            <TextInput testID="review-story" value={story} onChangeText={setStory} multiline style={[styles.input, { minHeight: 140 }]} />

            <Text style={styles.label}>{t("dimensions")}</Text>
            <TextInput testID="review-dim" value={dimensions} onChangeText={setDimensions} style={styles.input} />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
        {step < 3 ? (
          <Pressable
            testID="wizard-next"
            onPress={() => setStep((step + 1) as Step)}
            disabled={!canNext}
            style={[styles.primaryBtn, !canNext && { opacity: 0.5 }]}
          >
            <Text style={styles.primaryBtnText}>{t("next")}</Text>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </Pressable>
        ) : (
          <Pressable testID="wizard-save" onPress={save} disabled={!canNext || saving} style={[styles.primaryBtn, (!canNext || saving) && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.primaryBtnText}>{t("save")}</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm, gap: theme.spacing.md },
  progressWrap: { flex: 1, flexDirection: "row", gap: 6, justifyContent: "center" },
  progressDot: { width: 40, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  stepTitle: { fontSize: theme.size.xl, fontWeight: "800", color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  photoSlot: { width: "100%", aspectRatio: 1, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surfaceSecondary, borderWidth: 2, borderColor: theme.colors.border, borderStyle: "dashed", overflow: "hidden" },
  photoEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing.md, padding: theme.spacing.lg },
  photoText: { fontSize: theme.size.base, color: theme.colors.onSurfaceSecondary, textAlign: "center" },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  smallBtn: { flex: 1, height: 56, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceSecondary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border },
  smallBtnText: { fontSize: theme.size.base, color: theme.colors.onSurface, fontWeight: "700" },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  catCard: { width: "47%", height: 130, borderRadius: theme.radius.md, overflow: "hidden", backgroundColor: theme.colors.surfaceTertiary, borderWidth: 3, borderColor: "transparent" },
  catCardActive: { borderColor: theme.colors.brand },
  catImg: { width: "100%", height: "100%" },
  catScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "70%" },
  catLabel: { position: "absolute", left: theme.spacing.sm, bottom: theme.spacing.sm, color: "#fff", fontSize: theme.size.base, fontWeight: "800" },
  catCheck: { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 20 },
  helper: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, marginBottom: theme.spacing.xs },
  textArea: { minHeight: 120, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.md, fontSize: theme.size.base, color: theme.colors.onSurface, textAlignVertical: "top", borderWidth: 1, borderColor: theme.colors.border },
  input: { height: 56, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceSecondary, paddingHorizontal: theme.spacing.md, fontSize: theme.size.base, color: theme.colors.onSurface, borderWidth: 1, borderColor: theme.colors.border },
  aiBtn: { marginTop: theme.spacing.lg, height: 60, borderRadius: theme.radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm, overflow: "hidden" },
  aiBtnText: { color: "#fff", fontSize: theme.size.lg, fontWeight: "800" },
  aiBadge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 4, backgroundColor: "#F9E9DF", paddingHorizontal: theme.spacing.sm, paddingVertical: 6, borderRadius: theme.radius.pill, marginBottom: theme.spacing.md },
  aiBadgeText: { fontSize: theme.size.sm, color: theme.colors.brand, fontWeight: "700" },
  label: { fontSize: theme.size.sm, color: theme.colors.onSurfaceSecondary, fontWeight: "600", marginTop: theme.spacing.md, marginBottom: theme.spacing.xs },
  footer: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.divider, backgroundColor: theme.colors.surface },
  primaryBtn: { height: 60, backgroundColor: theme.colors.brand, borderRadius: theme.radius.pill, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: theme.spacing.sm },
  primaryBtnText: { color: "#fff", fontSize: theme.size.lg, fontWeight: "800" },
});
