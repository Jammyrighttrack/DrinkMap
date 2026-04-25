from app.core.database import Database
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

class ShopRepository:
    """
    Tầng giao tiếp độc quyền với MongoDB Atlas Collection: `shops`
    Áp dụng pattern Repository để tách biệt Database logic khỏi Controllers (Routers)
    """

    @staticmethod
    def get_collection():
        return Database.get_db().shops
        
    @classmethod
    async def get_by_id(cls, shop_id: str) -> Optional[dict]:
        """Lấy Quán theo ID (chỉ những quán đang active)"""
        return await cls.get_collection().find_one({"id": shop_id, "is_active": True}, {"_id": 0})
        
    @classmethod
    async def get_all(cls, limit: int = 100, skip: int = 0) -> List[dict]:
        """Lấy tất cả các quán có trong DB"""
        cursor = cls.get_collection().find({"is_active": True}, {"_id": 0}).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
        
    @classmethod
    async def get_by_ids(cls, shop_ids: List[str]) -> List[dict]:
        """Tiện ích dùng chung khi lấy 1 mảng ID các shop"""
        cursor = cls.get_collection().find({
            "id": {"$in": shop_ids},
            "is_active": True
        }, {"_id": 0})
        return await cursor.to_list(length=len(shop_ids))

    @classmethod
    async def get_nearby_shops(
        cls, 
        lng: float, 
        lat: float, 
        max_distance: int = 5000, 
        category: Optional[str] = None,
        user_prefs: Optional[List[str]] = None
    ) -> List[dict]:
        """
        [CORE FEATURE] Tìm quán bằng Vị trí ($geoNear) + Lọc sở thích AI
        """
        pipeline = [
            {
                "$geoNear": {
                    "near": {"type": "Point", "coordinates": [lng, lat]},
                    "distanceField": "distance",
                    "maxDistance": max_distance,
                    "spherical": True
                }
            }
        ]
        
        match_stage = {"is_active": True}
        if category:
            match_stage["category"] = category
        pipeline.append({"$match": match_stage})
        
        # Nếu có thông tin preferences, tích hợp AI matching score
        if user_prefs:
            pipeline.append({
                "$addFields": {
                    "match_score": {
                        "$size": {
                            "$setIntersection": [
                                {"$ifNull": ["$tags", []]}, 
                                user_prefs
                            ]
                        }
                    }
                }
            })
            pipeline.append({"$sort": {"match_score": -1, "distance": 1}})
        else:
            pipeline.append({"$sort": {"distance": 1}})
            
        pipeline.append({"$limit": 50})
        
        shops_cursor = cls.get_collection().aggregate(pipeline)
        return await shops_cursor.to_list(length=50)

    @classmethod
    async def search(cls, query: str, limit: int = 20) -> List[dict]:
        """Tìm kiếm full-text dùng regex trên name và address"""
        search_query = {
            "is_active": True,
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"address": {"$regex": query, "$options": "i"}}
            ]
        }
        cursor = cls.get_collection().find(search_query, {"_id": 0}).limit(limit)
        return await cursor.to_list(length=limit)
        
    @classmethod
    async def create(cls, shop_data: dict) -> dict:
        """Thêm mới 1 quán vào Database"""
        result = await cls.get_collection().insert_one(shop_data)
        # Loại bỏ thuộc tính ObjectId "_id" trả ra vì ko dùng đến (ta dùng 'id' string UUID của riêng app)
        shop_data.pop("_id", None)
        return shop_data
        
    @classmethod
    async def update(cls, shop_id: str, update_data: dict) -> int:
        """Cập nhật thông tin quán bằng dictionary"""
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await cls.get_collection().update_one(
            {"id": shop_id}, 
            {"$set": update_data}
        )
        return result.modified_count

    @classmethod
    async def soft_delete(cls, shop_id: str) -> int:
        """Xoá mềm quán (không trả kết quả về sau lệnh này nữa)"""
        result = await cls.get_collection().update_one(
            {"id": shop_id},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return result.modified_count
        
    @classmethod
    async def update_rating(cls, shop_id: str, average_rating: float, total_reviews: int) -> int:
        """Cập nhật điểm đánh giá trung bình từ 1 hook nào đó"""
        result = await cls.get_collection().update_one(
            {"id": shop_id}, 
            {"$set": {
                "average_rating": average_rating, 
                "total_reviews": total_reviews,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return result.modified_count
