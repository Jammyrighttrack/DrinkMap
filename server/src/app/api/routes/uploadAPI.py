import os
import time
import cloudinary.utils
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.core.auth import get_current_user

class CloudinarySignature(BaseModel):
    signature: str
    timestamp: int
    cloud_name: str
    api_key: str
    folder: str
    resource_type: str

router = APIRouter()

@router.get("/signature", response_model=CloudinarySignature)
async def get_cloudinary_signature(
    resource_type: str = Query("image", pattern="^(image|video)$"),
    folder: str = Query("drinkmap", description="Thư mục lưu trữ trên Cloudinary"),
    current_user: dict = Depends(get_current_user)
):
    """
    Tạo Signature để Frontend upload ảnh trực tiếp lên Cloudinary.
    Quy trình: 
    1. Frontend gọi API này -> Nhận Signature.
    2. Frontend gửi Ảnh + Signature lên Cloudinary.
    3. Cloudinary trả về URL ảnh -> Frontend gửi URL này về API lưu Shop/Review.
    """
    
    # 1. Kiểm tra cấu hình Cloudinary trong .env
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")

    if not api_secret or not api_key or not cloud_name:
        raise HTTPException(
            status_code=503,
            detail="Cloudinary chưa được cấu hình. Vui lòng kiểm tra file .env"
        )
    
    # 2. Kiểm soát folder để tránh User upload lung tung
    # Senior Tip: Chỉ cho phép upload vào một số folder nhất định của DrinkMap
    ALLOWED_FOLDERS = ("shops", "reviews", "users", "drinkmap")
    # Tách lấy phần folder gốc nếu user gửi đường dẫn sâu (ví dụ: shops/hanoi)
    root_folder = folder.split('/')[0]
    
    if root_folder not in ALLOWED_FOLDERS:
        folder = f"drinkmap/{folder}"
    
    # 3. Tạo các tham số để ký (Signature Parameters)
    timestamp = int(time.time())
    params_to_sign = {
        "timestamp": timestamp,
        "folder": folder,
        "resource_type": resource_type
    }
    
    # 4. Tạo chữ ký bảo mật bằng API Secret
    try:
        signature = uploadAPI.utils.api_sign_request(
            params_to_sign,
            api_secret
        )  
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo chữ ký: {str(e)}")
       
    # 5. Trả về toàn bộ thông tin cần thiết cho Frontend
    return CloudinarySignature(
        signature=signature,
        timestamp=timestamp,
        cloud_name=cloud_name,
        api_key=api_key,
        folder=folder,
        resource_type=resource_type
    )