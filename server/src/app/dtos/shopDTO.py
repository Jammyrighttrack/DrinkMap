from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Union, Any, Tuple
from datetime import datetime

class LocationDTO(BaseModel):
    """
    Đại diện cho tọa độ địa lý GeoJSON chuẩn (hỗ trợ cả Point và các định dạng Polygon mở rộng)
    """
    type: str = "Point"       # Mặc định là "Point", có thể là "Polygon"
    coordinates: Union[Tuple[float, float], List[Any]] # Đảm bảo vị trí 0 và 1 luôn parse ra số thực float


class ShopCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    location: LocationDTO
    category: List[str] = []
    images: List[str] = []
    thumbnail: Optional[str] = None
    price_range: Optional[Union[int, str]] = None
    opening_hours: Optional[str] = None
    tags: List[str] = []


class ShopUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    location: Optional[LocationDTO] = None
    category: Optional[List[str]] = None
    images: Optional[List[str]] = None
    thumbnail: Optional[str] = None
    price_range: Optional[Union[int, str]] = None
    opening_hours: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ShopResponse(BaseModel):
    id: str
    slug: Optional[str] = None      
    name: str
    description: Optional[str] = None
    address: str
    location: LocationDTO
    category: Optional[List[str]] = []
    images: Optional[List[str]] = []
    thumbnail: Optional[str] = None
    
    average_rating: Optional[float] = 0.0
    total_reviews: Optional[int] = 0
    
    price_range: Optional[Union[int, str]] = None
    opening_hours: Optional[str] = None
    tags: Optional[List[str]] = []
    
    created_at: Optional[datetime] = None


class ShopSummaryResponse(BaseModel):
    """
    Contract đầu ra rút gọn cực kỳ chuẩn bài dùng riêng cho Map View (Pins) trên HomePage.jsx
    """
    id: str
    name: str
    description: Optional[str] = None
    address: str
    location: LocationDTO   
    thumbnail: Optional[str] = None
    images: Optional[List[str]] = []
    average_rating: Optional[float] = 0.0
    total_reviews: Optional[int] = 0
    category: Optional[List[str]] = []
    price_range: Optional[Union[int, str]] = None
    tags: Optional[List[str]] = []
    distance: Optional[float] = None