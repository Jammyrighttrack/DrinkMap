import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
    
# Import Router tổng (nơi gom tất cả auth, shops, users...)
from app.api.main import api_router
from app.core.database import Database

# 1. Khởi chạy môi trường
ROOT_DIR = Path(__file__).parent.parent.parent # Trỏ ra thư mục gốc chứa .env
load_dotenv(ROOT_DIR / '.env')

# 2. Quản lý vòng đời ứng dụng (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Kết nối DB khi bật server
    await Database.connect_db()
    yield
    # Shutdown: Ngắt kết nối DB khi tắt server
    await Database.close_db()
        
# 3. Khởi tạo FastAPI App
app = FastAPI(
    title="DrinkMap AI API",
    description="Hệ thống gợi ý quán nước thông minh dựa trên vị trí và sở thích",
    version="1.0.0",
    lifespan=lifespan
)

# 4. Cấu hình CORS (Middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Kết nối Router Tổng (Chứa tất cả các routes đã tách)
app.include_router(api_router, prefix="/api")

# Route kiểm tra nhanh tại trang chủ
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to DrinkMap AI API. Go to /docs for documentation."}
