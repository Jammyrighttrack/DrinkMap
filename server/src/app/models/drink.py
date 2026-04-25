from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
import uuid

class Drink(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_id: str
    
    name: str
    description: Optional[str] = None
    price: float
    
    image: Optional[str] = None
    category: Optional[Literal["coffee", "tea", "milk_tea", "juice", "smoothie", "other"]] = "other"
    
    is_available: bool = True
    
    # timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

