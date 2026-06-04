from app.core.database import Database
from typing import Optional, List, Dict, Any

class UserRepository:
    @staticmethod
    def get_collection():
        return Database.get_db().users
        
    @classmethod
    async def get_by_id(cls, user_id: str) -> Optional[dict]:
        return await cls.get_collection().find_one({"id": user_id}, {"_id": 0})
        
    @classmethod
    async def get_by_email(cls, email: str) -> Optional[dict]:
        return await cls.get_collection().find_one({"email": email}, {"_id": 0})
           
    @classmethod   
    async def create(cls, user_data: dict) -> str:
        await cls.get_collection().insert_one(user_data)
        return user_data.get("id")
        
    @classmethod
    async def update(cls, user_id: str, update_data: dict) -> int:
        result = await cls.get_collection().update_one({"id": user_id}, {"$set": update_data})
        return result.modified_count
        
    @classmethod
    async def toggle_saved_shop(cls, user_id: str, shop_id: str, is_saved: bool) -> int:
        if is_saved:
            operation = {"$pull": {"saved_shops": shop_id}}
        else:
            operation = {"$addToSet": {"saved_shops": shop_id}}
        result = await cls.get_collection().update_one({"id": user_id}, operation)
        return result.modified_count

    @classmethod
    async def add_saved_shop(cls, user_id: str, shop_id: str) -> int:
        """Thêm shop_id vào mảng saved_shops (idempotent nhờ $addToSet)."""
        result = await cls.get_collection().update_one(
            {"id": user_id},
            {"$addToSet": {"saved_shops": shop_id}}
        )
        return result.modified_count

    @classmethod
    async def remove_saved_shop(cls, user_id: str, shop_id: str) -> int:
        """Xóa shop_id khỏi mảng saved_shops (idempotent nhờ $pull)."""
        result = await cls.get_collection().update_one(
            {"id": user_id},
            {"$pull": {"saved_shops": shop_id}}
        )
        return result.modified_count

    @classmethod
    async def delete(cls, user_id: str) -> int:
        result = await cls.get_collection().delete_one({"id": user_id})
        return result.deleted_count