import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
sys.path.append(str(ROOT_DIR / 'src'))

from app.core.database import Database
from app.crud.shopRepository import ShopRepository
from app.services.shopService import ShopService

async def main():
    await Database.connect_db()
    try:
        # Get first shop
        shops = await ShopRepository.get_all(limit=1)
        if not shops:
            print("No shops found in DB.")
            return
        shop_id = shops[0]["id"]
        print(f"Testing shop detail for shop ID: {shop_id}")
        
        # Test ShopService
        shop_dto = await ShopService.get_shop_with_reviews(shop_id)
        print("Success! Retrieved shop DTO:", shop_dto.name)
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        await Database.close_db()

asyncio.run(main())
