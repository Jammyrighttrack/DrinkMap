"""
seed.py
=======
Reads the three clean JSON files produced by convert_data.py, generates
text embeddings for each shop using the Google GenAI SDK (google-genai >= 1.0),
and upserts all data into MongoDB Atlas.

Run from the `server/` directory:
    python scripts/seed.py

Prerequisites:
  1. Run `python scripts/convert_data.py` first to produce the JSON files.
  2. Ensure server/.env exists with MONGO_URL, DB_NAME, and GEMINI_API_KEY set.
  3. Create (or verify) a Vector Search index named "vector_index" on the
     `shops` collection, pointing at the `embedding` field.
"""

import json
import uuid
import time
import os
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
from google import genai


# ── Environment ───────────────────────────────────────────────────────────────
# Resolve .env relative to this script's location so the script works whether
# called from `server/` or `server/scripts/`.
_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(_ENV_PATH)

MONGO_URI       = os.getenv("MONGO_URL")
DB_NAME         = os.getenv("DB_NAME")
GEMINI_API_KEY  = os.getenv("GEMINI_API_KEY")

# Validate at startup — fail fast with a clear message
if not MONGO_URI:
    raise EnvironmentError("❌ MONGO_URL is not set in .env")
if not DB_NAME:
    raise EnvironmentError("❌ DB_NAME is not set in .env")
if not GEMINI_API_KEY:
    raise EnvironmentError("❌ GEMINI_API_KEY is not set in .env")

# ── Google GenAI client (new SDK: google-genai >= 1.0) ───────────────────────
ai_client = genai.Client(api_key=GEMINI_API_KEY)
EMBED_MODEL = "models/gemini-embedding-2"   # 768-dim, matches vector_index config

# ── Paths — relative to the `server/` working directory ──────────────────────
DATA_DIR     = Path(__file__).resolve().parents[1] / "src" / "app" / "data"
SHOPS_JSON   = DATA_DIR / "shops.json"
DRINKS_JSON  = DATA_DIR / "drinks.json"
REVIEWS_JSON = DATA_DIR / "reviews.json"


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_json(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(
            f"❌ Không tìm thấy '{path}'.\n"
            f"   → Hãy chạy `python scripts/convert_data.py` trước!"
        )
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def embed_shop(shop: dict) -> list[float]:
    """Generate a text embedding for a single shop document."""
    content = (
        f"Tên quán: {shop['name']}, "
        f"Địa chỉ: {shop.get('address', '')}, "
        f"Mô tả: {shop.get('description', '')}, "
        f"Tags: {', '.join(shop.get('tags', []))}"
    )
    response = ai_client.models.embed_content(
        model=EMBED_MODEL,
        contents=content,
    )
    return response.embeddings[0].values


# ── Main pipeline ─────────────────────────────────────────────────────────────

def seed():
    print("=" * 60)
    print("  seed.py — DrinkMap Database Seeding Pipeline")
    print("=" * 60)
    print(f"  DB  : {DB_NAME}")
    print(f"  Host: {MONGO_URI[:40]}...")
    print()

    # ── 1. Load JSON files ────────────────────────────────────────────────────
    print("[1/4] Đọc dữ liệu từ src/app/data/ ...")
    shops   = load_json(SHOPS_JSON)
    drinks  = load_json(DRINKS_JSON)
    reviews = load_json(REVIEWS_JSON)
    print(f"      → {len(shops)} shops, {len(drinks)} drinks, {len(reviews)} reviews")

    # ── 2. Generate embeddings for shops ─────────────────────────────────────
    print(f"\n[2/4] Tạo embeddings cho {len(shops)} quán (nghỉ 3s mỗi 10 quán)...")
    shops_to_insert: list[dict] = []

    for i, shop in enumerate(shops):
        # Ensure each shop has a stable string `id` (convert_data.py injects
        # this field, but guard here in case someone feeds a legacy shops.json)
        if "id" not in shop or not shop["id"]:
            shop["id"] = str(uuid.uuid4())

        # MongoDB uses _id — mirror the string id so queries on both work
        shop["_id"] = shop["id"]

        try:
            shop["embedding"] = embed_shop(shop)
        except Exception as exc:
            print(f"   ⚠️  Embedding thất bại cho '{shop['name']}': {exc}")
            shop["embedding"] = []   # Seed without vector; RAG falls back to rating sort

        shops_to_insert.append(shop)

        # Rate-limit guard: pause every 10 requests
        if (i + 1) % 10 == 0:
            print(f"   ⏳ {i + 1}/{len(shops)} quán xong — tạm nghỉ 3s ...")
            time.sleep(3)

    # ── 3. Prepare drinks & reviews ───────────────────────────────────────────
    # convert_data.py already writes `shop_id` (UUID string) on every drink/
    # review. We only need to inject a unique `id` per document here.
    print(f"\n[3/4] Chuẩn bị drinks & reviews ...")

    drinks_to_insert: list[dict] = []
    for d in drinks:
        d["id"] = str(uuid.uuid4())
        drinks_to_insert.append(d)

    reviews_to_insert: list[dict] = []
    for r in reviews:
        r["id"] = str(uuid.uuid4())
        reviews_to_insert.append(r)

    print(f"      → {len(drinks_to_insert)} drinks, {len(reviews_to_insert)} reviews sẵn sàng")

    # ── 4. Write to MongoDB ───────────────────────────────────────────────────
    print(f"\n[4/4] Kết nối MongoDB và upsert dữ liệu ...")
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    # Clear collections first to guarantee idempotent re-runs
    print("   🗑️  Xóa dữ liệu cũ trong shops / drinks / reviews ...")
    db["shops"].delete_many({})
    db["drinks"].delete_many({})
    db["reviews"].delete_many({})

    # Insert shops
    if shops_to_insert:
        db["shops"].insert_many(shops_to_insert)
        print(f"   ✅ Đã bơm {len(shops_to_insert)} shops → collection 'shops'")

    # Insert drinks
    if drinks_to_insert:
        db["drinks"].insert_many(drinks_to_insert)
        print(f"   ✅ Đã bơm {len(drinks_to_insert)} drinks → collection 'drinks'")

    # Insert reviews
    if reviews_to_insert:
        db["reviews"].insert_many(reviews_to_insert)
        print(f"   ✅ Đã bơm {len(reviews_to_insert)} reviews → collection 'reviews'")

    client.close()

    # ── Done ──────────────────────────────────────────────────────────────────
    print()
    print("🎉  SEED HOÀN TẤT!")
    print()
    print("QUAN TRỌNG — Bước tiếp theo trên MongoDB Atlas:")
    print("  1. Vào Search → Create Index → chọn collection 'shops'")
    print("  2. Tạo index tên 'vector_index', trỏ vào field 'embedding'")
    print("  3. numDimensions: 768  (text-embedding-004)")
    print("  4. similarity: cosine")
    print("=" * 60)


if __name__ == "__main__":
    seed()