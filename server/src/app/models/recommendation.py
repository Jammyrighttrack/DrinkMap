from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class RecommendedShop(BaseModel):
    shop_id: str
    score: float
    reason: Optional[str] = None  # Ví dụ: "Gần bạn", "Trùng sở thích #chill"

class Recommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Danh sách các quán được gợi ý đã phân tích bởi AI/Logic
    recommended_shops: List[RecommendedShop] = []
    
    # Thời điểm tính toán
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
