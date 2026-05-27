from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.dtos.chatDTO import ChatRequest
from app.services.chatService import ChatService

router = APIRouter()

# Headers chuẩn SSE – ngăn proxy/Nginx buffer stream làm đứng luồng
_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",   # Tắt buffering của Nginx
    "Connection": "keep-alive",
}

@router.post("/")
async def chat_endpoint(req: ChatRequest):
    """
    POST /api/chat/
    Nhận tin nhắn từ Frontend, trả về luồng SSE (Server-Sent Events).
    Mỗi event có dạng: data: {"type": "status"|"content"|"finish"|"error", ...}\n\n
    """
    return StreamingResponse(
        ChatService.process_pipeline(req.message, req.history, req.lat, req.lng),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )
