import json
import uuid
import os
import random
from pymongo import MongoClient
from dotenv import load_dotenv
from google import genai
import re

# 1. CẤU HÌNH KẾT NỐI
load_dotenv("../.env") 

MONGO_URI = os.getenv("MONGO_URI")  
DB_NAME = os.getenv("DB_NAME")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

ai_client = genai.Client(api_key=GEMINI_API_KEY)
EMBED_MODEL = "models/gemini-embedding-2"

def create_slug(text: str) -> str:
    replacements = [
        (r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a'), (r'[èéẹẻẽêềếệểễ]', 'e'), (r'[ìíịỉĩ]', 'i'),
        (r'[òóọỏõôồốộổỗơờớợởỡ]', 'o'), (r'[ùúụủũưừứựửữ]', 'u'), (r'[ỳýỵỷỹ]', 'y'), (r'đ', 'd'),
    ]
    text = text.lower()
    for pattern, replacement in replacements:
        text = re.sub(pattern, replacement, text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    return re.sub(r'[\s-]+', '-', text).strip('-')

def embed_shop(shop_name, shop_address, shop_desc, shop_tags) -> list[float]:
    # Tránh rate limit của Gemini bằng cách luôn trả về mảng rỗng. 
    # RAG sẽ tự động fallback sang tìm kiếm theo rating và location.
    return []

def seed_system_data(geojson_path, drinks_path):
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    shops_collection = db["shops"]
    drinks_collection = db["drinks"]

    print("Đang đọc file GeoJSON...")
    try:
        with open(geojson_path, "r", encoding="utf-8") as f:
            geojson_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file {geojson_path}")
        return

    print("Đang đọc file đồ uống mẫu drinks.json...")
    try:
        with open(drinks_path, "r", encoding="utf-8") as f:
            raw_drinks = json.load(f)
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file {drinks_path}")
        return

    features = geojson_data.get("features", [])
    if not features:
        print("⚠️ File GeoJSON không có dữ liệu.")
        return

    # Chuẩn hóa lại Category cho trùng khớp 100% với Frontend UI
    for d in raw_drinks:
        if d.get("category") == "tea":
            d["category"] = "Fruit tea"

    shops_to_insert = []
    drinks_to_insert = []

    # Bộ lọc gu không gian chuẩn 3 tiêu chí của Frontend
    mock_tags = ["date lãng mạn", "working space", "đồ uống ngon", "view đẹp & chill", "cổ điển", "hiện đại"]
    premium_streets = ["lê thái tổ", "hàng khay", "đinh tiên hoàng", "nhà thờ", "tràng tiền", "lý thường kiệt", "trần hưng đạo"]
   
    COFFEE_IMAGES = [
    "https://images.unsplash.com/photo-1541658016709-82535e94bc69",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
    "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7",
    "https://images.unsplash.com/photo-1507133750040-4a8f57021571",
    "https://images.unsplash.com/photo-1497935586351-b67a49e012bf",
    "https://images.unsplash.com/photo-1498804103079-a6351b050096",
    "https://images.unsplash.com/photo-1485182708500-e8f1f318ba72",
    "https://images.unsplash.com/photo-1509315811345-672d83ef2fbc",
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb",
    "https://images.unsplash.com/photo-1481833761820-0509d3217039",
    "https://images.unsplash.com/photo-1502581827181-9cf3c3ee0106",
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8",
    "https://images.unsplash.com/photo-1536256263959-770b48d82b0a",
    "https://images.unsplash.com/photo-1453614512568-c4024d13c247",
    "https://images.unsplash.com/photo-1521017432531-fbd92d768814",
    "https://images.unsplash.com/photo-1524350876685-274059332603",
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3",
    "https://images.unsplash.com/photo-1512568400610-62da28bc8a13",
    "https://images.unsplash.com/photo-1497515114629-f71d768fd07c",
    "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56",
    "https://images.unsplash.com/photo-1511920170033-f8396924c348",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31",
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
    "https://images.unsplash.com/photo-1463797221720-6b07e6426c24",
    "https://images.unsplash.com/photo-1541167760496-1628856ab772",
]

    print("⚡ Đang đúc khuôn shops và bơm MENU ĐỒ SỘ (10-14 món) cho từng quán...")
    
    for feature in features:
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})

        name = props.get("name")
        if not name:
            continue 

        street = props.get("addr:street", "")
        housenumber = props.get("addr:housenumber", "")
        city = props.get("addr:city", "Hà Nội")
        address = f"{housenumber} {street}".strip() if street else "Địa chỉ chưa cập nhật"

        shop_uuid = str(uuid.uuid4())
        street_lower = street.lower()
        is_premium = any(p_street in street_lower for p_street in premium_streets)
        
        # Thiết lập mức giá tổng quan và lọc danh sách món nền tảng
        if is_premium:
            price_range = 3
            tags = ["view đẹp & chill", "đồ uống ngon", random.choice(["date lãng mạn", "hiện đại"])]
            base_drinks = [d for d in raw_drinks if d.get("category") in ["coffee", "matcha", "sweet & cake"]]
        else:
            price_range = random.randint(1, 2)
            tags = random.sample(mock_tags, k=random.randint(2, 3))
            base_drinks = raw_drinks

        # Chọn ngẫu nhiên 3 đến 5 ảnh cho quán
        shop_images = random.sample(COFFEE_IMAGES, k=random.randint(3, 5))
        thumbnail = shop_images[0]

        # Đúc khuôn dữ liệu Quán nước
        slug = f"{create_slug(name)}-{str(uuid.uuid4())[:6]}"
        description = "Không gian tuyệt vời để thưởng thức đồ uống và thư giãn cùng bạn bè."
        
        shop_doc = {
            "_id": shop_uuid,
            "id": shop_uuid,
            "name": name,
            "slug": slug,
            "address": address,
            "city": city,
            "location": geom,
            "price_range": price_range,
            "tags": list(set(tags)),
            "average_rating": round(random.uniform(3.8, 5.0), 1),
            "total_reviews": random.randint(5, 120),
            "images": shop_images,
            "cover_image": thumbnail,
            "thumbnail": thumbnail,
            "description": description,
            "is_active": True
        }
        shop_doc["embedding"] = embed_shop(shop_doc["name"], shop_doc["address"], shop_doc["description"], shop_doc["tags"])
        
        shops_to_insert.append(shop_doc)

        if len(shops_to_insert) % 15 == 0:
            import time
            time.sleep(2)
            print(f"   ⏳ {len(shops_to_insert)} quán xong — tạm nghỉ 2s ...")

        # ── XỬ LÝ BƠM MENU ĐỒ SỘ (TỪ 10 ĐẾN 14 MÓN) ──
        # Đảm bảo quán lấy tối đa số lượng món có thể từ bộ data mẫu
        num_of_drinks = random.randint(10, 14)
        num_of_drinks = min(num_of_drinks, len(base_drinks)) # Giới hạn nếu danh sách base_drinks ít hơn
             
        chosen_drinks = random.sample(base_drinks, k=num_of_drinks)
        
        for drink in chosen_drinks:
            # Thuật toán biến tấu giá tiền dựa theo phân khúc giá (price_range) của quán để menu thực tế hơn
            original_price = drink.get("price", 35000)
            if price_range == 3: # Quán cao cấp
                custom_price = original_price + random.choice([10000, 15000, 20000]) # Tăng giá lên
            elif price_range == 1: # Quán bình dân
                custom_price = max(20000, original_price - random.choice([5000, 8000])) # Giảm giá xuống
            else: # Quán trung bình
                custom_price = original_price + random.choice([-3000, 0, 3000, 5000]) # Biến động nhẹ
                
            drink_doc = {
                "id": str(uuid.uuid4()),
                "shop_id": shop_uuid, # Khớp mã liên kết ID
                "name": drink.get("name"),
                "price": int(custom_price),
                "category": drink.get("category"),
                "image_url": drink.get("image_url", ""),
                "is_available": True
            }
            drinks_to_insert.append(drink_doc)

    # 4. ĐẨY LÊN MONGO ATLAS
    print("🧹 Đang làm sạch các bộ dữ liệu cũ trên Atlas...")
    shops_collection.delete_many({})
    drinks_collection.delete_many({})

    if shops_to_insert:
        print(f"🚀 Đang đẩy {len(shops_to_insert)} Quán nước lên Atlas...")
        shops_collection.insert_many(shops_to_insert)
        
        print(f"🍹 Đang đẩy {len(drinks_to_insert)} Món nước đồ sộ lên Atlas...")
        drinks_collection.insert_many(drinks_to_insert)
        
        print("\n✅ THÀNH CÔNG RỰC RỠ!")
        print(f"- Tổng số quán: {len(shops_to_insert)}")
        print(f"- Tổng số món nước được tạo ra: {len(drinks_to_insert)} món (Trung bình ~12 món/quán).")
    else:
        print("⚠️ Không có dữ liệu hợp lệ.")

if __name__ == "__main__":
    seed_system_data("export.geojson", "drinks.json")