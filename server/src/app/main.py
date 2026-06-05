import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
    
# Import Router tổng và cấu hình hệ thống sử dụng đường dẫn tương đối chuẩn
from .api.main import api_router
from .core.database import Database
from .core.ai_config import init_redis, close_redis

# Khởi chạy môi trường (Chỉ dùng file .env nếu chạy dưới local)
ROOT_DIR = Path(__file__).parent.parent.parent.parent # Trỏ ra thư mục gốc chứa .env
env_path = ROOT_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

# Quản lý vòng đời ứng dụng (Lifespan)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 🟩 STARTUP: Kết nối các dịch vụ khi bật server
    print("=== SERVER STARTING ===")
    
    # Kết nối cơ sở dữ liệu MongoDB Atlas (Bắt buộc phải thành công)
    print("Connecting to MongoDB Atlas...")
    await Database.connect_db()
    
    # Khởi tạo Redis (Bọc try-except để nếu server Render Free không có Redis thì app KHÔNG bị sập)
    try:
        print("Initializing Redis Connection...")
        await init_redis()
        print("Redis connected successfully!")
    except Exception as redis_err:
        print(f"⚠️ [BỎ QUA LỖI REDIS TRÊN DEPLOY]: {redis_err}")
        print("FastAPI will still continue running without Redis cache.")
        
    yield
    
    # 🟥 SHUTDOWN: Ngắt kết nối các dịch vụ khi tắt server
    print("=== SERVER SHUTTING DOWN ===")
    try:
        await close_redis()
    except Exception:
        pass
    
    await Database.close_db()
    print("All connections closed successfully.")
        
# Khởi tạo FastAPI App
app = FastAPI(
    title="DrinkMap AI API",
    description="Hệ thống gợi ý quán nước thông minh dựa trên vị trí và sở thích",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS (Middleware) cho phép cả Local và Vercel truy cập tự do
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://drink-map.vercel.app",             # Link Vercel chính thức của bạn
    "https://vite-react-nine-sigma-42.vercel.app" # Link Vercel phụ dự phòng
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Kết nối Router Tổng (Chứa tất cả các api/routes con)
app.include_router(api_router, prefix="/api")

# Route kiểm tra nhanh tại trang chủ
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to DrinkMap AI API. Go to /docs for documentation."}