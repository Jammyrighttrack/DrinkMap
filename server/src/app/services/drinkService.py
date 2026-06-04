from app.crud.drinkRepository import DrinkRepository
from app.crud.shopRepository import ShopRepository
from app.dtos.drinkDTO import DrinkResponse, DrinkCreateRequest
from typing import List, Dict
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException

class DrinkService:
    @staticmethod
    async def get_shop_menu(shop_id: str, only_available: bool = True) -> Dict[str, List[DrinkResponse]]:
        """
        Lấy danh sách đồ uống của quán, map sang DTO (DrinkResponse) và group theo category chuẩn UI.
        """
        is_available = True if only_available else None
        drink_dicts = await DrinkRepository.get_by_shop(shop_id, is_available=is_available)
            
        # Ép dữ liệu sang DTO 
        drinks = []   
        for d in drink_dicts:
            d.pop("_id", None)
            if "image_url" in d and "image" not in d:
                d["image"] = d["image_url"]
            try:  
                drinks.append(DrinkResponse(**d))
            except Exception as e:
                print(f"[DrinkService Error] Bị lệch schema DTO với món: {d.get('name')} - Lỗi: {e}")
                continue
            
        # ĐỒNG BỘ 100%: Khai báo các key khớp chính xác với Category trong database và Frontend
        menu = {   
            "coffee": [],
            "Fruit tea": [],    # Đã sửa: Khớp với dữ liệu script sinh ra cho UI
            "milktea": [],      # Đã sửa: Viết liền không gạch dưới, khớp với file drinks.json
            "matcha": [],       # Mới: Thêm nhóm trà xanh theo file drinks.json
            "sweet & cake": [], # Mới: Thêm nhóm bánh ngọt theo file drinks.json
            "juice": [],
            "smoothie": [],
            "other": []  
        }
        
        for drink in drinks:
            # Lấy category của món nước
            cat = drink.category if drink.category else "other"
            
            # Khớp nhãn linh hoạt để gom nhóm
            if cat in menu:
                menu[cat].append(drink)
            elif cat.lower() == "tea": # Phòng hờ nếu có dữ liệu cũ là tea
                menu["Fruit tea"].append(drink)
            else:
                menu["other"].append(drink)
                
        # Lọc bỏ các category rỗng không có món nào để giao diện Frontend gọn gàng
        return {k: v for k, v in menu.items() if len(v) > 0}

    @staticmethod
    async def add_drink(drink_data: DrinkCreateRequest) -> DrinkResponse:
        shop = await ShopRepository.get_by_id(drink_data.shop_id)
        if not shop:
            raise HTTPException(status_code=404, detail="Không tìm thấy quán để thêm menu")

        drink_dict = drink_data.model_dump()
        drink_dict["id"] = str(uuid.uuid4())
        drink_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        drink_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Đồng bộ hóa thể loại lúc người dùng tự thêm bằng tay từ admin dashboard
        if drink_dict.get("category") == "tea":
            drink_dict["category"] = "Fruit tea"

        await DrinkRepository.create(drink_dict)
        drink_dict.pop("_id", None)
        return DrinkResponse(**drink_dict)
      
    @staticmethod
    async def search_drinks(name: str) -> List[DrinkResponse]:
        cursor = DrinkRepository.get_collection().find({"name": {"$regex": name, "$options": "i"}}, {"_id": 0})
        drink_dicts = await cursor.to_list(length=50)
        drinks = []   
        for d in drink_dicts:
            d.pop("_id", None)
            drinks.append(DrinkResponse(**d))
        return drinks