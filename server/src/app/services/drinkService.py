from app.crud.drinkRepository import DrinkRepository
from app.dtos.drinkDTO import DrinkResponse, DrinkCreateRequest
from typing import List, Dict
import uuid
from datetime import datetime, timezone

class DrinkService:
    @staticmethod
    async def get_shop_menu(shop_id: str, only_available: bool = True) -> Dict[str, List[DrinkResponse]]:
        """
        Lấy danh sách đồ uống của quán, map sang DTO (DrinkResponse) và group theo category.
        """
        is_available = True if only_available else None
        drink_dicts = await DrinkRepository.get_by_shop(shop_id, is_available=is_available)
        
        # Cast everything to DTO
        drinks = []
        for d in drink_dicts:
            d.pop("_id", None)
            drinks.append(DrinkResponse(**d))
        
        menu = {
            "coffee": [],
            "tea": [],
            "milk_tea": [],
            "juice": [],
            "smoothie": [],
            "other": []  
        }
        
        for drink in drinks:
            cat = drink.category if drink.category else "other"
            if cat in menu:
                menu[cat].append(drink)
            else:
                menu["other"].append(drink)
                
        # Lọc bỏ các category rỗng
        return {k: v for k, v in menu.items() if len(v) > 0}

    @staticmethod
    async def add_drink(drink_data: DrinkCreateRequest) -> DrinkResponse:
        drink_dict = drink_data.model_dump()
        drink_dict["id"] = str(uuid.uuid4())
        drink_dict["created_at"] = datetime.now(timezone.utc).isoformat()
        drink_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        
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
