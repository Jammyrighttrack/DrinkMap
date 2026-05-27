import time
import asyncio
import json
import re
import logging
from google.genai import types

from app.crud.ragRepository import RAGRepository
from app.core.ai_config import client, MODEL_NAME, _GENERATION_CONFIG

logger = logging.getLogger("DrinkMapAPI")

# ── Prompt-injection protection (kept from original) ──────────────────────────
_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|above|prior)\s+instructions?",
    r"forget\s+(everything|all|your instructions?)",
    r"you\s+are\s+now\s+a",
    r"act\s+as\s+(if\s+you\s+are|a\s+new)",
    r"<\/?(system|user|assistant|prompt|instruction)>",
    r"disregard\s+(all\s+)?(your\s+)?(previous\s+)?instructions?",
    r"new\s+instructions?:",
    r"override\s+(previous\s+)?instructions?",
    r"\[system\]",
    r"\[INST\]",
]
_INJECTION_REGEX = re.compile("|".join(_INJECTION_PATTERNS), re.IGNORECASE)
MAX_INPUT_LENGTH = 500


class ChatService:
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Truncate, strip control chars, and block prompt-injection attempts."""
        text = text[:MAX_INPUT_LENGTH]
        if _INJECTION_REGEX.search(text):
            logger.warning(f"Prompt injection blocked: {text[:80]}...")
            return "[Yêu cầu không hợp lệ. Vui lòng giao tiếp văn minh hoặc hỏi đúng chủ đề.]"
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
        return text.strip()

    @staticmethod
    async def process_pipeline(user_message: str, history: list[dict], lat: float = None, lng: float = None):
        """
        RAG-first pipeline:
          1. Sanitize input.
          2. Always run vector search against the shops collection.
          3. If context found  → inject into prompt (QUERY_DB mode).
          4. If context empty  → send plain query (GENERAL_CHAT mode).
          5. Stream Gemini response back via SSE.
        """
        start_total_time = time.time()

        def sse(data: dict) -> str:
            return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

        # ── Step 1: Sanitize ──────────────────────────────────────────────────
        clean_message = ChatService.sanitize_input(user_message)

        # ── Step 2: RAG — always run vector search ────────────────────────────
        step_rag_start = time.time()
        yield sse({"type": "status", "task": "Đang tìm kiếm quán cafe...", "status": "running"})

        context_text = ""
        try:
            context_text = await asyncio.wait_for(
                RAGRepository.get_relevant_context(clean_message, lat, lng),
                timeout=10.0,
            )
        except asyncio.TimeoutError:
            logger.warning("[ChatService] RAG timed out after 10s — proceeding without context.")
        except Exception as e:
            logger.error(f"[ChatService] RAG error: {e}")

        has_context = bool(context_text)
        rag_time    = round(time.time() - step_rag_start, 3)

        logger.info(
            f"[ChatService] RAG done in {rag_time}s — "
            f"context={'injected' if has_context else 'empty (general chat)'}, "
            f"len={len(context_text)}"
        )

        yield sse({
            "type": "status",
            "task": "Đang tìm kiếm quán cafe...",
            "status": "done",
            "time": rag_time,
        })

        # ── Step 3: Build enriched prompt ─────────────────────────────────────
        step_gen_start = time.time()
        yield sse({"type": "status", "task": "Đang tổng hợp menu...", "status": "running"})

        if has_context:
            # QUERY_DB mode: give AI real shop data
            enhanced_message = (
                f"Đọc dữ liệu DB thực tế sau:\n{context_text}\n\n"
                f"Hãy trả lời yêu cầu của người dùng: {clean_message}"
            )
        else:
            # GENERAL_CHAT mode: no shop context found — AI answers freely
            enhanced_message = clean_message

        # ── Step 4: Build contents (history + current turn) ───────────────────
        contents = []
        for msg in history:
            role    = msg.get("role", "user")
            content = msg.get("content", "")
            if content:
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part(text=content)]
                ))
        contents.append(types.Content(
            role="user",
            parts=[types.Part(text=enhanced_message)]
        ))

        logger.info(
            f"[ChatService] Sending to Gemini — "
            f"mode={'QUERY_DB' if has_context else 'GENERAL_CHAT'}, "
            f"history={len(history)}, context_len={len(context_text)}"
        )

        # ── Step 5: Stream Gemini response ────────────────────────────────────
        total_content_sent = 0
        try:
            async for chunk in await client.aio.models.generate_content_stream(
                model=MODEL_NAME,
                contents=contents,
                config=_GENERATION_CONFIG,
            ):
                chunk_text = None
                try:
                    chunk_text = chunk.text
                except (ValueError, AttributeError) as chunk_err:
                    logger.warning(f"[ChatService] Chunk blocked or empty: {chunk_err}")
                    continue

                if chunk_text:
                    total_content_sent += len(chunk_text)
                    yield sse({"type": "content", "text": chunk_text})

            if total_content_sent == 0:
                logger.error("[ChatService] Gemini returned 0 bytes — Safety Filter or model error.")
                yield sse({
                    "type": "error",
                    "text": "AI không thể tạo câu trả lời. Vui lòng thử câu hỏi khác.",
                })

        except Exception as e:
            logger.exception(f"[ChatService] generate_content error: {e}")
            yield sse({"type": "error", "text": f"Lỗi tạo nội dung: {str(e)}"})

        finally:
            gen_time   = round(time.time() - step_gen_start, 2)
            total_time = round(time.time() - start_total_time, 2)

            yield sse({"type": "status", "task": "Đang tổng hợp menu...", "status": "done", "time": gen_time})
            logger.info(
                f"[ChatService] Pipeline done — total={total_time}s, "
                f"content={total_content_sent}B, mode={'QUERY_DB' if has_context else 'GENERAL_CHAT'}"
            )
            yield sse({"type": "finish", "total_time": total_time})
