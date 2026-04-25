from app.core.database import Database
from typing import Optional, List, Dict, Any

class FavouriteRepository:
    @staticmethod
    def get_collection():
        return Database.get_db().favourites
        
    @classmethod
    async def check_is_favourite(cls, user_id: str, shop_id: str) -> bool:
        doc = await cls.get_collection().find_one({"user_id": user_id, "shop_id": shop_id})
        return bool(doc)
        
    @classmethod
    async def get_by_user(cls, user_id: str, limit: int = 50) -> List[dict]:
        cursor = cls.get_collection().find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=limit)
        
    @classmethod
    async def create(cls, favourite_data: dict) -> str:
        await cls.get_collection().insert_one(favourite_data)
        return favourite_data.get("id")
        
    @classmethod
    async def remove(cls, user_id: str, shop_id: str) -> int:
        result = await cls.get_collection().delete_one({"user_id": user_id, "shop_id": shop_id})
        return result.deleted_count
