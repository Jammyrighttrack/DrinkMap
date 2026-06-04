from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime

class UserCreateRequest(BaseModel):
    """
    Contract khi đăng ký tài khoản (ví dụ thông qua Google Auth Mock).
    """
    full_name: str
    email: EmailStr
    avatar: Optional[str] = None
    auth_provider: str = "google"


class UserRegisterRequest(BaseModel):
    """
    Contract khi đăng ký tài khoản bằng Email/Mật khẩu.
    """
    email: EmailStr
    password: str
    full_name: str



class UpdatePreferencesRequest(BaseModel):
    """
    Contract cập nhật sở thích để gợi ý AI (taste, budget).
    """
    preferences: List[str]


class SaveShopRequest(BaseModel):
    """
    Contract khi User lưu / bỏ lưu một Shop.
    """
    shop_id: str


class GoogleMockPayload(BaseModel):
    """
    Contract nhận vào tại POST /auth/google-mock.
    Giả lập dữ liệu trả về từ Google OAuth để tạo / tìm User.
    """
    full_name: str
    email: EmailStr
    avatar: Optional[str] = None
    auth_provider: str = "google"


class UpdateProfileRequest(BaseModel):
    """
    Contract cập nhật thông tin cá nhân.
    """
    full_name: Optional[str] = None
    avatar: Optional[str] = None


class UpdateSettingsRequest(BaseModel):
    """
    Contract cập nhật cài đặt thông báo & quyền riêng tư.
    """
    is_anonymous_reviews: Optional[bool] = None
    notify_new_shops: Optional[bool] = None
    notify_ai_messages: Optional[bool] = None
    notify_promotions: Optional[bool] = None


class UserResponse(BaseModel):
    """
    Contract trả về thông tin User. 
    TUYỆT ĐỐI không chứa password_hash. 
    """
    id: str
    email: EmailStr
    full_name: str
    avatar: Optional[str] = None
    role: Literal["user", "admin"]
    
    # AI Preferences
    taste_preferences: List[str] = []
    budget_preference: Optional[Literal["low", "medium", "high"]] = None
    
    # Privacy & Notification settings
    is_anonymous_reviews: bool = False
    notify_new_shops: bool = True
    notify_ai_messages: bool = True
    notify_promotions: bool = True
    
    # Real-time Stats
    points: int = 0
    reviews_count: int = 0
    level: str = "Thành viên mới"
    
    # Status
    is_active: bool
    is_verified: bool
    
    created_at: datetime


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str


class ResendOTPRequest(BaseModel):
    email: EmailStr

