from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Checkin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: str
    user_id: str
      
    message: Optional[str] = None
    photos: List[str] = []  # Danh sách URL ảnh check-in
      
    # timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)

