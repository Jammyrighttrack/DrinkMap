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
    
    # Status
    is_active: bool
    is_verified: bool
    
    created_at: datetime
