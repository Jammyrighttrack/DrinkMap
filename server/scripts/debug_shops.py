import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('.env'))

async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    shop = await db.shops.find_one({}, {'_id': 0})
    print("category type:", type(shop.get('category')))
    print("category value:", shop.get('category'))
    print("is_active:", shop.get('is_active'))
    
    # Try the geoNear pipeline
    pipeline = [
        {
            "$geoNear": {
                "near": {"type": "Point", "coordinates": [105.8542, 21.0285]},
                "distanceField": "distance",
                "maxDistance": 50000,
                "spherical": True
            }
        },
        {"$limit": 3}
    ]
    try:
        cursor = db.shops.aggregate(pipeline)
        shops = await cursor.to_list(length=3)
        for s in shops:
            s.pop('_id', None)
            print("Found:", s.get('name'), "| category:", s.get('category'))
    except Exception as e:
        print("Pipeline error:", e)
    
    client.close()

asyncio.run(main())
