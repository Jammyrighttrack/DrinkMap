# -*- coding: utf-8 -*-
"""
check_persistence.py
====================
Kiểm tra xem MongoDB Atlas có dữ liệu không.
Chạy từ thư mục server/:
    python scripts/check_persistence.py

Nếu shops = 0 → cần chạy: python scripts/seed.py
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

# Load .env từ server/
_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(_ENV_PATH)

MONGO_URI = os.getenv("MONGO_URL")
DB_NAME   = os.getenv("DB_NAME", "drinkmap")

if not MONGO_URI:
    print("❌ MONGO_URL không tìm thấy trong .env!")
    exit(1)

print("=" * 55)
print("  DrinkMap — Kiểm tra dữ liệu MongoDB Atlas")
print("=" * 55)
print(f"  DB: {DB_NAME}")
print(f"  Host: {MONGO_URI[:45]}...")
print()

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[DB_NAME]

    shops_count   = db.shops.count_documents({})
    drinks_count  = db.drinks.count_documents({})
    reviews_count = db.reviews.count_documents({})

    print(f"  📦 shops   : {shops_count:>5} documents")
    print(f"  🥤 drinks  : {drinks_count:>5} documents")
    print(f"  ⭐ reviews : {reviews_count:>5} documents")
    print()

    if shops_count == 0:
        print("⚠️  CẢNH BÁO: shops collection RỖNG!")
        print("   → AI sẽ trả lời 'không có dữ liệu'")
        print()
        print("   Cách fix — chạy lệnh sau từ thư mục server/:")
        print("   python scripts/seed.py")
    else:
        print(f"✅ Dữ liệu ổn định! {shops_count} quán đang có trên Atlas.")

        # Kiểm tra xem shops có embedding chưa
        shops_with_embedding = db.shops.count_documents({"embedding": {"$exists": True, "$ne": []}})
        shops_without = shops_count - shops_with_embedding
        print(f"   🔢 Có embedding (vector search): {shops_with_embedding}/{shops_count}")
        if shops_without > 0:
            print(f"   ⚠️  {shops_without} quán chưa có embedding → RAG sẽ kém chính xác")
            print(f"      Fix: python scripts/seed.py (sẽ re-embed toàn bộ)")

        # In 3 quán mẫu
        print()
        print("  📍 3 quán mẫu trong DB:")
        for s in db.shops.find({}, {"name": 1, "address": 1, "slug": 1, "_id": 0}).limit(3):
            print(f"     • {s.get('name','?'):30s} | {s.get('address','?')[:40]} | slug={s.get('slug','N/A')}")

    client.close()

except Exception as e:
    print(f"❌ Không kết nối được MongoDB: {e}")
    print("   Kiểm tra lại MONGO_URL trong server/.env")

print()
print("=" * 55)
