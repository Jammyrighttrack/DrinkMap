from fastapi import APIRouter, Depends, status
from typing import List

from app.core.auth import get_current_user
from app.dtos.favouriteDTO import FavouriteCreateRequest
from app.dtos.shopDTO import ShopSummaryResponse
from app.services.favouriteService import FavouriteService

router = APIRouter()

@router.get("/", response_model=List[ShopSummaryResponse])
async def get_favourite_shops(current_user: dict = Depends(get_current_user)):
    """
    Lấy danh sách các quán nước đã thêm vào danh sách yêu thích của người dùng hiện tại
    """    
    # Trả về trực tiếp kết quả từ Service
    return await FavouriteService.get_user_favourites(current_user["id"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_favourite_shop(request: FavouriteCreateRequest, current_user: dict = Depends(get_current_user)):
    """
    Thêm một quán vào danh sách yêu thích
    """
    # Giao toàn bộ logic (kiểm tra tồn tại, chống trùng lặp, lưu DB) cho Service
    result = await FavouriteService.add_favourite(current_user["id"], request.shop_id)
    return result

@router.delete("/{shop_id}", status_code=status.HTTP_200_OK)
async def remove_favourite_shop(shop_id: str, current_user: dict = Depends(get_current_user)):
    """
    Xóa một quán khỏi danh sách yêu thích
    """
    # Giao việc xóa và báo lỗi (nếu có) cho Service
    result = await FavouriteService.remove_favourite(current_user["id"], shop_id)
    return result
   
@router.get("/check/{shop_id}")
async def check_is_favourite(shop_id: str, current_user: dict = Depends(get_current_user)):
    """
    Kiểm tra xem một quán (shop_id) hiện tại có nằm trong danh sách yêu thích của user không
    (Dùng để Frontend hiển thị trạng thái nút Heart)
    """
    # Trả về kết quả check từ Service
    return await FavouriteService.check_status(current_user["id"], shop_id)