from app.crud.reviewRepository import ReviewRepository
from app.crud.shopRepository import ShopRepository
from app.dtos.reviewDTO import ReviewResponse, ReviewCreateRequest
from typing import List
from fastapi import HTTPException
import uuid
from datetime import datetime, timezone

class ReviewService:
    @staticmethod
    async def create_review_and_update_shop_rating(
        review_data: ReviewCreateRequest,
        user_id: str,
        user_name: str,
        user_avatar: str = None,
    ) -> ReviewResponse:
        # Guard: verify shop exists before writing any data
        shop = await ShopRepository.get_by_id(review_data.shop_id)
        if not shop:
            raise HTTPException(status_code=404, detail="Shop not found")

        # Convert DTO to dict for insert
        insert_dict = review_data.model_dump()
        insert_dict["id"] = str(uuid.uuid4())
        insert_dict["user_id"] = user_id
        insert_dict["user_name"] = user_name
        insert_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        if user_avatar:
            insert_dict["user_avatar"] = user_avatar

        review_id = await ReviewRepository.create(insert_dict)

        shop_id = review_data.shop_id
        all_reviews = await ReviewRepository.get_by_shop(shop_id, limit=1000)
        total_reviews = len(all_reviews)

        if total_reviews > 0:
            average_rating = sum(r.get("rating", 0) for r in all_reviews) / total_reviews
            await ShopRepository.update_rating(shop_id, round(average_rating, 1), total_reviews)

        # Re-fetch the persisted document and return as DTO
        new_review = await ReviewRepository.get_by_id(review_id)
        new_review.pop("_id", None)
        return ReviewResponse(**new_review)

    @staticmethod
    async def get_shop_reviews(shop_id: str, limit: int = 100) -> List[ReviewResponse]:
        review_dicts = await ReviewRepository.get_by_shop(shop_id, limit)
        reviews = []
        for r in review_dicts:
            r.pop("_id", None)
            reviews.append(ReviewResponse(**r))
        return reviews

    @staticmethod
    async def delete_review(review_id: str, user_id: str) -> bool:
        review_dict = await ReviewRepository.get_by_id(review_id)
        if not review_dict:
            raise HTTPException(status_code=404, detail="Review not found")
        if review_dict["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this review")
        await ReviewRepository.delete(review_id)
        return True
