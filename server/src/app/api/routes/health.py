from fastapi import APIRouter
from app.core.database import Database

router = APIRouter()

@router.get("/")
async def health_check():
    """
    KIỂM TRA SỨC KHỎE HỆ THỐNG:
    Dùng để các dịch vụ như Render, Docker, hoặc AWS biết server vẫn đang chạy.
    """
    # Một Senior sẽ kiểm tra luôn cả kết nối Database
    db_status = "connected" if Database.client else "disconnected"
         
    return {
        "status": "healthy",
        "service": "DrinkMap AI API",
        "database": db_status,
        "version": "1.0.0"
    }