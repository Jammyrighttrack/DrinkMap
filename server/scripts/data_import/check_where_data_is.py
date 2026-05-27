import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Bootstrap path
script_dir = Path(__file__).resolve().parent
server_dir = script_dir.parent.parent
src_dir = server_dir / "src"
sys.path.insert(0, str(src_dir))

load_dotenv(server_dir / ".env")
# pyrefly: ignore [missing-import]
from app.core.database import Database

async def detect_data():
    print("🔍 Đang kết nối và kiểm tra dữ liệu...")
    await Database.connect_db()
    db = Database.get_db()
    
    # Lấy thông tin client từ DB object (cách an toàn nhất với motor)
    client = db.client
    db_names = await client.list_database_names()
    
    print(f"📁 Tìm thấy các database: {db_names}")

    for db_name in db_names:
        if db_name in ['admin', 'local', 'config']:
            continue
            
        target_db = client[db_name]
        collections = await target_db.list_collection_names()
        print(f"\n👉 Database: '{db_name}' có các collection: {collections}")
        
        # Đếm dữ liệu nếu có collection 'shops'
        if 'shops' in collections:
            count = await target_db.shops.count_documents({})
            print(f"   => Collection 'shops' có: {count} document(s)")

    await Database.close_db()

if __name__ == "__main__":
    asyncio.run(detect_data())