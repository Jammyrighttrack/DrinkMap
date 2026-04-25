from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class LocationDTO(BaseModel):
    """
    Đại diện cho tọa độ địa lý chuẩn GeoJSON
    """
    type: Literal["Point"] = "Point"
    coordinates: List[float]  # [lng, lat]


class ShopCreateRequest(BaseModel):
    """
    Contract input khi Client gửi yêu cầu tạo Shop mới.
    Không chứa các field nhạy cảm hoặc do Server tự sinh (id, rating, created_by, timestamps...).
    """
    name: str
    description: Optional[str] = None
    address: str
    location: LocationDTO
    category: List[str] = []
    images: List[str] = []
    thumbnail: Optional[str] = None
    price_range: Optional[Literal["low", "medium", "high"]] = None
    opening_hours: Optional[str] = None
    tags: List[str] = []


class ShopUpdateRequest(BaseModel):
    """
    Contract input khi Client gửi yêu cầu update Shop.
    Tất cả các field đều là Optional để hỗ trợ Partial Update (PATCH/PUT).
    """
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    location: Optional[LocationDTO] = None
    category: Optional[List[str]] = None
    images: Optional[List[str]] = None
    thumbnail: Optional[str] = None
    price_range: Optional[Literal["low", "medium", "high"]] = None
    opening_hours: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ShopResponse(BaseModel):
    """
    Contract output trả về chi tiết một Shop cho Client.
    Đã lược bỏ/ẩn các field nhạy cảm nội bộ như: created_by (ID người tạo), is_active (thường list ra là đã active), updated_at.
    """
    id: str
    name: str
    description: Optional[str] = None
    address: str
    location: LocationDTO
    category: List[str] = []
    images: List[str] = []
    thumbnail: Optional[str] = None
    
    # Rating/Thống kê được trả về nhưng Client không được phép gửi lên
    average_rating: float = 0.0
    total_reviews: int = 0
    
    price_range: Optional[Literal["low", "medium", "high"]] = None
    opening_hours: Optional[str] = None
    tags: List[str] = []
    
    created_at: datetime


class ShopSummaryResponse(BaseModel):
    """
    Contract output rút gọn, dùng cho Map View (Pins) hoặc danh sách tìm kiếm 
    để tối ưu lượng payload (băng thông) khi trả về hàng trăm quán cùng lúc.
    """
    id: str
    name: str
    address: str
    location: LocationDTO
    thumbnail: Optional[str] = None
    average_rating: float = 0.0
    total_reviews: int = 0
    category: List[str] = []
    price_range: Optional[Literal["low", "medium", "high"]] = None
