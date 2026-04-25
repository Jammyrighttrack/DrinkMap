from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import uuid
from datetime import datetime, timezone

from app.dtos.reviewDTO import ReviewResponse, ReviewCreateRequest
from app.services.reviewService import ReviewService
from app.core.auth import get_current_user

router = APIRouter()
   
@router.get("/shops/{shop_id}/reviews", response_model=List[ReviewResponse])
async def get_shop_reviews(shop_id: str):
    """Lấy toàn bộ danh sách đánh giá của một quán, sắp xếp từ mới nhất đến cũ nhất."""
    return await ReviewService.get_shop_reviews(shop_id)
     
@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(  
    review_data: ReviewCreateRequest,  
    current_user: dict = Depends(get_current_user)
):
    """
    Tạo đánh giá mới và tự động tính toán lại điểm trung bình (Average Rating) cho quán.
    """
    from app.crud.shopRepository import ShopRepository
    shop = await ShopRepository.get_by_id(review_data.shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
        
    review_id = await ReviewService.create_review_and_update_shop_rating(
        review_data=review_data,
        user_id=current_user["id"],
        user_name=current_user["full_name"],
        user_avatar=current_user.get("avatar")
    )
    
    # Actually, ReviewService currently returns str (review_id), let's just return a generic response or we can fetch it.
    from app.crud.reviewRepository import ReviewRepository
    new_review = await ReviewRepository.get_by_id(review_id)
    new_review.pop("_id", None)
    return ReviewResponse(**new_review)

@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa review (Chỉ người viết mới có quyền xóa)"""
    await ReviewService.delete_review(review_id, current_user["id"])
    return {"message": "Review deleted successfully"}   