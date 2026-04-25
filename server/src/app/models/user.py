from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime
import uuid


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    email: EmailStr
    password_hash: str   

    full_name: str
    avatar: Optional[str] = None

    # phân quyền
    role: Literal["user", "admin"] = "user"

    # preference cho AI
    taste_preferences: List[str] = []
    budget_preference: Optional[Literal["low", "medium", "high"]] = None
     
    # trạng thái account
    is_active: bool = True
    is_verified: bool = False
        
    # timestamps  
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
