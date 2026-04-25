from app.core.database import Database
from typing import Optional, List, Dict, Any

class DrinkRepository:
    @staticmethod
    def get_collection():
        return Database.get_db().drinks
        
    @classmethod
    async def get_by_id(cls, drink_id: str) -> Optional[dict]:
        return await cls.get_collection().find_one({"id": drink_id}, {"_id": 0})
        
    @classmethod
    async def get_by_shop(cls, shop_id: str, is_available: Optional[bool] = None) -> List[dict]:
        query = {"shop_id": shop_id}
        if is_available is not None:
            query["is_available"] = is_available
        cursor = cls.get_collection().find(query, {"_id": 0})
        return await cursor.to_list(length=100)
        
    @classmethod
    async def create(cls, drink_data: dict) -> str:
        await cls.get_collection().insert_one(drink_data)
        return drink_data.get("id")
        
    @classmethod
    async def update(cls, drink_id: str, update_data: dict) -> int:
        result = await cls.get_collection().update_one({"id": drink_id}, {"$set": update_data})
        return result.modified_count
        
    @classmethod
    async def delete(cls, drink_id: str) -> int:
        result = await cls.get_collection().delete_one({"id": drink_id})
        return result.deleted_count
