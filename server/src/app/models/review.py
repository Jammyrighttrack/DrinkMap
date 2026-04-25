from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    rating: float = Field(..., ge=1.0, le=5.0)  # Rating từ 1 tới 5 sao
    comment: Optional[str] = None
    photos: List[str] = []
    taste_tags: List[str] = []  # Ví dụ: ["ngọt", "đắng", "thanh"]
    
    # timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
