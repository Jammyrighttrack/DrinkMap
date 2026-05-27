import asyncio
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv(".env")
MONGO_URI = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

def test_integrity():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    shops_count = db.shops.count_documents({})
    drinks_count = db.drinks.count_documents({})
    reviews_count = db.reviews.count_documents({})
    
    print(f"=== LỚP 1: DATA INTEGRITY CHECK ===")
    print(f"Tổng số Shops: {shops_count}")
    print(f"Tổng số Drinks: {drinks_count}")
    print(f"Tổng số Reviews: {reviews_count}")
    
    if shops_count > 0:
        sample_shop = db.shops.find_one()
        print(f"\n=== MẪU SHOP NGẪU NHIÊN ===")
        print(f"Tên quán (Name): {sample_shop.get('name')}")
        print(f"Slug: {sample_shop.get('slug', '❌ THIẾU SLUG!')}")
        
        loc = sample_shop.get('location')
        if loc and isinstance(loc, dict) and 'type' in loc and 'coordinates' in loc:
            print(f"Location (GeoJSON): ✅ Hợp lệ ({loc['coordinates']})")
        else:
            print(f"Location: ❌ KHÔNG PHẢI CHUẨN GEOJSON!")
            
        emb = sample_shop.get('embedding', [])
        if len(emb) > 0:
            print(f"Embedding Vector: ✅ Tồn tại ({len(emb)} chiều)")
        else:
            print(f"Embedding Vector: ❌ THIẾU EMBEDDING!")
            
    if shops_count == 0:
         print("\n⚠️ CHÚ Ý: Chưa có data nào. Cần chạy seed.py trước!")

if __name__ == "__main__":
    test_integrity()
