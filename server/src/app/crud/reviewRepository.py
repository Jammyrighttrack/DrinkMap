from app.core.database import Database
from typing import Optional, List, Dict, Any

class ReviewRepository:
    @staticmethod
    def get_collection():
        return Database.get_db().reviews
        
    @classmethod
    async def get_by_id(cls, review_id: str) -> Optional[dict]:
        return await cls.get_collection().find_one({"id": review_id}, {"_id": 0})
        
    @classmethod
    async def get_by_shop(cls, shop_id: str, limit: int = 100) -> List[dict]:
        cursor = cls.get_collection().find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=limit)
        
    @classmethod
    async def get_by_user(cls, user_id: str, limit: int = 100) -> List[dict]:
        cursor = cls.get_collection().find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=limit)
        
    @classmethod
    async def create(cls, review_data: dict) -> str:
        await cls.get_collection().insert_one(review_data)
        return review_data.get("id")
        
    @classmethod
    async def delete(cls, review_id: str) -> int:
        result = await cls.get_collection().delete_one({"id": review_id})
        return result.deleted_count
