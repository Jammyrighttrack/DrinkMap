from app.crud.userRepository import UserRepository
from app.crud.shopRepository import ShopRepository
from app.dtos.userDTO import UserResponse
from app.dtos.shopDTO import ShopSummaryResponse
from pydantic import BaseModel
from typing import Optional, List
from fastapi import HTTPException

class UserProfileDTO(UserResponse):
    # Kế thừa UserResponse nhưng thêm thông tin dánh sách các quán đã lưu
    saved_shops_details: List[ShopSummaryResponse] = []

class UserService:
    @staticmethod
    async def get_or_create_google_user(email: str, full_name: str, avatar: Optional[str] = None, auth_provider: str = "google") -> UserResponse:
        user_dict = await UserRepository.get_by_email(email)
        if not user_dict:
            import uuid
            from datetime import datetime, timezone
            user_id = str(uuid.uuid4())
            user_dict = {
                "id": user_id,
                "full_name": full_name,
                "email": email,
                "avatar": avatar,
                "auth_provider": auth_provider,
                "password_hash": "", 
                "role": "user",
                "taste_preferences": [],
                "budget_preference": None,
                "is_active": True,
                "is_verified": True,
                "saved_shops": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await UserRepository.create(user_dict)
            
        user_dict.pop("_id", None)
        return UserResponse(**user_dict)

    @staticmethod
    async def update_preferences(user_id: str, preferences: List[str]) -> UserResponse:
        await UserRepository.update(user_id, {"taste_preferences": preferences})
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            raise HTTPException(status_code=404, detail="User not found")
        user_dict.pop("_id", None)
        return UserResponse(**user_dict)

    @staticmethod
    async def toggle_save_shop(user_id: str, shop_id: str) -> UserResponse:
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            raise HTTPException(status_code=404, detail="User not found")
            
        is_saved = shop_id in user_dict.get("saved_shops", [])
        await UserRepository.toggle_saved_shop(user_id, shop_id, is_saved)
        
        updated_dict = await UserRepository.get_by_id(user_id)
        updated_dict.pop("_id", None)
        return UserResponse(**updated_dict)

    @staticmethod
    async def get_saved_shops(user_id: str) -> List[ShopSummaryResponse]:
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            return []
        saved_ids = user_dict.get("saved_shops", [])
        if not saved_ids:
            return []
        saved_shops_dicts = await ShopRepository.get_by_ids(saved_ids)
        shops = []
        for s in saved_shops_dicts:
            s.pop("_id", None)
            cat = s.get("category")
            if isinstance(cat, str):
                s["category"] = [cat] if cat else []
            shops.append(ShopSummaryResponse(**s))
        return shops

    @staticmethod
    async def get_user_profile(user_id: str) -> Optional[UserProfileDTO]:
        """
        Format data user, trả về DTO type-safe.
        """
        user_dict = await UserRepository.get_by_id(user_id)
        if not user_dict:
            return None
            
        user_dict.pop("password_hash", None)
        
        saved_shop_ids = user_dict.get("saved_shops", [])
        saved_shops_dto = []
        if saved_shop_ids:
            saved_shops_dicts = await ShopRepository.get_by_ids(saved_shop_ids)
            for s in saved_shops_dicts:
                s.pop("_id", None)
                cat = s.get("category")
                if isinstance(cat, str):
                    s["category"] = [cat] if cat else []
                saved_shops_dto.append(ShopSummaryResponse(**s))
            
        user_dict.pop("_id", None)
        profile_dto = UserProfileDTO(**user_dict)
        profile_dto.saved_shops_details = saved_shops_dto
        
        return profile_dto
