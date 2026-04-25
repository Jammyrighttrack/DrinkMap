import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.repositories.favourite_repo import FavouriteRepository
# Import thêm các Repository khác để Service làm nhạc trưởng điều phối
from app.repositories.shop_repo import ShopRepository
from app.repositories.user_repo import UserRepository
from app.dtos.shopDTO import ShopSummaryResponse
from typing import List

class FavouriteService:
    
    @staticmethod
    async def add_favourite(user_id: str, shop_id: str) -> dict:
        """
        Xử lý logic thêm quán vào danh sách yêu thích.
        """
        # 1. Xác thực dữ liệu chéo: Kiểm tra quán có thực sự tồn tại không
        shop_exists = await ShopRepository.check_exists(shop_id)
        if not shop_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Quán không tồn tại trong hệ thống DrinkMap AI."
            )
            
        # 2. Xử lý Logic: Ngăn chặn lưu trùng lặp
        is_fav = await FavouriteRepository.check_is_favourite(user_id, shop_id)
        if is_fav:
            return {"message": "Quán đã nằm trong danh sách yêu thích", "already_exists": True}
            
        # 3. Chuẩn bị dữ liệu (Data Preparation)
        fav_data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "shop_id": shop_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # 4. Giao việc lưu trữ cho Repository
        fav_id = await FavouriteRepository.create(fav_data)
        
        # 5. Đồng bộ dữ liệu (Cập nhật mảng saved_shops của User)
        await UserRepository.add_saved_shop(user_id, shop_id)
        
        return {"message": "Đã thêm vào danh sách yêu thích", "id": fav_id, "already_exists": False}

    @staticmethod
    async def remove_favourite(user_id: str, shop_id: str) -> dict:
        """
        Xử lý logic xóa quán khỏi danh sách yêu thích.
        """
        deleted_count = await FavouriteRepository.remove(user_id, shop_id)
        
        # Nếu không có record nào bị xóa, nghĩa là dữ liệu không hợp lệ
        if deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Quán chưa nằm trong danh sách yêu thích."
            )
            
        # Đồng bộ xóa khỏi bảng User
        await UserRepository.remove_saved_shop(user_id, shop_id)
        
        return {"message": "Đã xóa khỏi danh sách yêu thích"}

    @staticmethod
    async def get_user_favourites(user_id: str) -> List[ShopSummaryResponse]:
        """
        Lấy danh sách quán yêu thích và "JOIN" dữ liệu thủ công.
        """
        # Lấy danh sách ID các quán đã thích từ bảng favourites
        fav_records = await FavouriteRepository.get_by_user(user_id)
        
        if not fav_records:
            return []
            
        # Trích xuất một mảng chỉ chứa shop_id
        shop_ids = [record["shop_id"] for record in fav_records]
        
        # Chuyển việc lấy chi tiết quán cho ShopRepository xử lý
        shops_data = await ShopRepository.get_shops_by_ids(shop_ids)
        
        formatted_shops = []
        for shop in shops_data:
            shop.pop("_id", None)
            cat = shop.get("category")
            if isinstance(cat, str):
                shop["category"] = [cat] if cat else []
            formatted_shops.append(ShopSummaryResponse(**shop))
            
        return formatted_shops

    @staticmethod
    async def check_status(user_id: str, shop_id: str) -> dict:
        """
        Trả về trạng thái yêu thích để UI tô màu nút thả tim.
        """
        is_fav = await FavouriteRepository.check_is_favourite(user_id, shop_id)
        return {"is_favourite": is_fav}