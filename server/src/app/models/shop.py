from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
import uuid

   
class Location(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float]  # [lng, lat]
   

class Shop(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    name: str
    description: Optional[str] = None
        
    address: str
    location: Location  # dùng cho geospatial query (MongoDB)

    category: List[str] = []  # ["coffee", "tea", "milk tea"]

    # media
    images: List[str] = []
    thumbnail: Optional[str] = None
      
    # rating (denormalized)
    average_rating: float = 0.0
    total_reviews: int = 0

    # price range
    price_range: Optional[Literal["low", "medium", "high"]] = None
      
    # opening hours (simple version)
    opening_hours: Optional[str] = None
      
    # tags phục vụ AI
    tags: List[str] = []  # ["chill", "study", "view đẹp"]

    # owner/admin tạo
    created_by: Optional[str] = None

    # status
    is_active: bool = True

    # timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
