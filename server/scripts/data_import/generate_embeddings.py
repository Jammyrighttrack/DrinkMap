"""
generate_embeddings.py
======================
Phase 4.5: Vector Embedding Injection
- Quet collection shops lay cac quan co embedding = [].
- Goi API Gemini de tao vector embedding.
- Xu ly rate limit, batching va log loi.
"""

import asyncio
import os
import sys
from pathlib import Path

# Fix cp1252 UnicodeEncodeError on Windows PowerShell
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

script_dir = Path(__file__).resolve().parent
server_dir = script_dir.parents[1]
src_dir = server_dir / "src"

if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from dotenv import load_dotenv
from pymongo import UpdateOne
from google import genai

# pyrefly: ignore [missing-import]
from app.core.database import Database

load_dotenv(server_dir / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    print("❌ Thieu GEMINI_API_KEY hoac GOOGLE_API_KEY trong .env")
    sys.exit(1)

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-2")

# Su dung SDK moi: google-genai
ai_client = genai.Client(api_key=GEMINI_API_KEY)

# File log loi
ERROR_LOG_FILE = script_dir / "embedding_errors.log"

def sanitize_text(shop: dict) -> str:
    """Sanitize and build text context for embedding."""
    name = shop.get("name", "").strip()
    
    cat_list = shop.get("category", [])
    category_joined = ", ".join(cat_list) if isinstance(cat_list, list) else str(cat_list)
    
    tags_list = shop.get("tags", [])
    tags_joined = ", ".join(tags_list) if isinstance(tags_list, list) else str(tags_list)
    
    address = shop.get("address", "").strip()
    desc = shop.get("description", "")
    if not isinstance(desc, str):
        desc = ""
    desc = " ".join(desc.split())
    
    # Cấu trúc template không có description để tính toán độ dài an toàn
    template_without_desc = f"[Tên] {name} | [Danh mục] {category_joined} | [Tags/Đặc trưng] {tags_joined} | [Mô tả]  | [Địa chỉ] {address}"
    
    # Tính không gian còn lại cho description (giới hạn 2000 ký tự)
    available_space = 2000 - len(template_without_desc)
    
    # Truncate thông minh: chỉ cắt description
    if available_space > 0 and desc:
        truncated_desc = desc[:available_space].strip()
    else:
        truncated_desc = ""
        
    final_text = f"[Tên] {name} | [Danh mục] {category_joined} | [Tags/Đặc trưng] {tags_joined} | [Mô tả] {truncated_desc} | [Địa chỉ] {address}"
    
    # Dọn dẹp khoảng trắng thừa lần cuối
    return " ".join(final_text.split())

async def generate_embeddings(dry_run=False, sample_only=False, force=False):
    print("=" * 60)
    print("  PHASE 4.5: VECTOR EMBEDDING INJECTION")
    print(f"  Model: {EMBEDDING_MODEL}")
    print("=" * 60)

    await Database.connect_db()
    db = Database.get_db()

    # Ép buộc quét toàn bộ shops theo yêu cầu mới nhất
    query = {}
    print("[WARNING] Đang quét TẤT CẢ shops để ghi đè embedding với template semantic mới.")
    
    shops_cursor = db.shops.find(query)
    
    shops_to_process = []
    async for shop in shops_cursor:
        shops_to_process.append(shop)

    total_shops = len(shops_to_process)
    print(f"[INFO] Tim thay {total_shops} shops can tao embedding.")

    if total_shops == 0:
        print("🎉 Tat ca shops da co embedding. Khong can xu ly gi them.")
        await Database.close_db()
        return

    if sample_only:
        print("\n[SAMPLE CHECK] Kiem tra dimension cua 1 mau...")
        sample_shop = shops_to_process[0]
        text = sanitize_text(sample_shop)
        try:
            res = ai_client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text
            )
            embedding = res.embeddings[0].values
            print(f"  Shop: {sample_shop['name']}")
            print(f"  Dimension (so chieu): {len(embedding)}")
            print("  ✅ Thanh cong lay mau!")
        except Exception as e:
            print(f"❌ Loi khi lay mau: {e}")
        await Database.close_db()
        return

    if dry_run:
        print("[DRY RUN] Dung lai, khong chay that.")
        await Database.close_db()
        return

    # Clear error log
    with open(ERROR_LOG_FILE, "w", encoding="utf-8") as f:
        f.write("=== LOG LOI EMBEDDING ===\n")

    print("\n🚀 Bat dau tien trinh tao embedding (Rate limit: 10 req / lan, nghi 5s)")
    
    success_count = 0
    error_count = 0
    operations = []

    for i, shop in enumerate(shops_to_process):
        shop_name = shop.get("name", "Unknown")
        text = sanitize_text(shop)
        
        try:
            res = ai_client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text
            )
            embedding = res.embeddings[0].values
            
            operations.append(
                UpdateOne(
                    {"_id": shop["_id"]},
                    {"$set": {"embedding": embedding}}
                )
            )
            print(f"  [{i+1}/{total_shops}] [OK] {shop_name}")
            success_count += 1
            
        except Exception as e:
            print(f"  [{i+1}/{total_shops}] [FAIL] {shop_name} - {str(e)}")
            with open(ERROR_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(f"[{shop_name}] Loi: {str(e)}\n")
            error_count += 1

        # Rate Limiting: Sau moi 10 requests, nghi 5 giay
        if (i + 1) % 10 == 0 and (i + 1) < total_shops:
            print("  ⏳ Nghi 5 giay de tranh Rate Limit...")
            await asyncio.sleep(5)

    if operations:
        print("\n💾 Luu vao database...")
        result = await db.shops.bulk_write(operations, ordered=False)
        print(f"  [OK] Da update {result.modified_count} shops.")
    
    print("\n" + "=" * 60)
    print(f"  TONG KET:")
    print(f"  Thanh cong: {success_count}/{total_shops}")
    print(f"  That bai  : {error_count}/{total_shops}")
    if error_count > 0:
        print(f"  Kiem tra file log: {ERROR_LOG_FILE}")
    print("=" * 60)

    await Database.close_db()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sample", action="store_true")
    parser.add_argument("--force", action="store_true", help="Ghi đè lại toàn bộ embedding hiện có")
    args = parser.parse_args()
    
    asyncio.run(generate_embeddings(dry_run=args.dry_run, sample_only=args.sample, force=args.force))
