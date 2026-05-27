from fastapi import APIRouter, Depends, Response
from app.core.auth import create_access_token, get_current_user
from app.dtos.userDTO import GoogleMockPayload, UserResponse
from app.services.userService import UserService

router = APIRouter()

@router.post("/google-mock", response_model=UserResponse)
async def google_auth_mock(user_data: GoogleMockPayload, response: Response):
    """
    Giả lập xác thực Google. 
    Tạo user nếu chưa có và cấp thẻ bài JWT qua HttpOnly Cookie.
    """
    # 1. Gọi Service xử lý logic lấy user hoặc tạo mới
    user_dto = await UserService.get_or_create_google_user(
        email=user_data.email,
        full_name=user_data.full_name,
        avatar=user_data.avatar,
        auth_provider=user_data.auth_provider
    )

    # 2. Tạo JWT Token
    access_token = create_access_token(data={"sub": user_dto.id})

    # 3. Gắn thẻ vào Cookie (Bảo mật cao)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,  # 30 ngày
        samesite="lax",
        secure=False  # Đổi thành True khi chạy HTTPS thực tế
    )

    return user_dto

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Lấy thông tin profile của người dùng đang đăng nhập"""
    current_user.pop("_id", None)
    return UserResponse(**current_user)

@router.post("/logout")
async def logout(response: Response):
    """Đăng xuất bằng cách xóa sạch Cookie trên trình duyệt"""
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}