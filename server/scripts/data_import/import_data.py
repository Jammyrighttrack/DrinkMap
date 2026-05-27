"""
import_data.py
==============
Phase 3: Data Ingestion vao MongoDB Atlas su dung bulk_write.
Thu tu import: Shops -> Drinks -> Reviews.
Su dung _id = id de dam bao khong trung lap (upsert).
"""

import asyncio
import json
import sys
import uuid
from pathlib import Path

# Fix cp1252 UnicodeEncodeError on Windows PowerShell
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ── Paths & sys.path bootstrap ────────────────────────────────────────────────
script_dir = Path(__file__).resolve().parent
server_dir = script_dir.parents[1]  # server/
src_dir = server_dir / "src"

if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from dotenv import load_dotenv
from pymongo import ReplaceOne

# pyrefly: ignore [missing-import]
from app.core.database import Database

# Load environment
load_dotenv(server_dir / ".env")

DATA_DIR = src_dir / "app" / "data"
SHOPS_JSON   = DATA_DIR / "shops.json"
DRINKS_JSON  = DATA_DIR / "drinks.json"
REVIEWS_JSON = DATA_DIR / "reviews.json"

def load_json(path: Path) -> list[dict]:
    if not path.exists():
        print(f"  [MISSING FILE] Khong tim thay {path}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

async def import_collection(db, collection_name: str, docs: list[dict]):
    print(f"\n  [START] Dang nhap du lieu vao collection '{collection_name}'...")
    if not docs:
        print(f"  [SKIP] Khong co du lieu de nhap vao '{collection_name}'")
        return
    
    operations = []
    for doc in docs:
        # Dong bo _id va id de khong sinh ra _id tu dong gay trung lap
        doc_id = doc.get("id")
        if not doc_id:
            doc_id = str(uuid.uuid4())
            doc["id"] = doc_id
        
        doc["_id"] = doc_id
        
        # Su dung ReplaceOne de upsert (ghi de hoac tao moi, giu nguyen id)
        # Giup dam bao toan ven du lieu khi import nhieu lan.
        operations.append(
            ReplaceOne({"_id": doc_id}, doc, upsert=True)
        )
    
    if operations:
        collection = db[collection_name]
        result = await collection.bulk_write(operations, ordered=False)
        print(f"  [END] Nhap hoan tat '{collection_name}':")
        print(f"      - Matched:  {result.matched_count}")
        print(f"      - Modified: {result.modified_count}")
        print(f"      - Upserted: {result.upserted_count}")

async def main():
    print("=" * 60)
    print("  PHASE 3: IMPORT DATA TO MONGODB")
    print("=" * 60)
    
    # 1. Doc du lieu
    print("\n[1/3] Doc du lieu tu JSON...")
    shops = load_json(SHOPS_JSON)
    drinks = load_json(DRINKS_JSON)
    reviews = load_json(REVIEWS_JSON)
    print(f"  - Shops  : {len(shops)} docs")
    print(f"  - Drinks : {len(drinks)} docs")
    print(f"  - Reviews: {len(reviews)} docs")
    
    # 2. Ket noi DB
    print("\n[2/3] Ket noi database...")
    await Database.connect_db()
    db = Database.get_db()
    print("  [OK] Da ket noi.")
    
    # 3. Import tuan tu
    print("\n[3/3] Thuc hien Bulk Import (Upsert)...")
    try:
        # Thu tu bat buoc: Shops -> Drinks & Reviews
        await import_collection(db, "shops", shops)
        await import_collection(db, "drinks", drinks)
        await import_collection(db, "reviews", reviews)
        print("\n[PASS] Toan bo du lieu da duoc import thanh cong!")
    except Exception as e:
        print(f"\n[FAIL] Loi trong qua trinh import: {e}")
    finally:
        await Database.close_db()
        print("  Da dong ket noi database.")
        
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
