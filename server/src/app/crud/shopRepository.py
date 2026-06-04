from app.core.database import Database
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import math
   

def _haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Khoảng cách Haversine giữa 2 điểm (mét)."""
    R = 6_371_000  # bán kính Trái Đất (m) 
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
   

def _shop_centroid(shop: dict) -> tuple[float, float] | tuple[None, None]:
    """Tính lat/lng từ GeoJSON Point hoặc Polygon."""
    loc = shop.get("location", {})
    geo_type = loc.get("type", "")
    coords = loc.get("coordinates", [])
    try:
        if geo_type == "Point" and coords:
            return float(coords[1]), float(coords[0])  # lat, lng
        if geo_type in ("Polygon", "MultiPolygon") and coords:
            ring = coords[0] if geo_type == "Polygon" else coords[0][0]
            if ring:
                return (
                    sum(c[1] for c in ring) / len(ring),
                    sum(c[0] for c in ring) / len(ring),
                )
    except Exception:
        pass
    return None, None

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
        """Lấy Quán theo ID UUID (chỉ những quán đang active)"""
        return await cls.get_collection().find_one({"id": shop_id, "is_active": True}, {"_id": 0})

    @classmethod
    async def get_by_slug(cls, slug: str) -> Optional[dict]:
        """Lấy Quán theo slug (dùng cho /shop/:slug trên Frontend)"""
        return await cls.get_collection().find_one({"slug": slug, "is_active": True}, {"_id": 0})

    @classmethod
    async def get_by_id_or_slug(cls, id_or_slug: str) -> Optional[dict]:
        """Tìm quán theo UUID id trước, nếu không có thì tìm theo slug."""
        shop = await cls.get_collection().find_one({"id": id_or_slug, "is_active": True}, {"_id": 0})
        if not shop:
            shop = await cls.get_collection().find_one({"slug": id_or_slug, "is_active": True}, {"_id": 0})
        return shop

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
        radius_km: float = 5.0,
        beverage_types: Optional[str] = None,
        price_range: Optional[int] = None,
        q: Optional[str] = None,
        user_prefs: Optional[List[str]] = None,
    ) -> List[dict]:
        """
        [CORE FEATURE] Tìm quán gần vị trí người dùng.
        Hỗ trợ lọc theo 3 tiêu chí: Khoảng cách, Sở thích (tags), và Mức giá.
        """
        match: Dict[str, Any] = {"is_active": True}
        
        # 1. Lọc theo Price Range (1, 2, 3)
        if price_range is not None:
            match["price_range"] = price_range

        # 2. Ánh xạ và lọc theo Beverage Type / Tags
        BEVERAGE_TAG_MAP = {
            "date": "date lãng mạn",
            "work": "working space",
            "delicious": "đồ uống ngon",
            "chill": "view đẹp & chill",
            "classic": "cổ điển",
            "modern": "hiện đại"
        }
        if beverage_types and beverage_types in BEVERAGE_TAG_MAP:
            match["tags"] = BEVERAGE_TAG_MAP[beverage_types]
            
        # 3. Text search nếu người dùng gõ từ khóa
        if q and q.strip():
            match["$or"] = [
                {"name": {"$regex": q.strip(), "$options": "i"}},
                {"address": {"$regex": q.strip(), "$options": "i"}}
            ]
            # Mở rộng bán kính tìm kiếm nếu có text query để tìm được toàn bộ thành phố
            radius_km = max(radius_km, 50.0)

        # Lấy tất cả shops khớp điều kiện lọc (tối đa 2000 để bao phủ hết 1176 shops trong DB)
        all_shops = await cls.get_collection().find(match, {"_id": 0}).to_list(length=2000)
        print(f"[ShopRepo] Loaded {len(all_shops)} shops filtering by {match}", flush=True)

        # Đổi bán kính từ km sang mét
        max_distance_m = radius_km * 1000

        # ── Tính khoảng cách Haversine & lọc theo max_distance_m ────────────────
        nearby: list[dict] = []
        for shop in all_shops:
            slat, slng = _shop_centroid(shop)
            if slat is None:
                continue
            dist_m = _haversine_m(lat, lng, slat, slng)
            if dist_m <= max_distance_m:
                shop["distance"] = round(dist_m)
                nearby.append(shop)

        print(f"[ShopRepo] Haversine -> {len(nearby)} shops within {max_distance_m}m", flush=True)

        # ── Nếu không có quán trong bán kính, trả về tất cả sort theo rating ──
        if not nearby:
            print("[ShopRepo] No shops in range -- returning all sorted by rating", flush=True)
            all_shops.sort(key=lambda s: s.get("average_rating", 0), reverse=True)
            return all_shops[:50]

        # ── Sort: theo khoảng cách (nếu không có prefs) hoặc tag match ─────────
        if user_prefs:
            nearby.sort(
                key=lambda s: (
                    -len(set(s.get("tags", [])) & set(user_prefs)),
                    s.get("distance", 999_999),
                )
            )
        else:
            nearby.sort(key=lambda s: s.get("distance", 999_999))

        return nearby


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
