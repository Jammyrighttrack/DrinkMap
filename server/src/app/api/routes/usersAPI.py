from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.dtos.userDTO import UserResponse, UpdatePreferencesRequest, SaveShopRequest, UpdateProfileRequest, UpdateSettingsRequest
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

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật thông tin hồ sơ cá nhân (Họ tên, avatar).
    """
    return await UserService.update_profile(current_user["id"], profile_data)

@router.put("/settings", response_model=UserResponse)
async def update_settings(
    settings_data: UpdateSettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Cập nhật các thiết lập thông báo và quyền riêng tư.
    """
    return await UserService.update_settings(current_user["id"], settings_data)

@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_my_account(current_user: dict = Depends(get_current_user)):
    """
    Xóa vĩnh viễn tài khoản người dùng hiện tại khỏi hệ thống.
    """
    await UserService.delete_user(current_user["id"])
    return {"message": "Tài khoản đã được xóa vĩnh viễn thành công"}