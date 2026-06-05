import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
    
# Dùng dấu chấm tương đối để nhận diện đúng folder core và api trong cùng gói app
from .api.main import api_router
from .core.database import Database
from .core.ai_config import init_redis, close_redis

# Khởi chạy môi trường (Chỉ dùng file .env nếu chạy dưới local)
ROOT_DIR = Path(__file__).parent.parent.parent.parent # Trỏ hẳn ra thư mục gốc dự án
env_path = ROOT_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

# Quản lý vòng đời ứng dụng (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Kết nối DB khi bật server
    await Database.connect_db()
    await init_redis()
    yield
    # Shutdown: Ngắt kết nối DB khi tắt server
    await close_redis()
    await Database.close_db()
        
# Khởi tạo FastAPI App
app = FastAPI(
    title="DrinkMap AI API",
    description="Hệ thống gợi ý quán nước thông minh dựa trên vị trí và sở thích",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS (Middleware)
# SỬA TẠI ĐÂY: Thêm link Vercel xịn của bạn vào thẳng Backend để thông dòng kết nối
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://drink-map.vercel.app",             # Link Vercel thật của Giang
    "https://vite-react-nine-sigma-42.vercel.app" # Link Vercel phụ
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Kết nối Router Tổng
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to DrinkMap AI API. Go to /docs for documentation."}