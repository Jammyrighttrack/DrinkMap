"""
debug_db.py - Chay tu thu muc server/src
Usage: ..\..\.venv\Scripts\python.exe debug_db.py
"""
import asyncio
import os
import sys

# Fix Windows encoding
sys.stdout.reconfigure(encoding='utf-8')

# Load .env tu thu muc server/
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
if not os.path.exists(dotenv_path):
    dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")

from dotenv import load_dotenv
load_dotenv(dotenv_path)

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL  = os.getenv("MONGO_URL")
DB_NAME    = os.getenv("DB_NAME", "drinkmap")
GEMINI_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

print("=" * 60)
print("DrinkMap - Debug Script")
print("=" * 60)
print(f"MONGO_URL   : {'OK' if MONGO_URL else 'THIEU - Kiem tra .env!'}")
print(f"DB_NAME     : {DB_NAME}")
print(f"GEMINI_KEY  : {'OK' if GEMINI_KEY else 'THIEU!'}")
print()


async def main():
    if not MONGO_URL:
        print("MONGO_URL chua duoc set trong .env. Dung.")
        return

    print("[1/5] Dang ket noi MongoDB...")
    client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=10000)
    db = client[DB_NAME]

    try:
        await client.admin.command("ping")
        print("    -> Ket noi MongoDB thanh cong!\n")
    except Exception as e:
        print(f"    -> KHONG ket noi duoc MongoDB: {e}")
        return

    # 1. Dem documents
    print("=" * 60)
    print("[2/5] DEM DOCUMENTS TRONG CAC COLLECTION")
    print("=" * 60)
    collections = ["shops", "drinks", "reviews", "users"]
    counts = {}
    for col in collections:
        count = await db[col].count_documents({})
        counts[col] = count
        status = "OK" if count > 0 else "TRONG RONG"
        print(f"  {col:10}: {count:>6} documents  [{status}]")
    print()

    # 2. Cau truc document dau tien
    print("=" * 60)
    print("[3/5] DOCUMENT DAU TIEN TRONG 'shops'")
    print("=" * 60)
    first_shop = await db.shops.find_one({})
    if not first_shop:
        print("  CANH BAO: Collection 'shops' TRONG RONG!")
        print("  -> Day chinh la nguyen nhan RAG khong co du lieu!")
    else:
        for key, value in first_shop.items():
            if key == "embedding":
                emb_len = len(value) if isinstance(value, list) else "N/A"
                print(f"  {key:15}: [list {emb_len} phan tu] {'CO embedding' if emb_len > 0 else 'RONG - Can ingest!'}")
            elif key == "location":
                print(f"  {key:15}: {value}")
            else:
                val_str = str(value)[:100]
                print(f"  {key:15}: {val_str}")

    print()

    # 3. Dem shops co embedding
    print("=" * 60)
    print("[4/5] KIEM TRA EMBEDDING")
    print("=" * 60)
    shops_with_emb    = await db.shops.count_documents({"embedding": {"$exists": True, "$ne": []}})
    shops_without_emb = await db.shops.count_documents({"embedding": {"$exists": False}})
    total_shops       = counts["shops"]
    print(f"  Tong shops            : {total_shops}")
    print(f"  Shops CO embedding    : {shops_with_emb}   {'OK' if shops_with_emb > 0 else '-> Can chay ingest!'}")
    print(f"  Shops KHONG embedding : {shops_without_emb}")
    print()

    # 4. Thu Vector Search
    print("=" * 60)
    print("[5/5] THU VECTOR SEARCH")
    print("=" * 60)
    if not GEMINI_KEY:
        print("  Bo qua - khong co GEMINI_KEY")
    elif shops_with_emb == 0:
        print("  Bo qua - khong co shop nao co embedding")
        print("  -> Can chay script ingest truoc!")
    else:
        try:
            from google import genai
            ai_client = genai.Client(api_key=GEMINI_KEY)

            test_query = "ca phe ngon"
            print(f"  Query: '{test_query}'")
            resp = ai_client.models.embed_content(
                model="models/gemini-embedding-2",
                contents=test_query,
            )
            query_vector = resp.embeddings[0].values
            print(f"  Embedding tao thanh cong: {len(query_vector)} chieu")

            pipeline = [
                {"$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 50,
                    "limit": 3
                }},
                {"$project": {"_id": 1, "name": 1, "slug": 1, "score": {"$meta": "vectorSearchScore"}}}
            ]

            results = await db.shops.aggregate(pipeline).to_list(None)
            print(f"  Vector Search tra ve: {len(results)} ket qua")
            if results:
                for r in results:
                    print(f"    -> {r.get('name', '?')} (score: {r.get('score', 0):.4f}) | slug: {r.get('slug', '?')}")
            else:
                print("  KHONG CO KET QUA!")
                print("  -> Vao MongoDB Atlas > Search Indexes > kiem tra 'vector_index' da ACTIVE chua")

        except Exception as e:
            print(f"  Loi Vector Search: {e}")
            print()
            print("  Thu fallback find() thuong...")
            fallback = await db.shops.find({}).sort("rating", -1).limit(3).to_list(None)
            print(f"  Fallback tim thay: {len(fallback)} shops")
            for s in fallback:
                print(f"    -> {s.get('name', '?')} | rating: {s.get('rating', '?')}")

    print()
    print("=" * 60)
    print("KET LUAN:")
    print("=" * 60)
    if counts["shops"] == 0:
        print("  NGUYEN NHAN CHINH: DB 'shops' TRONG - Can import du lieu!")
    elif shops_with_emb == 0:
        print("  NGUYEN NHAN CHINH: Shops ton tai nhung KHONG CO embedding vector")
        print("  -> Chay script ingest/embed de tao vector embeddings")
    else:
        print("  DB co du lieu va co embedding")
        print("  -> Kiem tra Atlas Search Index 'vector_index' da active chua")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
