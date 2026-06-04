from fastapi import APIRouter, Depends, status
from typing import List

from app.dtos.reviewDTO import ReviewResponse, ReviewCreateRequest
from app.services.reviewService import ReviewService
from app.core.auth import get_current_user

router = APIRouter()
   
@router.get("/me", response_model=List[ReviewResponse])
async def get_my_reviews(current_user: dict = Depends(get_current_user)):
    """Lấy toàn bộ danh sách đánh giá mà người dùng hiện tại đã viết."""
    return await ReviewService.get_user_reviews(current_user["id"])

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
    user_name = "Người dùng ẩn danh" if current_user.get("is_anonymous_reviews") else current_user["full_name"]
    user_avatar = None if current_user.get("is_anonymous_reviews") else current_user.get("avatar")
    
    return await ReviewService.create_review_and_update_shop_rating(
        review_data=review_data,
        user_id=current_user["id"],
        user_name=user_name,
        user_avatar=user_avatar,
    )

@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Xóa review (Chỉ người viết mới có quyền xóa)"""
    await ReviewService.delete_review(review_id, current_user["id"])
    return {"message": "Review deleted successfully"}   