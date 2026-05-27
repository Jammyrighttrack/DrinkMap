from app.crud.shopRepository import ShopRepository
from app.crud.reviewRepository import ReviewRepository
from app.dtos.shopDTO import ShopResponse, ShopSummaryResponse, ShopCreateRequest, ShopUpdateRequest
from app.dtos.reviewDTO import ReviewResponse
from typing import Optional, List, Any
from pydantic import BaseModel
from fastapi import HTTPException
import uuid
import pymongo
from datetime import datetime, timezone

class ShopWithReviewsDTO(ShopResponse):
    recent_reviews: List[ReviewResponse] = []

class ShopService:
    @staticmethod
    async def get_shop_with_reviews(shop_id: str) -> Optional[ShopWithReviewsDTO]:
        """
        Lấy thông tin Shop kèm theo một số review (trả về DTO type-safe).
        
        NOTE: shop_id có thể là UUID hoặc slug. Sau khi tìm được shop,
        luôn dùng canonical UUID (shop_dict["id"]) để query reviews — 
        tránh lỗi khi frontend gửi slug nhưng DB lưu reviews theo UUID.
        """
        shop_dict = await ShopRepository.get_by_id_or_slug(shop_id)
        if not shop_dict:
            return None

        # ✅ Dùng canonical UUID của shop, không dùng tham số slug gốc
        canonical_id = shop_dict.get("id", shop_id)
        reviews_dicts = await ReviewRepository.get_by_shop(canonical_id, limit=5)

        # Cast data sang DTO (Pydantic objects)
        recent_reviews = []
        for r in reviews_dicts:
            r.pop("_id", None)
            try:
                recent_reviews.append(ReviewResponse(**r))
            except Exception as review_err:
                # Log but don't crash — a bad review doc shouldn't kill the shop detail page
                print(f"[ShopService] Skipping malformed review: {review_err}", flush=True)

        shop_dict.pop("_id", None)
        try:
            shop_dto = ShopWithReviewsDTO(**shop_dict)
        except Exception as validation_err:
            # Surface Pydantic validation errors clearly instead of a bare 500
            print(f"[ShopService] ShopWithReviewsDTO validation failed for id={canonical_id}: {validation_err}", flush=True)
            raise HTTPException(
                status_code=422,
                detail=f"Dữ liệu quán trong DB không hợp lệ: {str(validation_err)}"
            )

        shop_dto.recent_reviews = recent_reviews
        return shop_dto

    @staticmethod
    async def get_all_shops(limit: int = 100) -> List[ShopResponse]:
        shops_dicts = await ShopRepository.get_all(limit=limit)
        return [ShopResponse(**s) for s in shops_dicts]

    @staticmethod
    async def get_nearby_shops(lng: float, lat: float, max_distance: int, category: Optional[str], user_prefs: Optional[List[str]]) -> List[ShopSummaryResponse]:
        shops_dicts = await ShopRepository.get_nearby_shops(lng, lat, max_distance, category, user_prefs)
        return [ShopSummaryResponse(**s) for s in shops_dicts]

    @staticmethod
    async def create_shop(shop_data: ShopCreateRequest, user_id: str) -> ShopResponse:
        shop_dict = shop_data.model_dump()
        shop_dict["id"] = str(uuid.uuid4())
        shop_dict["created_by"] = user_id
        shop_dict["average_rating"] = 0.0
        shop_dict["total_reviews"] = 0
        shop_dict["is_active"] = True
        shop_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        shop_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await ShopRepository.create(shop_dict)
        return ShopResponse(**shop_dict)

    @staticmethod
    async def search_shops(q: str, limit: int) -> List[ShopSummaryResponse]:
        shops_dicts = await ShopRepository.search(q, limit)
        return [ShopSummaryResponse(**s) for s in shops_dicts]

    @staticmethod
    async def update_shop(shop_id: str, update_data: ShopUpdateRequest, current_user: dict) -> ShopResponse:
        existing_shop = await ShopRepository.get_by_id(shop_id)
        if not existing_shop:
            raise HTTPException(status_code=404, detail="Không tìm thấy quán")
        user_id = current_user.get("id")
        role = current_user.get("role", "user")
        if role != "admin" and existing_shop.get("created_by") != user_id:
            raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa quán này")
            
        update_dict = update_data.model_dump(exclude_unset=True)
        if update_dict:
            await ShopRepository.update(shop_id, update_dict)
            existing_shop.update(update_dict)
            
        return ShopResponse(**existing_shop)

    @staticmethod
    async def get_recommendations(lat: Optional[float], lng: Optional[float], radius_km: float, limit: int, tags: Optional[str]) -> List[ShopSummaryResponse]:
        query = {}
        
        # 1. Lọc theo vị trí (Geospatial query)
        if lat is not None and lng is not None:
            query["location"] = {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    },
                    "$maxDistance": radius_km * 1000
                }
            }
                
        # 2. Lọc theo sở thích (tags)
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]
            if tag_list:
                query["tags"] = {"$in": tag_list}
                
        cursor = ShopRepository.get_collection().find(query, {"_id": 0})
        
        if lat is None or lng is None:
            cursor = cursor.sort("average_rating", pymongo.DESCENDING)
            
        shops_dicts = await cursor.to_list(length=limit)
        return [ShopSummaryResponse(**s) for s in shops_dicts]

    @staticmethod
    async def delete_shop(shop_id: str, current_user: dict) -> dict:
        existing_shop = await ShopRepository.get_by_id(shop_id)
        if not existing_shop:
            raise HTTPException(status_code=404, detail="Không tìm thấy quán")
        user_id = current_user.get("id")
        role = current_user.get("role", "user")
        if role != "admin" and existing_shop.get("created_by") != user_id:
            raise HTTPException(status_code=403, detail="Không có quyền xóa quán này")
        await ShopRepository.soft_delete(shop_id)
        return {"message": "Đã ẩn quán thành công", "id": shop_id}
