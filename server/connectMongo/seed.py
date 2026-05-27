import json
import uuid
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. CẤU HÌNH KẾT NỐI
load_dotenv("../.env") 

MONGO_URI = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

def seed_shops_from_geojson(file_path):
    # Kết nối tới MongoDB Atlas
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    shops_collection = db["shops"]

    
    print("Đang đọc file GeoJSON...")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file {file_path}")
        return

    features = data.get("features", [])
    if not features:
        print("⚠️ File GeoJSON không có dữ liệu (features rỗng).")
        return

    shops_to_insert = []

   
    print("Đang chuẩn hóa dữ liệu...")
    for feature in features:
        props = feature.get("properties", {})
        geom = feature.get("geometry", {})

        # Rút trích thông tin từ OpenStreetMap
        name = props.get("name")
        if not name:
            continue # Bỏ qua những điểm không có tên quán

        # Xử lý địa chỉ
        street = props.get("addr:street", "")
        housenumber = props.get("addr:housenumber", "")
        city = props.get("addr:city", "Hà Nội")
        address = f"{housenumber} {street}".strip() if street else "Địa chỉ chưa cập nhật"

        # Đúc vào khuôn chuẩn
        shop_doc = {
            "id": str(uuid.uuid4()),
            "name": name,
            "address": address,
            "city": city,
            "location": geom, # Giữ nguyên định dạng GeoJSON {type: "Point", coordinates: [lng, lat]}
            "category": ["Cà phê"],
            "rating": 0.0, # Điểm khởi tạo
            "is_active": True
        }
        shops_to_insert.append(shop_doc)

    # 4. ĐẨY LÊN ATLAS
    if shops_to_insert:
        print(f"🚀 Chuẩn bị đẩy {len(shops_to_insert)} quán lên MongoDB Atlas...")
        
        # Xóa dữ liệu cũ (Tùy chọn: Mở comment dòng dưới nếu muốn làm sạch DB trước khi bơm)
        # shops_collection.delete_many({}) 
        
        # Insert hàng loạt (Nhanh và tối ưu)
        result = shops_collection.insert_many(shops_to_insert)
        print(f"✅ THÀNH CÔNG! Đã bơm xong {len(result.inserted_ids)} quán vào database.")
    else:
        print("⚠️ Không có quán nào hợp lệ để thêm.")

if __name__ == "__main__":
    seed_shops_from_geojson("export.geojson")