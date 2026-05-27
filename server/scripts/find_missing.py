import sys
import json
from pathlib import Path

# Thêm src vào path để import Database
script_dir = Path(__file__).resolve().parent
server_dir = script_dir.parent
src_dir = server_dir / "src"
sys.path.insert(0, str(src_dir))

# pyrefly: ignore [missing-import]
from app.core.database import Database

async def find_missing():
    # Đường dẫn
    geojson_path = server_dir / "connectMongo" / "export.geojson"
    
    # Kết nối DB để lấy danh sách quán hiện có
    await Database.connect_db()
    db = Database.get_db()
    
    # Lấy tất cả tên quán hiện có trong DB (dùng projection để tối ưu)
    cursor = db.shops.find({}, {"name": 1})
    existing_shops = {doc["name"].lower() async for doc in cursor}
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        osm_data = json.load(f)

    missing_shops = []
    seen = set()

    for feature in osm_data.get("features", []):
        props = feature.get("properties", {})
        osm_name = props.get("name")
        
        if osm_name and osm_name.lower() not in existing_shops and osm_name.lower() not in seen:
            missing_shops.append({
                "name": osm_name,
                "address": props.get("addr:street", "Địa chỉ chưa cập nhật"),
                "category": ["Cà phê"], # Mặc định để bạn dễ phân loại
                "location": feature.get("geometry", {})
            })
            seen.add(osm_name.lower())

    # Lưu kết quả
    output_path = script_dir / "missing_shops.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(missing_shops, f, ensure_ascii=False, indent=2)

    print(f"📊 Tìm thấy {len(missing_shops)} quán trong OSM chưa có trong DB.")
    print(f"📝 Danh sách đã lưu tại: {output_path}")
    await Database.close_db()

if __name__ == "__main__":
    import asyncio
    asyncio.run(find_missing())