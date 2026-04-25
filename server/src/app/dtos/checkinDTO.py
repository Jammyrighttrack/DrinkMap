from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CheckinCreateRequest(BaseModel):
    """
    Contract khi user tạo một Check-in mới tại quán.
    """
    shop_id: str
    message: Optional[str] = None
    photos: List[str] = []


class CheckinResponse(BaseModel):
    """
    Contract trả về thông tin Check-in.
    Thường kèm theo thông tin User và Shop (nếu cần hiển thị ở News Feed).
    """
    id: str
    shop_id: str
    user_id: str
    
    message: Optional[str] = None
    photos: List[str] = []
    
    # Các trường mở rộng thêm sau khi Join DB (nếu cần cho UI)
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    shop_name: Optional[str] = None
    
    created_at: datetime
