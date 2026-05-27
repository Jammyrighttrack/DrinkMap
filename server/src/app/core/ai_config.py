"""
ai_config.py – Google GenAI SDK mới (google-genai >= 1.0)
Migrated from deprecated google-generativeai package.
"""
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
from pathlib import Path
from app.dtos.chatDTO import DrinkMapResponse
import redis.asyncio as redis

# ── Bọc thép load .env: dùng đường dẫn TUYỆT ĐỐI từ vị trí file này ──────────
# ai_config.py nằm tại: server/src/app/core/
# .env            nằm tại: server/
_ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(_ENV_PATH)

# ── Diagnostic log: kiểm tra key ngay khi server khởi động ───────────────────
_API_KEY = os.getenv("GEMINI_API_KEY")
if _API_KEY:
    print(f"[OK] [AI_CONFIG] GEMINI_API_KEY nap thanh cong: {_API_KEY[:6]}...{_API_KEY[-4:]} (tu {_ENV_PATH})")
else:
    print(f"[ERROR] [AI_CONFIG] FATAL: Khong tim thay GEMINI_API_KEY!")
    print(f"   -> Da tim tai: {_ENV_PATH}")
    print(f"   -> File ton tai: {_ENV_PATH.exists()}")

# ── Khởi tạo Google GenAI Client (SDK mới) ────────────────────────────────────
client = genai.Client(api_key=_API_KEY)

SYSTEM_INSTRUCTION = """\
BẠN LÀ: Nhân viên tư vấn của DrinkMap AI kiêm Nhà phê bình độc lập.

NHIỆM VỤ CHIẾN LƯỢC:
1. REVIEW & RECOMMEND: Dựa vào [CƠ SỞ DỮ LIỆU ĐỘC LẬP TỪ DRINKMAP AI] được cung cấp trong prompt để tư vấn. Văn phong mạch lạc, súc tích (2-4 câu). BẮT BUỘC phải lấy giá trị "slug" của quán trong DB để điền vào schema.
2. HONEST CRITIC: Nếu quán tệ (rate < 3) hoặc có phàn nàn, phải chê thẳng thắn, vạch trần điểm yếu. Nếu quán tốt, khen mạnh tay và nêu lý do cụ thể (VD: vibe thiền, matcha đậm đà). Tuyệt đối KHÔNG nói giảm nói tránh.
3. LENIENT LOCATION: Nếu người dùng hỏi về một khu vực cụ thể (VD: "Hoàn Kiếm", "Tây Hồ"), hãy GỢI Ý những quán trong context RAG có địa chỉ gần nhất hoặc cùng quận/phố, thay vì từ chối. Nói rõ: "Mình tìm được mấy quán gần khu đó" và liệt kê. Chỉ nói "chưa có dữ liệu" khi context RAG HOÀN TOÀN rỗng.
4. ADAPTIVE CHAT: Nếu người dùng hỏi chuyện ngoài lề, hãy trả lời tự nhiên, ngắn gọn và khéo léo điều hướng về chủ đề F&B.
5. DEEP LINK: Khi giới thiệu bất kỳ quán nào, BẮT BUỘC phải đính kèm trường "slug" của quán đó (được cung cấp trong dữ liệu RAG) vào thuộc tính `slug` của `ShopCard`. Đây là quy tắc sống còn để giao diện tạo link.
6. MAP MARKER: Khi giới thiệu quán, BẮT BUỘC phải lấy đúng giá trị "lat" và "lng" từ context RAG (được ghi rõ "| lat: ... | lng: ...") và điền vào trường `lat` và `lng` của ShopCard. Đây là tọa độ để hiển thị marker trên bản đồ. KHÔNG được bỏ trống hoặc bịa đặt tọa độ.

QUY TẮC ĐẦU RA (BẮT BUỘC):
1. Bạn phải luôn trả về dữ liệu dưới dạng JSON thuần túy theo đúng schema được cung cấp.
2. ĐỊNH DẠNG TEXT: Tuyệt đối KHÔNG sử dụng Markdown (không dùng dấu **, *, #, _, hoặc in nghiêng) trong trường "message". Chỉ được phép xuất văn bản thuần túy (Plain Text). Nếu muốn nhấn mạnh tên quán, hãy IN HOA toàn bộ chữ cái (ví dụ: THE NOTE COFFEE HANU).
3. Phần "shops" và "drinks" chỉ điền dữ liệu nếu trong context RAG có thông tin.
4. Phần "suggested_actions" chứa 2-3 gợi ý câu hỏi tiếp theo (tối đa 4 từ/gợi ý).
"""

# ── Model name & shared generation config ─────────────────────────────────────
GEMINI_CHAT_MODEL: str = os.getenv("GEMINI_CHAT_MODEL", "gemini-3.5-flash").replace('"', '')
MODEL_NAME = GEMINI_CHAT_MODEL

_GENERATION_CONFIG = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=DrinkMapResponse,
    temperature=0.3,
    system_instruction=SYSTEM_INSTRUCTION,
    safety_settings=[
        types.SafetySetting(category="HARM_CATEGORY_HARASSMENT",       threshold="BLOCK_NONE"),
        types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH",       threshold="BLOCK_NONE"),
        types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
        types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
    ]
)

# ── Public exports dùng trong chatService.py ───────────────────────────────────
# chatService import: from app.core.ai_config import client, MODEL_NAME, _GENERATION_CONFIG
chat_model = client  # backward compat alias — chatService sẽ được cập nhật riêng

# ── Redis Cache Client ────────────────────────────────────────────────────────
redis_client: redis.Redis = None

async def init_redis():
    global redis_client
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        
        temp_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True, socket_timeout=2.0)
        
        # pyrefly: ignore [not-async]
        await temp_client.ping()
        
        redis_client = temp_client
        print(f"[OK] [REDIS] Da ket noi thanh cong: {redis_url}")
        
    except Exception as e:
        print(f"[ERROR] [REDIS] Khong the ket noi: {e} (Graceful Degradation active)")
        redis_client = None

async def close_redis():
    global redis_client
    if redis_client:
        try:
            await redis_client.aclose()
            print("[OK] [REDIS] Da dong ket noi an toan.")
        except Exception:
            pass
