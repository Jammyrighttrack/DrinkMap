"""
chatDTO.py – Pydantic + TypedDict schemas cho Chat API.

QUAN TRỌNG:
- ShopCard.price_range_vnd là Optional vì DB hiện tại không có trường này.
  Thay thế bằng rating hiển thị trong RAG context.
- DrinkMapResponse dùng typing_extensions.TypedDict để tương thích
  với google.genai response_schema.
"""
from pydantic import BaseModel
import typing_extensions as typing
from typing import List, Dict, Any, Optional


class ShopCard(typing.TypedDict):
    name: str
    price_range_vnd: str          # Ví dụ: "30.000 - 80.000 VND" – AI tự ước lượng nếu DB không có
    address: str
    cover_image: str
    slug: str                     # BẮt BUỘC – dùng cho deep link /shop/:slug
    lat: float                    # Vĩ độ – centroid của location polygon (dùng cho Map marker)
    lng: float                    # Kinh độ – centroid của location polygon (dùng cho Map marker)


class DrinkCard(typing.TypedDict):
    name: str
    price_vnd: int                # Giá số nguyên (VND)
    shop_name: str
    image_url: str


class DrinkMapResponse(typing.TypedDict):
    message: str                  # Plain text – KHÔNG dùng Markdown/bold/italic
    shops: List[ShopCard]         # Rỗng nếu không tìm được quán phù hợp
    drinks: List[DrinkCard]       # Rỗng nếu không có dữ liệu đồ uống
    suggested_actions: List[str]  # 2–3 gợi ý câu hỏi tiếp theo (≤ 4 từ/gợi ý)


class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []
    lat: Optional[float] = None
    lng: Optional[float] = None
