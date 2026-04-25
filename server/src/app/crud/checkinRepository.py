from app.core.database import Database
from typing import Optional, List, Dict, Any

class CheckinRepository:
    @staticmethod
    def get_collection():
        return Database.get_db().checkins
        
    @classmethod
    async def get_by_id(cls, checkin_id: str) -> Optional[dict]:
        return await cls.get_collection().find_one({"id": checkin_id}, {"_id": 0})
        
    @classmethod
    async def get_by_shop(cls, shop_id: str, limit: int = 50) -> List[dict]:
        cursor = cls.get_collection().find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=limit)
        
    @classmethod
    async def get_by_user(cls, user_id: str, limit: int = 50) -> List[dict]:
        cursor = cls.get_collection().find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
        return await cursor.to_list(length=limit)
        
    @classmethod
    async def create(cls, checkin_data: dict) -> str:
        await cls.get_collection().insert_one(checkin_data)
        return checkin_data.get("id")
        
    @classmethod
    async def delete(cls, checkin_id: str) -> int:
        result = await cls.get_collection().delete_one({"id": checkin_id})
        return result.deleted_count
