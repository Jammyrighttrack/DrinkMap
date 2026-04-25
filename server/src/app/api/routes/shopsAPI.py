from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from app.dtos.shopDTO import ShopResponse, ShopSummaryResponse, ShopCreateRequest, ShopUpdateRequest
from app.services.shopService import ShopService, ShopWithReviewsDTO
from app.core.auth import get_current_user, get_optional_user

router = APIRouter()

@router.get("/nearby", response_model=List[ShopSummaryResponse])
async def get_nearby_shops(
    lng: float = Query(..., description="Kinh độ"),
    lat: float = Query(..., description="Vĩ độ"),
    max_distance: int = Query(5000, description="Bán kính tìm kiếm (mét)"),
    category: Optional[str] = Query(None, description="Lọc theo category"),
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    TÌM QUÁN QUANH ĐÂY + AI SCORING (Nếu user đã login)
    Sử dụng $geoNear kết hợp AI ranking.
    """
    user_prefs = current_user.get("preferences") if current_user else None
    return await ShopService.get_nearby_shops(lng, lat, max_distance, category, user_prefs)

@router.post("/", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
async def create_shop(
    shop_data: ShopCreateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    TẠO QUÁN MỚI (Add Marker) - Requires authentication
    """
    return await ShopService.create_shop(shop_data, current_user["id"])

@router.get("/", response_model=List[ShopResponse])
async def get_all_shops(
    limit: int = Query(50, description="Số lượng kết quả", ge=1, le=100),
    skip: int = Query(0, description="Bỏ qua N kết quả đầu tiên", ge=0)
):
    """
    Lấy danh sách tất cả các quán hoạt động.
    """
    return await ShopService.get_all_shops(limit=limit)

@router.get("/search", response_model=List[ShopSummaryResponse])
async def search_shops(
    q: str = Query(..., description="Từ khóa tìm kiếm (tên, địa chỉ)"),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Tìm kiếm quán nhanh bằng Text Search (Regex).
    """
    return await ShopService.search_shops(q, limit)

@router.get("/{shop_id}", response_model=ShopWithReviewsDTO)
async def get_shop_detail(shop_id: str):
    """Lấy chi tiết một quán bằng ID (bao gồm cả review mới nhất)"""
    shop = await ShopService.get_shop_with_reviews(shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Không tìm thấy quán hoặc quán đã bị ẩn"
        )
    return shop

@router.put("/{shop_id}", response_model=ShopResponse)
async def update_shop(
    shop_id: str,
    update_data: ShopUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật thông tin quán (Role: Admin / Owner).
    """
    return await ShopService.update_shop(shop_id, update_data, current_user)

@router.delete("/{shop_id}")
async def delete_shop(
    shop_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Xoá (soft delete) một quán nước (Role: Admin / Owner).
    """
    return await ShopService.delete_shop(shop_id, current_user)
