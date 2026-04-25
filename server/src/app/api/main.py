from fastapi import APIRouter

from app.api.routes import (
    auth,
    usersAPI,
    shopsAPI,
    reviewsAPI,
    drinksAPI,
    recommendAPI,
    health,
    uploadAPI
)

api_router = APIRouter()
  
# Đăng ký toàn bộ các endpoint
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(usersAPI.router, prefix="/users", tags=["users"])
api_router.include_router(shopsAPI.router, prefix="/shops", tags=["shops"])
api_router.include_router(drinksAPI.router, prefix="/drinks", tags=["drinks"])
api_router.include_router(reviewsAPI.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(recommendAPI.router, prefix="/recommendations", tags=["recommendations"])
api_router.include_router(uploadAPI.router, prefix="/upload", tags=["upload"])
