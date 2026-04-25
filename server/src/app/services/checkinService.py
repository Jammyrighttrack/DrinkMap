from app.crud.checkinRepository import CheckinRepository
from app.dtos.checkinDTO import CheckinResponse
from typing import List

class CheckinService:
    @staticmethod
    async def get_shop_checkins(shop_id: str, limit: int = 50) -> List[CheckinResponse]:
        """
        Lấy checkins của shop, trả về danh sách CheckinResponse DTO.
        """
        checkin_dicts = await CheckinRepository.get_by_shop(shop_id, limit)
        
        formatted_checkins = []
            c.pop("_id", None)
            dto = CheckinResponse(**c)
            # Nếu có logic join tên User thì gán thêm, ví dụ:
            # dto.user_name = "Tên user lấy từ DB"
            formatted_checkins.append(dto)
            
        return formatted_checkins
