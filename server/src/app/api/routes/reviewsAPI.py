from fastapi import APIRouter, Depends, status
from typing import List

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
    return await ReviewService.create_review_and_update_shop_rating(
        review_data=review_data,
        user_id=current_user["id"],
        user_name=current_user["full_name"],
        user_avatar=current_user.get("avatar"),
    )

@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa review (Chỉ người viết mới có quyền xóa)"""
    await ReviewService.delete_review(review_id, current_user["id"])
    return {"message": "Review deleted successfully"}   