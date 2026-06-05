import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
    
# Import các module hệ thống
from .api.main import api_router
from .core.database import Database
from .core.ai_config import init_redis, close_redis

# Khởi chạy môi trường
ROOT_DIR = Path(__file__).parent.parent.parent.parent
env_path = ROOT_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

# 🛡️ LIFESPAN BỌC THÉP: Bỏ qua mọi lỗi kết nối để ÉP server phải LIVE
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=== [HỆ THỐNG] ĐANG KHỞI ĐỘNG FASTAPI SERVER ===")
    
    # 1. Thử kết nối MongoDB (Nếu lỗi thì in ra chứ không được làm sập app)
    try:
        print("[DATABASE] Đang kết nối MongoDB Atlas...")
        await Database.connect_db()
        print("[DATABASE] Kết nối MongoDB thành công hoặc đã kích hoạt tiến trình!")
    except Exception as db_err:
        print(f"❌ [CẢNH BÁO DATABASE LỖI]: {db_err}")
        print("Hệ thống bỏ qua để giữ server không bị crash status 1.")
        
    # 2. Thử kết nối Redis (Nếu lỗi tuyệt đối không được sập)
    try:
        print("[REDIS] Đang kết nối Redis Cache...")
        await init_redis()
        print("[REDIS] Kết nối Redis thành công!")
    except Exception as redis_err:
        print(f"⚠️ [CẢNH BÁO REDIS LỖI]: {redis_err}")
        print("Hệ thống bỏ qua dịch vụ Redis để chạy tiếp.")
        
    yield
    
    # Khi tắt server, bọc try-except để tắt êm đẹp
    print("=== [HỆ THỐNG] ĐANG TẮT SERVER ===")
    try:
        await close_redis()
    except Exception:
        pass
    try:
        await Database.close_db()
    except Exception:
        pass
        
# Khởi tạo FastAPI App
app = FastAPI(
    title="DrinkMap AI API",
    description="Hệ thống gợi ý quán nước thông minh",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://drink-map.vercel.app",
    "https://vite-react-nine-sigma-42.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
async def root():
    return {"message": "Server DrinkMap AI đã LIVE thành công mượt mà!"}