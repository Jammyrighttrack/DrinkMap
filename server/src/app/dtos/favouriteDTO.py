from pydantic import BaseModel
from datetime import datetime

class FavouriteCreateRequest(BaseModel):
    """
    Contract gửi lên khi User muốn thả tim (Favourite) quán.
    """
    shop_id: str

class FavouriteResponse(BaseModel):
    """
    Contract trả về liên kết Yêu thích.
    Lưu ý: Thường Client sẽ fetch luôn danh sách Shop chứ không fetch Favourite mapping.
    Tuy nhiên nếu cần trả về mapping thì dùng model này.
    """
    id: str
    user_id: str
    shop_id: str
    created_at: datetime
