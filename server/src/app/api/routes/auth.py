from fastapi import APIRouter, Depends, Response, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from app.core.auth import create_access_token, get_current_user
from app.dtos.userDTO import GoogleMockPayload, UserResponse, UserRegisterRequest, VerifyOTPRequest, ResendOTPRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.services.userService import UserService
from typing import Dict, Any

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegisterRequest, background_tasks: BackgroundTasks):
    """
    Đăng ký tài khoản người dùng cục bộ mới bằng Email/Mật khẩu.
    """
    return await UserService.register_local_user(
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        background_tasks=background_tasks
    )

@router.post("/verify-otp")
async def verify_otp(
    otp_data: VerifyOTPRequest,
    response: Response
) -> Dict[str, Any]:
    """
    Xác thực mã OTP để kích hoạt tài khoản. 
    Nếu thành công, tự động đăng nhập và cấp thẻ bài JWT.
    """
    user = await UserService.verify_otp(
        email=otp_data.email,
        otp_code=otp_data.otp_code
    )
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Ghi cookie bảo mật
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,
        samesite="lax",
        secure=False
    )
    
    user.pop("_id", None)
    user.pop("password_hash", None)
    await UserService.enrich_user_stats(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user)
    }

@router.post("/resend-otp")
async def resend_otp(otp_data: ResendOTPRequest, background_tasks: BackgroundTasks):
    """
    Gửi lại mã OTP mới cho người dùng.
    """
    await UserService.resend_otp(email=otp_data.email, background_tasks=background_tasks)
    return {"message": "Mã OTP mới đã được gửi thành công!"}

@router.post("/forgot-password")
async def forgot_password(request_data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """
    Yêu cầu đặt lại mật khẩu. Gửi OTP đến email người dùng.
    """
    await UserService.request_password_reset(email=request_data.email, background_tasks=background_tasks)
    return {"message": "Mã xác nhận đã được gửi đến email của bạn!"}

@router.post("/reset-password")
async def reset_password(request_data: ResetPasswordRequest):
    """
    Đặt lại mật khẩu với mã OTP.
    """
    await UserService.reset_password(
        email=request_data.email,
        otp_code=request_data.otp_code,
        new_password=request_data.new_password
    )
    return {"message": "Đặt lại mật khẩu thành công!"}

@router.post("/login/access-token")
async def login_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Dict[str, Any]:
    """
    Đăng nhập bằng email và mật khẩu để nhận JWT token.
    """
    user = await UserService.authenticate_user(
        email=form_data.username,
        password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác"
        )
        
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=400,
            detail="Tài khoản chưa được xác thực email!"
        )
        
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Ghi cookie bảo mật
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,
        samesite="lax",
        secure=False
    )
    
    user.pop("_id", None)
    user.pop("password_hash", None)
    await UserService.enrich_user_stats(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user)
    }

@router.post("/google-mock")
async def google_auth_mock(user_data: GoogleMockPayload, response: Response) -> Dict[str, Any]:
    """
    Giả lập xác thực Google. 
    Tạo user nếu chưa có và cấp thẻ bài JWT qua HttpOnly Cookie cùng dữ liệu JSON.
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

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dto
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Lấy thông tin profile của người dùng đang đăng nhập"""
    current_user.pop("_id", None)
    await UserService.enrich_user_stats(current_user)
    return UserResponse(**current_user)

@router.post("/logout")
async def logout(response: Response):
    """Đăng xuất bằng cách xóa sạch Cookie trên trình duyệt"""
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}