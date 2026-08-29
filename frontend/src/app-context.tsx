import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";

export type LangCode = "en" | "hi" | "ta" | "bn";

const STRINGS: Record<string, Record<LangCode, string>> = {
  app_name: { en: "KalaKriti", hi: "कलाकृति", ta: "கலாக்ரிதி", bn: "কলাকৃতি" },
  tagline: {
    en: "Handmade with love, from Indian villages",
    hi: "भारत के गांवों से, प्रेम से बना",
    ta: "இந்திய கிராமங்களில் இருந்து, அன்புடன்",
    bn: "ভারতের গ্রাম থেকে, ভালোবাসায় তৈরি",
  },
  choose_language: { en: "Choose your language", hi: "अपनी भाषा चुनें", ta: "உங்கள் மொழியைத் தேர்ந்தெடுங்கள்", bn: "আপনার ভাষা নির্বাচন করুন" },
  i_want_to_buy: { en: "I want to Buy", hi: "मुझे खरीदना है", ta: "நான் வாங்க வேண்டும்", bn: "আমি কিনতে চাই" },
  i_want_to_sell: { en: "I want to Sell", hi: "मुझे बेचना है", ta: "நான் விற்க வேண்டும்", bn: "আমি বিক্রি করতে চাই" },
  buyer_subtitle: { en: "Discover handmade crafts", hi: "हस्तनिर्मित कलाओं की खोज करें", ta: "கைவினைப்பொருட்களைக் கண்டறியுங்கள்", bn: "হস্তনির্মিত কারুশিল্প আবিষ্কার করুন" },
  seller_subtitle: { en: "Sell your crafts online", hi: "अपनी कला ऑनलाइन बेचें", ta: "உங்கள் கைவினைப்பொருட்களை விற்கவும்", bn: "আপনার কারুশিল্প বিক্রি করুন" },
  continue_btn: { en: "Continue", hi: "जारी रखें", ta: "தொடர", bn: "চালিয়ে যান" },
  home: { en: "Home", hi: "होम", ta: "முகப்பு", bn: "হোম" },
  categories: { en: "Categories", hi: "श्रेणियां", ta: "வகைகள்", bn: "বিভাগ" },
  wishlist: { en: "Wishlist", hi: "पसंदीदा", ta: "விருப்பப்பட்டியல்", bn: "উইশলিস্ট" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल", ta: "சுயவிவரம்", bn: "প্রোফাইল" },
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड", ta: "டாஷ்போர்டு", bn: "ড্যাশবোর্ড" },
  my_crafts: { en: "My Crafts", hi: "मेरी कलाएं", ta: "என் கைவினைகள்", bn: "আমার কারুশিল্প" },
  messages: { en: "Messages", hi: "संदेश", ta: "செய்திகள்", bn: "বার্তা" },
  add_product_ai: { en: "Add Product with AI Magic", hi: "AI जादू से उत्पाद जोड़ें", ta: "AI மந்திரத்துடன் தயாரிப்பைச் சேர்க்கவும்", bn: "AI ম্যাজিক দিয়ে পণ্য যোগ করুন" },
  add_product_sub: { en: "Snap a photo, AI writes it for you", hi: "फोटो लें, AI आपके लिए लिखेगा", ta: "படம் எடுக்கவும், AI உங்களுக்காக எழுதும்", bn: "ছবি তুলুন, AI আপনার জন্য লিখবে" },
  search_placeholder: { en: "Search crafts, artisans...", hi: "कला, कारीगर खोजें...", ta: "தேடு...", bn: "অনুসন্ধান করুন..." },
  featured_artisans: { en: "Featured Artisans", hi: "विशेष कारीगर", ta: "சிறப்பு கைவினைஞர்கள்", bn: "বিশেষ কারিগর" },
  all_crafts: { en: "All Crafts", hi: "सभी कलाएं", ta: "அனைத்து கைவினைகள்", bn: "সব কারুশিল্প" },
  contact_whatsapp: { en: "Contact on WhatsApp", hi: "WhatsApp पर संपर्क करें", ta: "WhatsApp இல் தொடர்பு", bn: "WhatsApp-এ যোগাযোগ" },
  about_artisan: { en: "About the Artisan", hi: "कारीगर के बारे में", ta: "கைவினைஞர் பற்றி", bn: "কারিগর সম্পর্কে" },
  the_story: { en: "The Story", hi: "कहानी", ta: "கதை", bn: "গল্প" },
  materials: { en: "Materials", hi: "सामग्री", ta: "பொருட்கள்", bn: "উপকরণ" },
  dimensions: { en: "Size", hi: "आकार", ta: "அளவு", bn: "আকার" },
  years_experience: { en: "years of craft", hi: "साल का अनुभव", ta: "ஆண்டுகள் அனுபவம்", bn: "বছরের অভিজ্ঞতা" },
  step_1_photo: { en: "Step 1: Take a photo", hi: "चरण 1: फोटो लें", ta: "படி 1: புகைப்படம் எடுங்கள்", bn: "ধাপ ১: ছবি তুলুন" },
  step_2_category: { en: "Step 2: Choose category", hi: "चरण 2: श्रेणी चुनें", ta: "படி 2: வகையைத் தேர்ந்தெடுக்கவும்", bn: "ধাপ ২: বিভাগ নির্বাচন করুন" },
  step_3_tell: { en: "Step 3: Tell us about it", hi: "चरण 3: इसके बारे में बताएं", ta: "படி 3: எங்களிடம் சொல்லுங்கள்", bn: "ধাপ ৩: আমাদের বলুন" },
  step_4_review: { en: "Step 4: Review & save", hi: "चरण 4: समीक्षा और सहेजें", ta: "படி 4: மதிப்பாய்வு", bn: "ধাপ ৪: পর্যালোচনা করুন" },
  tap_to_take_photo: { en: "Tap to take a photo of your craft", hi: "अपनी कला की फोटो लेने के लिए टैप करें", ta: "படம் எடுக்க தட்டவும்", bn: "আপনার কারুশিল্পের ছবি তুলতে ট্যাপ করুন" },
  camera: { en: "Camera", hi: "कैमरा", ta: "கேமரா", bn: "ক্যামেরা" },
  gallery: { en: "Gallery", hi: "गैलरी", ta: "கேலரி", bn: "গ্যালারি" },
  next: { en: "Next", hi: "अगला", ta: "அடுத்து", bn: "পরবর্তী" },
  back: { en: "Back", hi: "पीछे", ta: "பின்", bn: "পিছনে" },
  save: { en: "Save Product", hi: "उत्पाद सहेजें", ta: "சேமிக்கவும்", bn: "সংরক্ষণ করুন" },
  generate_ai: { en: "Generate with AI", hi: "AI से बनाएं", ta: "AI உடன் உருவாக்கு", bn: "AI দিয়ে তৈরি করুন" },
  ai_working: { en: "AI is creating your story...", hi: "AI आपकी कहानी बना रहा है...", ta: "AI உங்கள் கதையை உருவாக்குகிறது...", bn: "AI আপনার গল্প তৈরি করছে..." },
  product_name: { en: "Product Name", hi: "उत्पाद का नाम", ta: "தயாரிப்பு பெயர்", bn: "পণ্যের নাম" },
  description: { en: "Description", hi: "विवरण", ta: "விவரம்", bn: "বিবরণ" },
  story: { en: "Story", hi: "कहानी", ta: "கதை", bn: "গল্প" },
  price: { en: "Price (₹)", hi: "मूल्य (₹)", ta: "விலை (₹)", bn: "মূল্য (₹)" },
  suggested: { en: "AI suggested", hi: "AI ने सुझाया", ta: "AI பரிந்துரை", bn: "AI প্রস্তাবিত" },
  tell_us_input: { en: "Type or describe your craft (any language)", hi: "अपनी कला का वर्णन करें (किसी भी भाषा में)", ta: "உங்கள் கைவினை பற்றி விவரிக்கவும்", bn: "আপনার কারুশিল্প বর্ণনা করুন" },
  empty_wishlist: { en: "No favorites yet", hi: "अभी कोई पसंदीदा नहीं", ta: "பிடித்தவை இல்லை", bn: "কোন প্রিয় নেই" },
  empty_products: { en: "No products yet. Add your first craft!", hi: "अभी कोई उत्पाद नहीं। अपनी पहली कला जोड़ें!", ta: "இதுவரை தயாரிப்புகள் இல்லை", bn: "এখনও কোনো পণ্য নেই" },
  saved: { en: "Product saved!", hi: "उत्पाद सहेजा गया!", ta: "சேமிக்கப்பட்டது!", bn: "সংরক্ষিত হয়েছে!" },
  from: { en: "from", hi: "से", ta: "இருந்து", bn: "থেকে" },
  switch_role: { en: "Switch Role", hi: "भूमिका बदलें", ta: "பாத்திரம் மாற்று", bn: "ভূমিকা পরিবর্তন" },
  change_language: { en: "Change Language", hi: "भाषा बदलें", ta: "மொழி மாற்று", bn: "ভাষা পরিবর্তন" },
  people_asked: { en: "people asked about crafts", hi: "लोगों ने कला के बारे में पूछा", ta: "பேர் விசாரித்தனர்", bn: "জন জিজ্ঞাসা করেছেন" },
  view_story: { en: "View Story", hi: "कहानी देखें", ta: "கதையைப் பார்க்கவும்", bn: "গল্প দেখুন" },
  inquiries: { en: "Inquiries", hi: "पूछताछ", ta: "விசாரணைகள்", bn: "অনুসন্ধান" },
  no_inquiries: { en: "No inquiries yet", hi: "अभी कोई पूछताछ नहीं", ta: "விசாரணைகள் இல்லை", bn: "কোন অনুসন্ধান নেই" },
};

type Ctx = {
  lang: LangCode;
  role: "buyer" | "artisan" | null;
  setLang: (l: LangCode) => Promise<void>;
  setRole: (r: "buyer" | "artisan" | null) => Promise<void>;
  t: (key: keyof typeof STRINGS) => string;
  hydrated: boolean;
};

const AppContext = createContext<Ctx | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<LangCode>("en");
  const [role, setRoleState] = useState<"buyer" | "artisan" | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const l = await storage.getItem<string>("lang", "en");
      const r = await storage.getItem<string>("role", "");
      if (l) setLangState(l as LangCode);
      if (r === "buyer" || r === "artisan") setRoleState(r);
      setHydrated(true);
    })();
  }, []);

  const setLang = useCallback(async (l: LangCode) => {
    setLangState(l);
    await storage.setItem("lang", l);
  }, []);
  const setRole = useCallback(async (r: "buyer" | "artisan" | null) => {
    setRoleState(r);
    await storage.setItem("role", r ?? "");
  }, []);

  const t = useCallback(
    (key: keyof typeof STRINGS) => STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? String(key),
    [lang],
  );

  return (
    <AppContext.Provider value={{ lang, role, setLang, setRole, t, hydrated }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
};

export const LANG_OPTIONS: { code: LangCode; label: string; script: string }[] = [
  { code: "en", label: "English", script: "English" },
  { code: "hi", label: "हिन्दी", script: "Hindi" },
  { code: "ta", label: "தமிழ்", script: "Tamil" },
  { code: "bn", label: "বাংলা", script: "Bengali" },
];
