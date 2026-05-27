import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
import os

# --- BOOTSTRAP: Đảm bảo Python tìm thấy module 'app' ---
script_dir = Path(__file__).resolve().parent
server_dir = script_dir.parent
src_dir = server_dir / "src"

if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

# --- Cấu hình & Import Database ---
load_dotenv(server_dir / ".env")
# pyrefly: ignore [missing-import]
from app.core.database import Database

# --- Cấu hình AI ---
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

async def test_search():
    query = "quán cafe không gian yên tĩnh để làm việc"
    print(f"🔍 Đang tìm kiếm với truy vấn: '{query}'")
    
    # 1. Tạo vector cho query
    try:
        result = genai.embed_content(model="models/gemini-embedding-2", content=query)
        query_vector = result['embedding']
    except Exception as e:
        print(f"❌ Lỗi AI Embedding: {e}")
        return
    
    # 2. Query MongoDB Atlas Vector Search
    await Database.connect_db()
    db = Database.get_db()
    
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 100,
                "limit": 3
            }
        },
        {"$project": {"name": 1, "description": 1, "score": {"$meta": "vectorSearchScore"}}}
    ]
    
    print("⏳ Đang gọi Atlas Vector Search...")
    results = await db.shops.aggregate(pipeline).to_list(length=None)
    
    if not results:
        print("⚠️ Không tìm thấy kết quả nào. Kiểm tra lại Index trên Atlas đã Active chưa?")
    else:
        for r in results:
            print(f"📍 Tìm thấy: {r.get('name', 'N/A')} (Score: {r.get('score', 0):.4f})")
            print(f"   Mô tả: {r.get('description', '')[:100]}...")

    await Database.close_db()

if __name__ == "__main__":
    # Fix encoding cho Windows Terminal
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    
    asyncio.run(test_search())