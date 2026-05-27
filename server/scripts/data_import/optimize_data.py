"""
optimize_data.py
================
Phase 4: Post-Import Optimization
- Tinh toan average_rating va total_reviews tu collection reviews va cap nhat vao shops.
- Dam bao embedding ton tai hoac khoi tao [] de tranh loi he thong.
"""

import asyncio
import sys
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
from pymongo import UpdateOne

# pyrefly: ignore [missing-import]
from app.core.database import Database

# Load environment
load_dotenv(server_dir / ".env")

async def optimize():
    print("=" * 60)
    print("  PHASE 4: POST-IMPORT OPTIMIZATION")
    print("=" * 60)

    print("\n[1/3] Ket noi database...")
    await Database.connect_db()
    db = Database.get_db()
    print("  [OK] Da ket noi.")

    print("\n[2/3] Tinh toan rating va total_reviews...")
    
    # 1. Dung MongoDB Aggregation Framework de gom nhom review theo shop_id
    pipeline = [
        {
            "$group": {
                "_id": "$shop_id",
                "average_rating": {"$avg": "$rating"},
                "total_reviews": {"$sum": 1}
            }
        }
    ]
    
    cursor = db.reviews.aggregate(pipeline)
    
    # Chuyen thanh dict de de map theo shop_id
    # avg duoc round de lam tron 1 chu so thap phan (vi du 4.5)
    stats = {}
    async for doc in cursor:
        stats[doc["_id"]] = {
            "avg": round(doc["average_rating"], 1) if doc["average_rating"] else 0.0,
            "total": doc["total_reviews"]
        }
        
    print(f"  [INFO] Da tong hop thong ke cho {len(stats)} shops co reviews.")

    print("\n[3/3] Chuan hoa 'embedding' va luu vao collection shops...")
    shops_cursor = db.shops.find({}, {"_id": 1, "embedding": 1})
    
    operations = []
    async for shop in shops_cursor:
        shop_id = shop["_id"]
        
        # Lay stat hoac mac dinh 0 neu shop chua co bat ky review nao
        shop_stats = stats.get(shop_id, {"avg": 0.0, "total": 0})
        
        update_fields = {
            "average_rating": shop_stats["avg"],
            "total_reviews": shop_stats["total"]
        }
        
        # Kiem tra an toan cho field `embedding`: Neu chua co hoac khong phai list, gan mien cuong ve []
        if "embedding" not in shop or not isinstance(shop.get("embedding"), list):
            update_fields["embedding"] = []
            
        operations.append(
            UpdateOne(
                {"_id": shop_id},
                {"$set": update_fields}
            )
        )
        
    if operations:
        result = await db.shops.bulk_write(operations, ordered=False)
        print("  [END] Cap nhat hoan tat 'shops':")
        print(f"      - Matched : {result.matched_count} shops")
        print(f"      - Modified: {result.modified_count} shops")
    else:
        print("  [SKIP] Khong co shop nao can cap nhat.")

    await Database.close_db()
    print("\n[PASS] Toan bo Phase 4 da hoan tat thanh cong!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(optimize())
