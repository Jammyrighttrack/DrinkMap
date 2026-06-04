from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
import os
import uuid    
from app.core.database import Database
             
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# Sử dụng OAuth2PasswordBearer giúp Swagger UI và App hoạt động chuẩn với `Authorization: Bearer <token>`
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login/access-token", auto_error=False)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:   
        expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
             
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
     
def verify_token(token: str):
    """Verify JWT token and return payload"""
    try:    
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
            
async def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme)
):
    """
    Lấy thông tin user hiện tại. 
    Ưu tiên lấy từ header (Authorization: Bearer), fallback về Cookie (access_token).
    """
    cookie_token = request.cookies.get("access_token")
    token = bearer_token if bearer_token else cookie_token
     
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản chưa đăng nhập hoặc phiên làm việc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )
             
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_id = payload.get("sub")
    if not user_id:  
        raise HTTPException(   
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cấu trúc token không đúng chuẩn"
        )
         
    db = Database.get_db()
    # Kiểm tra user trong DB có bị khóa hay không, v.v..
    user_doc = await db.users.find_one({"id": user_id, "is_active": {"$ne": False}}, {"_id": 0})
         
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại hoặc đã bị khóa"
        )
    
    return user_doc

async def get_optional_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme)
):
    """Lấy user nếu đã đăng nhập, không bắt buộc (vd: dùng ở chức năng tìm kiếm quán)"""
    cookie_token = request.cookies.get("access_token")
    token = bearer_token if bearer_token else cookie_token
    
    if not token:
        return None
    
    try:
        # Nếu có token thì cố gắng verify
        return await get_current_user(request=request, bearer_token=bearer_token)
    except HTTPException:
        return None
