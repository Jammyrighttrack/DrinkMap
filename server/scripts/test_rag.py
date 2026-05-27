import asyncio
import time
import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


# Ensure the app module can be found
sys.path.append(os.path.abspath(os.path.join("DrinkMap-main", "server", "src")))
sys.path.append(os.path.abspath(os.path.join("server", "src"))) 

# pyrefly: ignore [missing-import]
from app.core.ai_config import init_redis, close_redis
# pyrefly: ignore [missing-import]
from app.crud.ragRepository import RAGRepository
# pyrefly: ignore [missing-import]
from app.core.database import Database

async def main():
    print("🚀 Bắt đầu Test RAG & Redis Cache...")
    await Database.connect_db()
    await init_redis()

    query = "quán cafe yên tĩnh để chạy deadline, có view chill"
    print(f"\n🔍 Query: '{query}'\n")

    print("▶️ LẦN 1: Đọc từ MongoDB Atlas (Kỳ vọng: CACHE MISS)")
    start_time = time.time()
    result1 = await RAGRepository.get_relevant_context(query)
    print(f"⏱️ Thời gian phản hồi: {time.time() - start_time:.4f} giây")
    if result1:
        print(f"📄 Dữ liệu trích xuất:\n{result1[:300]}...\n")
    else:
        print("⚠️ Không tìm thấy dữ liệu.\n")

    print("▶️ LẦN 2: Đọc từ Cache (Kỳ vọng: CACHE HIT ⚡)")
    start_time = time.time()
    result2 = await RAGRepository.get_relevant_context(query)
    print(f"⏱️ Thời gian phản hồi: {time.time() - start_time:.4f} giây\n")

    await close_redis()
    await Database.close_db()
    print("✅ Hoàn tất bài test.")

if __name__ == "__main__":
    asyncio.run(main())
