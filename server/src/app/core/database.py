from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from typing import Optional
   
class Database:
    client: Optional[AsyncIOMotorClient] = None
          
    @classmethod
    async def connect_db(cls) -> AsyncIOMotorDatabase:
        """Connect to MongoDB and create indexes"""
        mongo_url = os.getenv('MONGO_URL')
        db_name = os.getenv('DB_NAME')  
        if not mongo_url or not db_name:
            raise ValueError("Environment variables MONGO_URL and DB_NAME must be set")
             
        cls.client = AsyncIOMotorClient(mongo_url)
        db = cls.client[db_name]
              
        # Create 2dsphere index for geospatial queries
        await db.shops.create_index([("location", "2dsphere")])
              
        # Create other useful indexes
        await db.users.create_index("email", unique=True)
        await db.shops.create_index("category")  
        await db.reviews.create_index("shop_id")
             
        return db
         
    @classmethod
    async def close_db(cls):
        """Close database connection"""
        if cls.client: 
            cls.client.close()
          
    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if not cls.client:
            raise Exception("Database not connected")
        return cls.client[os.getenv('DB_NAME')]
              