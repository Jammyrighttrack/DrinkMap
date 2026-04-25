from fastapi import APIRouter, Query, HTTPException, status
from typing import List, Optional
import pymongo

from app.dtos.shopDTO import ShopSummaryResponse
from app.services.shopService import ShopService

router = APIRouter()
    
@router.get("/", response_model=List[ShopSummaryResponse])
async def get_recommendations(
    lat: Optional[float] = Query(None, description="Vĩ độ (Latitude) của người dùng"),
    lng: Optional[float] = Query(None, description="Kinh độ (Longitude) của người dùng"),
    radius_km: float = Query(5.0, description="Bán kính tìm kiếm (km)"),
    limit: int = Query(10, description="Số lượng kết quả trả về"),
    tags: Optional[str] = Query(None, description="Các tags sở thích, cách nhau bằng dấu phẩy")
):
    """
    API Gợi ý quán nước:
    - Nếu có toạ độ (lat, lng): Trả về các quán gần nhất trong bán kính, ưu tiên theo khoảng cách.
    - Nếu có tags: Lọc các quán có chứa ít nhất 1 tag trùng khớp.
    - Nếu không có toạ độ: Trả về các quán có rating cao nhất.
    """
    return await ShopService.get_recommendations(lat, lng, radius_km, limit, tags)
