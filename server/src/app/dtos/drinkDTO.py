from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class DrinkCreateRequest(BaseModel):
    """
    Contract tạo đồ uống trong menu.
    """
    shop_id: str
    name: str
    description: Optional[str] = None
    price: float
    image: Optional[str] = None
    category: Optional[Literal["coffee", "tea", "milk_tea", "juice", "smoothie", "other"]] = "other"
    is_available: bool = True


class DrinkUpdateRequest(BaseModel):
    """
    Contract cập nhật đồ uống.
    """
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    category: Optional[Literal["coffee", "tea", "milk_tea", "juice", "smoothie", "other"]] = None
    is_available: Optional[bool] = None


class DrinkResponse(BaseModel):
    """
    Contract trả về đồ uống.
    """
    id: str
    shop_id: str
    name: str
    description: Optional[str] = None
    price: float
    image: Optional[str] = None
    category: str
    is_available: bool
    created_at: datetime
