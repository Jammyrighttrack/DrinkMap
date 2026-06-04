from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
import uuid

from app.dtos.drinkDTO import DrinkResponse, DrinkCreateRequest
from app.services.drinkService import DrinkService
from app.core.auth import get_current_user

router = APIRouter()
   
@router.get("/shop/{shop_id}")
async def get_shop_menu(shop_id: str):
    """Lấy toàn bộ menu đồ uống của một quán cụ thể."""
    return await DrinkService.get_shop_menu(shop_id, only_available=False)

@router.post("/", response_model=DrinkResponse, status_code=status.HTTP_201_CREATED)
async def add_drink_to_menu(
    drink_data: DrinkCreateRequest,
    current_user: dict = Depends(get_current_user)
):     
    """
    Thêm món mới vào menu của quán.
    Chỉ chủ quán hoặc người có quyền mới nên làm việc này (tạm thời để login là được).
    """
    return await DrinkService.add_drink(drink_data)

@router.get("/search", response_model=List[DrinkResponse])
async def search_drinks(name: str = Query(..., description="Tên món muốn tìm")):
    """
    Tìm kiếm món đồ uống trên toàn hệ thống.
    Ví dụ: Tìm "Cà phê muối" sẽ ra danh sách các quán có bán món này.
    """
    return await DrinkService.search_drinks(name)