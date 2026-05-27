from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ReviewCreateRequest(BaseModel):
    """
    Contract tạo đánh giá mới cho một quán.
    Chứa rating (1-5), comment, list ảnh và tags hương vị.
    """
    shop_id: str
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: Optional[str] = None
    photos: List[str] = []
    taste_tags: List[str] = []  # ["ngọt", "đắng", "thanh"]


class ReviewResponse(BaseModel):
    """
    Contract trả về nội dung đánh giá của quán.
    Đã được nhúng thêm thông tin người đăng (user_name, user_avatar) 
    để frontend dễ hiển thị thay vì chỉ trả về user_id.
    """
    id: str
    shop_id: str
    
    # Thông tin của người đăng đánh giá (Denormalized hoặc Join)
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    
    rating: float
    comment: Optional[str] = None
    photos: List[str] = []
    taste_tags: List[str] = []
    
    created_at: Optional[datetime] = None
