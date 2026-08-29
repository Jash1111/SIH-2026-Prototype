const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export const API_BASE = `${BASE}/api`;

export type Category = {
  id: string;
  key: string;
  name_en: string;
  name_hi: string;
  name_ta: string;
  name_bn: string;
  icon: string;
  image_url: string;
};

export type Artisan = {
  id: string;
  name: string;
  village: string;
  state: string;
  craft: string;
  phone: string;
  photo_url: string;
  story: string;
  years_experience: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  story: string;
  price: number;
  category_key: string;
  artisan_id: string;
  image_urls: string[];
  materials: string;
  dimensions: string;
  language: string;
  artisan_name?: string;
  artisan_village?: string;
  artisan_state?: string;
  artisan_photo?: string;
  artisan?: Artisan;
};

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  categories: () => fetch(`${API_BASE}/categories`).then((r) => json<Category[]>(r)),
  artisans: () => fetch(`${API_BASE}/artisans`).then((r) => json<Artisan[]>(r)),
  artisan: (id: string) => fetch(`${API_BASE}/artisans/${id}`).then((r) => json<Artisan>(r)),
  products: (params?: { category?: string; artisan_id?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.artisan_id) qs.set("artisan_id", params.artisan_id);
    const q = qs.toString();
    return fetch(`${API_BASE}/products${q ? `?${q}` : ""}`).then((r) => json<Product[]>(r));
  },
  product: (id: string) => fetch(`${API_BASE}/products/${id}`).then((r) => json<Product>(r)),
  createProduct: (body: any) =>
    fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => json<Product>(r)),
  aiGenerate: (body: { category_key: string; voice_hint: string; language: string; materials: string }) =>
    fetch(`${API_BASE}/ai/generate-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) =>
      json<{
        name: string;
        description: string;
        story: string;
        suggested_price: number;
        materials: string;
        dimensions: string;
      }>(r),
    ),
  createInquiry: (product_id: string) =>
    fetch(`${API_BASE}/inquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id }),
    }).then((r) => json<any>(r)),
  inquiries: (artisan_id?: string) => {
    const qs = artisan_id ? `?artisan_id=${artisan_id}` : "";
    return fetch(`${API_BASE}/inquiries${qs}`).then((r) => json<any[]>(r));
  },
};

export function catName(c: Category, lang: string) {
  return (c as any)[`name_${lang}`] || c.name_en;
}
