import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Append src to python path so 'app' can be imported
sys.path.append(str(ROOT_DIR / 'src'))

from app.core.database import Database
from app.services.shopService import ShopService

async def main():
    await Database.connect_db()
    try:
        print("Calling ShopService.get_nearby_shops...")
        results = await ShopService.get_nearby_shops(
            lng=105.8542,
            lat=21.0285,
            radius_km=5.0,
            beverage_types=None,
            price_range=None,
            user_prefs=None
        )
        print("Success! DTO Conversion succeeded, found:", len(results), "shops.")
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        await Database.close_db()

asyncio.run(main())
