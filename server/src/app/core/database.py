from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from typing import Optional
   
class Database:
    client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None # Lưu trữ instance database toàn cục
               
    @classmethod
    async def connect_db(cls) -> AsyncIOMotorDatabase:
        """Connect to MongoDB and create indexes""" 
        mongo_uri = os.getenv('MONGO_URI') 
        db_name = os.getenv('DB_NAME') or "DrinkAI"
            
        if not mongo_uri:
            raise ValueError("Environment variable MONGO_URI must be set")
                      
        cls.client = AsyncIOMotorClient(mongo_uri)
        cls._db = cls.client[db_name] # BẮT BUỘC: Gán vào biến class để dùng chung
                
        try:
            print("[DATABASE] Đang thiết lập các chỉ mục (Indexes) trên Atlas...")
            # Create 2dsphere index for geospatial queries
            await cls._db.shops.create_index([("location", "2dsphere")])
                  
            # Create other useful indexes
            await cls._db.users.create_index("email", unique=True)
            await cls._db.shops.create_index("tags")  # Sửa từ category thành tags cho khớp dữ liệu seed
            await cls._db.reviews.create_index("shop_id")
        except Exception as idx_err:
            print(f"⚠️ [CẢNH BÁO INDEX]: Tạo chỉ mục thất bại nhưng bỏ qua để chạy tiếp: {idx_err}")
                 
        return cls._db
         
    @classmethod
    async def close_db(cls):
        """Close database connection"""
        if cls.client: 
            cls.client.close()
            cls.client = None
            cls._db = None
          
    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Get database instance - Bọc lót tự động kết nối nếu biến bị rỗng"""
        if cls._db is None:
            print("⚠️ [DATABASE]: Khởi tạo bọc lót ngay tại chỗ cho request API...")
            mongo_uri = os.getenv('MONGO_URI')
            db_name = os.getenv('DB_NAME') or "DrinkAI"
            
            if not mongo_uri:
                raise Exception("Không thể tự kết nối bọc lót vì thiếu biến MONGO_URI")
                
            cls.client = AsyncIOMotorClient(mongo_uri)
            cls._db = cls.client[db_name]
            
        return cls._db