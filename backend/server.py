from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Response
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging
import json
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent Object Storage
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "kalakriti"
storage_key: Optional[str] = None


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


app = FastAPI()
api_router = APIRouter(prefix="/api")


# ============ Models ============
class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str
    name_en: str
    name_hi: str
    name_ta: str
    name_bn: str
    icon: str
    image_url: str


class Artisan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    village: str
    state: str
    craft: str
    phone: str
    photo_url: str
    story: str
    years_experience: int = 10
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    story: str
    price: int
    category_key: str
    artisan_id: str
    image_urls: List[str] = []
    materials: str = ""
    dimensions: str = ""
    language: str = "en"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductCreate(BaseModel):
    name: str
    description: str
    story: str
    price: int
    category_key: str
    artisan_id: str
    image_urls: List[str] = []
    materials: str = ""
    dimensions: str = ""
    language: str = "en"


class AIGenerateRequest(BaseModel):
    category_key: str
    voice_hint: str = ""  # what artisan said (in any language)
    language: str = "en"  # target output language: en, hi, ta, bn
    materials: str = ""


class AIGenerateResponse(BaseModel):
    name: str
    description: str
    story: str
    suggested_price: int
    materials: str
    dimensions: str


class TranslateRequest(BaseModel):
    text: str
    target_language: str  # en, hi, ta, bn


class InquiryCreate(BaseModel):
    product_id: str
    buyer_name: str = "Guest"


# ============ Helpers ============
def doc_clean(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


LANG_NAMES = {"en": "English", "hi": "Hindi", "ta": "Tamil", "bn": "Bengali"}


# ============ Category & Seed ============
@api_router.get("/categories")
async def get_categories():
    cursor = db.categories.find({}, {"_id": 0})
    return await cursor.to_list(100)


@api_router.get("/artisans")
async def get_artisans():
    cursor = db.artisans.find({}, {"_id": 0})
    return await cursor.to_list(100)


@api_router.get("/artisans/{artisan_id}")
async def get_artisan(artisan_id: str):
    doc = await db.artisans.find_one({"id": artisan_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Artisan not found")
    return doc


@api_router.get("/products")
async def list_products(category: Optional[str] = None, artisan_id: Optional[str] = None):
    query = {}
    if category:
        query["category_key"] = category
    if artisan_id:
        query["artisan_id"] = artisan_id
    cursor = db.products.find(query, {"_id": 0}).sort("created_at", -1)
    products = await cursor.to_list(200)
    # Attach artisan minimal info
    artisan_ids = list({p["artisan_id"] for p in products})
    artisans = {a["id"]: a async for a in db.artisans.find({"id": {"$in": artisan_ids}}, {"_id": 0})}
    for p in products:
        a = artisans.get(p["artisan_id"])
        if a:
            p["artisan_name"] = a["name"]
            p["artisan_village"] = a["village"]
            p["artisan_state"] = a["state"]
            p["artisan_photo"] = a["photo_url"]
    return products


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    a = await db.artisans.find_one({"id": p["artisan_id"]}, {"_id": 0})
    if a:
        p["artisan"] = a
    return p


@api_router.post("/products")
async def create_product(payload: ProductCreate):
    prod = Product(**payload.model_dump())
    doc = prod.model_dump()
    await db.products.insert_one(doc)
    return doc_clean(doc)


@api_router.post("/inquiries")
async def create_inquiry(payload: InquiryCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "product_id": payload.product_id,
        "buyer_name": payload.buyer_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.inquiries.insert_one(doc.copy())
    return doc


@api_router.get("/inquiries")
async def list_inquiries(artisan_id: Optional[str] = None):
    query = {}
    if artisan_id:
        prods = [p["id"] async for p in db.products.find({"artisan_id": artisan_id}, {"_id": 0, "id": 1})]
        query["product_id"] = {"$in": prods}
    cursor = db.inquiries.find(query, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(200)


# ============ AI ============
@api_router.post("/ai/generate-product", response_model=AIGenerateResponse)
async def ai_generate_product(payload: AIGenerateRequest):
    lang_name = LANG_NAMES.get(payload.language, "English")
    system = (
        "You are a helpful assistant for Indian rural artisans who sell handmade crafts. "
        "Given a craft category and short description from an artisan, generate warm, "
        "authentic marketing copy that celebrates Indian heritage. Always respond in the "
        f"requested language ({lang_name}) and return ONLY valid JSON matching this schema: "
        '{"name": string, "description": string (max 200 chars), '
        '"story": string (100-250 words, personal artisan story about the craft), '
        '"suggested_price": integer (in Indian Rupees, realistic for handmade item), '
        '"materials": string, "dimensions": string} '
        "Do not include markdown, code fences, or any extra text — only the JSON object."
    )
    prompt = (
        f"Category: {payload.category_key}\n"
        f"Artisan said: {payload.voice_hint or '(no additional details)'}\n"
        f"Materials hint: {payload.materials or '(none)'}\n"
        f"Language for output: {lang_name}\n"
        "Generate the product listing JSON now."
    )
    session_id = f"gen-{uuid.uuid4().hex}"
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=session_id,
            system_message=system,
        ).with_model("gemini", "gemini-3-flash-preview")
        result = await chat.send_message(UserMessage(text=prompt))
        text = result if isinstance(result, str) else str(result)
        # Strip potential code fences
        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        # find first { and last }
        s = text.find("{")
        e = text.rfind("}")
        if s >= 0 and e >= 0:
            text = text[s : e + 1]
        data = json.loads(text)
        return AIGenerateResponse(
            name=str(data.get("name", "Handmade Craft"))[:120],
            description=str(data.get("description", ""))[:400],
            story=str(data.get("story", ""))[:2000],
            suggested_price=int(data.get("suggested_price", 500) or 500),
            materials=str(data.get("materials", payload.materials or "")),
            dimensions=str(data.get("dimensions", "")),
        )
    except Exception as ex:
        logging.exception("AI generation failed: %s", ex)
        # Fallback content
        return AIGenerateResponse(
            name="Handcrafted Village Treasure",
            description="A beautiful handmade piece crafted with love by a village artisan.",
            story="Made with traditional techniques passed down through generations.",
            suggested_price=799,
            materials=payload.materials or "Natural materials",
            dimensions="Medium size",
        )


@api_router.post("/ai/translate")
async def ai_translate(payload: TranslateRequest):
    lang_name = LANG_NAMES.get(payload.target_language, "English")
    system = (
        f"You are a translator. Translate the input text to {lang_name}. "
        "Return ONLY the translated text with no explanations or extra formatting."
    )
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"trans-{uuid.uuid4().hex}",
            system_message=system,
        ).with_model("gemini", "gemini-3-flash-preview")
        result = await chat.send_message(UserMessage(text=payload.text))
        return {"translated": str(result).strip()}
    except Exception as ex:
        logging.exception("Translate failed: %s", ex)
        return {"translated": payload.text}


# ============ Uploads ============
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    ext = (file.filename or "img.jpg").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "heic"):
        ext = "jpg"
    path = f"{APP_NAME}/uploads/{uuid.uuid4().hex}.{ext}"
    data = await file.read()
    content_type = file.content_type or "image/jpeg"
    try:
        await run_in_threadpool(put_object, path, data, content_type)
    except Exception as ex:
        logging.exception("Upload failed: %s", ex)
        raise HTTPException(500, f"Upload failed: {ex}")
    return {"path": path, "url": f"/api/files/{path}"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    try:
        content, ct = await run_in_threadpool(get_object, path)
    except Exception as ex:
        logging.exception("Fetch failed: %s", ex)
        raise HTTPException(404, "Not found")
    return Response(content=content, media_type=ct)


# ============ Seed ============
CATEGORIES_SEED = [
    {"key": "pottery", "name_en": "Pottery", "name_hi": "मिट्टी के बर्तन", "name_ta": "மட்பாண்டம்", "name_bn": "মৃৎশিল্প", "icon": "flame", "image_url": "https://images.unsplash.com/photo-1635175994617-1a9d85cdf680?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"},
    {"key": "textiles", "name_en": "Textiles", "name_hi": "वस्त्र", "name_ta": "ஜவுளி", "name_bn": "বস্ত্র", "icon": "shirt", "image_url": "https://images.unsplash.com/photo-1660845683010-63e7422420b9?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"},
    {"key": "jewelry", "name_en": "Jewelry", "name_hi": "आभूषण", "name_ta": "நகைகள்", "name_bn": "গয়না", "icon": "diamond", "image_url": "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"},
    {"key": "paintings", "name_en": "Paintings", "name_hi": "चित्रकला", "name_ta": "ஓவியம்", "name_bn": "চিত্রকর্ম", "icon": "color-palette", "image_url": "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"},
    {"key": "woodcraft", "name_en": "Wood Craft", "name_hi": "काष्ठकला", "name_ta": "மரக்கலை", "name_bn": "কাঠশিল্প", "icon": "leaf", "image_url": "https://images.unsplash.com/photo-1533377088493-6fb14e02fd15?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"},
    {"key": "metalcraft", "name_en": "Metal Craft", "name_hi": "धातु शिल्प", "name_ta": "உலோகக்கலை", "name_bn": "ধাতুশিল্প", "icon": "hammer", "image_url": "https://images.unsplash.com/photo-1610736702394-52a2d1b0dfa5?crop=entropy&cs=srgb&fm=jpg&q=85&w=600"},
]

ARTISANS_SEED = [
    {"id": "art-1", "name": "Meena Devi", "village": "Khurja", "state": "Uttar Pradesh", "craft": "Blue Pottery", "phone": "919876543210", "photo_url": "https://images.unsplash.com/photo-1721508490084-1b1de5b230d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "story": "For 25 years, Meena has been shaping clay from the banks of the Ganga into beautiful blue pottery. She learned the craft from her mother-in-law and now teaches 12 women in her village.", "years_experience": 25, "created_at": datetime.now(timezone.utc)},
    {"id": "art-2", "name": "Ramesh Kumar", "village": "Channapatna", "state": "Karnataka", "craft": "Wooden Toys", "phone": "919812345678", "photo_url": "https://images.unsplash.com/photo-1615529162924-f8605388461d?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "story": "Ramesh comes from four generations of toy-makers. He hand-turns each toy on a wooden lathe and colors them with natural vegetable dyes.", "years_experience": 30, "created_at": datetime.now(timezone.utc)},
    {"id": "art-3", "name": "Lakshmi Nair", "village": "Aranmula", "state": "Kerala", "craft": "Handloom Weaving", "phone": "919845123456", "photo_url": "https://images.unsplash.com/photo-1631507623312-64cae4e8b0e8?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "story": "Lakshmi weaves stories into every sari on her handloom. Each piece takes 15 days and carries the fragrance of the Pamba river.", "years_experience": 20, "created_at": datetime.now(timezone.utc)},
    {"id": "art-4", "name": "Rajesh Mahato", "village": "Molela", "state": "Rajasthan", "craft": "Terracotta Plaques", "phone": "919823456789", "photo_url": "https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=srgb&fm=jpg&q=85&w=600", "story": "Rajesh crafts terracotta gods and folk heroes exactly as his ancestors did 500 years ago. Every plaque is fired in a wood kiln under the desert sun.", "years_experience": 22, "created_at": datetime.now(timezone.utc)},
]

PRODUCTS_SEED = [
    {"id": "p-1", "name": "Blue Pottery Serving Bowl", "description": "Hand-painted blue pottery bowl with floral motifs, perfect for salads and fruits.", "story": "This bowl was shaped on Meena's wheel and painted with cobalt blue pigments made from a family recipe.", "price": 890, "category_key": "pottery", "artisan_id": "art-1", "image_urls": ["https://images.unsplash.com/photo-1635175994617-1a9d85cdf680?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Clay, natural pigments", "dimensions": "20cm diameter", "language": "en", "created_at": datetime.now(timezone.utc)},
    {"id": "p-2", "name": "Terracotta Water Pitcher", "description": "Traditional earthen pitcher that naturally cools water — a village classic.", "story": "Fired in a wood kiln beside the river. Each pitcher takes 3 days to dry.", "price": 550, "category_key": "pottery", "artisan_id": "art-1", "image_urls": ["https://images.unsplash.com/photo-1610736702394-52a2d1b0dfa5?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Terracotta clay", "dimensions": "25cm tall", "language": "en", "created_at": datetime.now(timezone.utc)},
    {"id": "p-3", "name": "Wooden Lacquer Elephant", "description": "Handcarved wooden elephant with natural vegetable-dye finish. Toy-safe for children.", "story": "Ramesh turned this elephant on his 60-year-old lathe. The colors are made from turmeric, indigo and lac.", "price": 750, "category_key": "woodcraft", "artisan_id": "art-2", "image_urls": ["https://images.unsplash.com/photo-1615529162924-f8605388461d?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Wrightia wood, lac dye", "dimensions": "15cm x 12cm", "language": "en", "created_at": datetime.now(timezone.utc)},
    {"id": "p-4", "name": "Channapatna Rattle Toy Set", "description": "Set of 3 safe wooden rattles for babies — smooth, natural, non-toxic.", "story": "Ramesh's grandfather made the very first Channapatna rattle in 1935. This set keeps the tradition alive.", "price": 1250, "category_key": "woodcraft", "artisan_id": "art-2", "image_urls": ["https://images.unsplash.com/photo-1533377088493-6fb14e02fd15?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Ivory wood, natural colors", "dimensions": "10cm each", "language": "en", "created_at": datetime.now(timezone.utc)},
    {"id": "p-5", "name": "Kerala Handloom Cotton Saree", "description": "Pure cotton saree woven on a traditional pit loom with golden Kasavu border.", "story": "Lakshmi worked 18 days on this saree. The Kasavu border is real zari, passed down as a family motif.", "price": 3800, "category_key": "textiles", "artisan_id": "art-3", "image_urls": ["https://images.unsplash.com/photo-1660845683010-63e7422420b9?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Cotton, real zari", "dimensions": "6.3 metres", "language": "en", "created_at": datetime.now(timezone.utc)},
    {"id": "p-6", "name": "Handwoven Kalamkari Stole", "description": "Vegetable-dyed cotton stole with hand-block Kalamkari print.", "story": "Every motif tells a folk story from Andhra. Lakshmi's village women hand-dye the fabric in tamarind and iron water.", "price": 950, "category_key": "textiles", "artisan_id": "art-3", "image_urls": ["https://images.unsplash.com/photo-1631507623312-64cae4e8b0e8?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Cotton, natural dyes", "dimensions": "2m x 0.7m", "language": "en", "created_at": datetime.now(timezone.utc)},
    {"id": "p-7", "name": "Molela Terracotta Krishna Plaque", "description": "Sacred wall plaque of Lord Krishna, hand-shaped and fired in traditional kiln.", "story": "Rajesh's family has crafted these plaques for 500 years. Each one is unique and imperfect — that is its beauty.", "price": 1450, "category_key": "paintings", "artisan_id": "art-4", "image_urls": ["https://images.unsplash.com/photo-1578321272176-b7bbc0679853?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Terracotta, natural pigment", "dimensions": "30cm x 20cm", "language": "en", "created_at": datetime.now(timezone.utc)},
    {"id": "p-8", "name": "Silver Filigree Earrings", "description": "Delicate silver filigree earrings crafted in the classical Odisha style.", "story": "Fine as spider silk, these earrings were made using 92.5% silver by artisans in Cuttack.", "price": 2100, "category_key": "jewelry", "artisan_id": "art-4", "image_urls": ["https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"], "materials": "Sterling silver", "dimensions": "4cm long", "language": "en", "created_at": datetime.now(timezone.utc)},
]


@app.on_event("startup")
async def seed_data():
    # init storage (best effort)
    try:
        await run_in_threadpool(init_storage)
    except Exception as ex:
        logging.warning("Storage init failed: %s", ex)

    # categories
    if await db.categories.count_documents({}) == 0:
        cats = [Category(**c).model_dump() for c in CATEGORIES_SEED]
        await db.categories.insert_many(cats)
    # artisans
    if await db.artisans.count_documents({}) == 0:
        await db.artisans.insert_many([a.copy() for a in ARTISANS_SEED])
    # products
    if await db.products.count_documents({}) == 0:
        await db.products.insert_many([p.copy() for p in PRODUCTS_SEED])
    logging.info("Seed complete")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
