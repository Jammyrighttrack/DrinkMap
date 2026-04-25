from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.dtos.userDTO import UserResponse, UpdatePreferencesRequest, SaveShopRequest
from app.dtos.shopDTO import ShopSummaryResponse
from app.services.userService import UserService
from app.core.auth import get_current_user

router = APIRouter()
    
@router.put("/preferences", response_model=UserResponse)
async def update_preferences(
    preferences_data: UpdatePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật sở thích cá nhân (ví dụ: "cà phê đậm", "không gian yên tĩnh").
    Đây là đầu vào quan trọng để hệ thống AI scoring tính toán match_score trên bản đồ.
    """
    return await UserService.update_preferences(current_user["id"], preferences_data.preferences)

@router.post("/saved-shops", response_model=UserResponse)
async def toggle_save_shop(
    save_request: SaveShopRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Lưu hoặc bỏ lưu quán cafe (Toggle).
    Sử dụng toán tử $addToSet và $pull của MongoDB để xử lý cực nhanh.
    """
    return await UserService.toggle_save_shop(current_user["id"], save_request.shop_id)
              
@router.get("/saved-shops", response_model=List[ShopSummaryResponse])
async def get_my_saved_shops(current_user: dict = Depends(get_current_user)):
    """   
    Lấy danh sách chi tiết các quán mà người dùng đã lưu.
    """
    return await UserService.get_saved_shops(current_user["id"])   