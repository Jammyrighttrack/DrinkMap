import sys
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from pymongo import UpdateOne

# Cấu hình đường dẫn và Import (giữ nguyên)
script_dir = Path(__file__).resolve().parent
server_dir = script_dir.parent
src_dir = server_dir / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

load_dotenv(dotenv_path=server_dir / ".env")
# pyrefly: ignore [missing-import]
from app.core.database import Database

def calculate_centroid(geom):
    """Tính điểm trung tâm an toàn dựa trên loại geometry"""
    geom_type = geom.get("type")
    coords = geom.get("coordinates")

    # Nếu là Point, trả về chính nó
    if geom_type == "Point":
        return coords

    # Nếu là Polygon, tính trung tâm của vòng ngoài cùng (outer ring)
    if geom_type == "Polygon":
        # Polygon coords: [[[lng, lat], [lng, lat], ...]]
        points = coords[0] 
        lngs = [p[0] for p in points]
        lats = [p[1] for p in points]
        return [sum(lngs) / len(lngs), sum(lats) / len(lats)]
    
    # Nếu là loại khác (LineString, v.v.), trả về None
    return None

async def main():
    geojson_path = Path(r"D:\inclass\SS2-Project\SS2 project\DrinkMap-main\DrinkMap\server\connectMongo\export.geojson")
    
    if not geojson_path.exists():
        print(f"❌ Không tìm thấy file tại: {geojson_path}")
        return

    print(f"✅ Đang đọc dữ liệu từ: {geojson_path}")

    try:
        with open(geojson_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        print("🔌 Đang kết nối database...")
        await Database.connect_db()
        db = Database.get_db()

        operations = []
        features = data.get("features", [])
        
        print(f"🚀 Bắt đầu xử lý {len(features)} đối tượng...")

        # Xây dựng danh sách thao tác cập nhật
        for feature in features:
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})
            name = props.get("name")

            if name and geom:
                # Gọi hàm tính toán an toàn
                centroid = calculate_centroid(geom)
                
                if centroid:
                    point_geom = {"type": "Point", "coordinates": centroid}
                    
                    # UpdateOne
                    op = UpdateOne(
                        {"name": name},
                        {"$set": {"location": point_geom}}
                    )
                    operations.append(op)
                else:
                    # Nếu là loại geometry lạ (ví dụ LineString), ta bỏ qua
                    continue

        if operations:
            print(f"⚙️ Thực hiện bulk_write cho {len(operations)} đối tượng...")
            result = await db.shops.bulk_write(operations)
            print(f"✅ Đồng bộ hoàn tất!")
            print(f" - Khớp được theo tên: {result.matched_count} quán.")
            print(f" - Đã cập nhật tọa độ: {result.modified_count} quán.")
        else:
            print("⚠️ Không có dữ liệu hợp lệ (tên quán/tọa độ) để cập nhật.")

    except Exception as e:
        print(f"❌ Lỗi: {e}")
    finally:
        await Database.close_db()
        print("🏁 Đã đóng kết nối.")

if __name__ == "__main__":
    asyncio.run(main())