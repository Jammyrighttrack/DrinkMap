/**
 * useSSEStream.js – v3 DEBUG EDITION
 *
 * Bổ sung bẫy log tại mọi điểm quan trọng:
 *   [RAW SSE CHUNK]   → raw bytes từ reader
 *   [SSE PART]        → từng SSE event sau split
 *   [SSE DATA]        → JSON đã parse của mỗi event
 *   [SSE CONTENT]     → chunk text từ Gemini
 *   [SSE FINISH]      → kết thúc stream
 *   [SSE ERROR]       → lỗi
 */

import { useCallback, useEffect } from 'react';
import useChatStore from '../store/useChatStore';
import { parseAITokens, extractSuggestions, forceFinalParse } from '../utils/parseAIResponse';
import { useMapStore } from '../../../store/useMapStore';
import useGeolocation from '../../map/hooks/useGeolocation';

const MAX_CONCURRENT = 2;

// Đọc từ biến môi trường Vite — KHÔNG hardcode IP
const BACKEND = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';
const API_URL = `${BACKEND}/api/chat/`;
const SAFETY_TIMEOUT_MS = 60_000;

console.log('[SSE] API_URL =', API_URL);

export function useSSEStream() {
  const { location, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const sendMessage = useCallback(async (userText) => {
    if (!userText?.trim()) return;

    const store = useChatStore.getState;

    // Concurrency guard
    if (store().activeStreamCount() >= MAX_CONCURRENT) {
      alert('Hệ thống chỉ xử lý tối đa 2 tác vụ cùng lúc. Vui lòng chờ hoặc huỷ tác vụ hiện tại.');
      return null;
    }

    const history = store().getChatHistory(20);
    store().addUserMessage(userText);
    const msgId = store().addBotMessage();
    console.log('[DEBUG ID] ✅ Bot message created với msgId:', msgId);

    const controller = new AbortController();
    store().registerStream(msgId, controller);
    console.log('[DEBUG ID] Stream đã đăng ký cho msgId:', msgId);

    const timeoutId = setTimeout(() => {
      console.warn('[SSE] ⚠️ Safety timeout reached (60s), aborting stream.');
      controller.abort();
    }, SAFETY_TIMEOUT_MS);

    let buffer = '';
    let accumulatedContent = '';
    let chunkCount = 0;
    let eventCount = 0;

    console.log(`[SSE] ▶ Bắt đầu stream cho msgId=${msgId}, userText="${userText.slice(0, 60)}"`);

    const payload = { message: userText, history };
    if (location && location.lat && location.lng) {
      payload.lat = location.lat;
      payload.lng = location.lng;
      console.log('[SSE] Gửi kèm tọa độ GPS:', location);
    }

    try {
      const response = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  controller.signal,
      });

      console.log(`[SSE] HTTP status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`[SSE] ✅ Stream done. Total chunks: ${chunkCount}, Total events: ${eventCount}, accumulatedContent.length: ${accumulatedContent.length}`);
          break;
        }

        // ── BẪY LOG 1: Raw chunk từ network ──────────────────────────────
        const rawChunk = decoder.decode(value, { stream: true });
        chunkCount++;
        console.log(`[RAW SSE CHUNK #${chunkCount}]:`, JSON.stringify(rawChunk.slice(0, 200)));

        buffer += rawChunk;

        // SSE events phân tách bằng \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // giữ lại phần chưa hoàn chỉnh

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;

          // ── BẪY LOG 2: Từng SSE part sau split ────────────────────────
          console.log(`[SSE PART #${eventCount + 1}]:`, JSON.stringify(trimmed.slice(0, 300)));

          // Xử lý multi-line SSE (mỗi dòng có thể có "data: " prefix)
          const dataLines = trimmed
            .split('\n')
            .filter(l => l.startsWith('data: '))
            .map(l => l.slice('data: '.length))
            .join('');

          if (!dataLines) {
            console.warn('[SSE] Part không có dòng data:', trimmed);
            continue;
          }

          let data;
          try {
            data = JSON.parse(dataLines);
          } catch (parseErr) {
            console.warn('[SSE] ❌ JSON.parse thất bại cho part:', JSON.stringify(dataLines.slice(0, 200)), 'Error:', parseErr.message);
            continue;
          }

          eventCount++;
          // ── BẪY LOG 3: Nội dung event đã parse ───────────────────────
          console.log(`[SSE DATA #${eventCount}] type="${data.type}"`, data.type === 'content' ? `text.length=${data.text?.length}` : '');

          switch (data.type) {
            case 'status':
              store().updatePipeline(msgId, {
                task:   data.task,
                status: data.status,
                time:   data.time ?? null,
              });
              break;

            case 'content': {
              const chunkText = data.text ?? '';
              // ── BẪY LOG 4: Content chunk từ Gemini ───────────────────
              console.log(`[SSE CONTENT] chunk="${chunkText.slice(0, 120)}"`);

              if (!chunkText) {
                console.warn('[SSE CONTENT] ⚠️ Chunk rỗng! Backend gửi type=content nhưng text=empty.');
                break;
              }

              accumulatedContent += chunkText;
              store().appendBotContent(msgId, chunkText);
              console.log(`[DEBUG ID] appendBotContent → msgId=${msgId}, store hiện có ${store().messages.length} msgs, IDs:`, store().messages.map(m => m.id));

              const tokens = parseAITokens(accumulatedContent);
              console.log(`[SSE CONTENT] tokens sau parse: ${tokens.length} tokens`);
              store().setBotTokens(msgId, tokens);
              console.log(`[DEBUG ID] setBotTokens → msgId=${msgId}, match=`, store().messages.find(m => m.id === msgId)?.tokens?.length ?? 'NOT FOUND');

              // Map Synchronization: push shops with coordinates to Map Store
              const shopTokens = tokens.filter(t => t.type === 'shop');
              if (shopTokens.length > 0) {
                const mapShops = shopTokens.map(t => ({
                  name:         t.name,
                  slug:         t.slug,
                  address:      t.location,
                  cover_image:  t.cover_image,
                  lat:          t.lat,   // tọa độ từ AI response
                  lng:          t.lng,
                }));
                console.log('[MAP SYNC] Pushing shops to MapStore:', mapShops.map(s => `${s.name} (${s.lat},${s.lng})`));
                useMapStore.getState().setActiveShops(mapShops);
              }

              const chips = extractSuggestions(tokens);
              if (chips) store().setSuggestions(chips);
              break;
            }

            case 'finish': {
              console.log(`[SSE FINISH] total_time=${data.total_time}s, accumulatedContent.length=${accumulatedContent.length}`);
              // Chỉ đánh dấu done nếu chưa bị lỗi
              const currentStatus = store().messages.find(m => m.id === msgId)?.status;
              if (currentStatus !== 'error') {
                store().finishBotMessage(msgId, data.total_time);
              }
              console.log(`[DEBUG ID] finishBotMessage → msgId=${msgId}, status hiện tại=`, store().messages.find(m => m.id === msgId)?.status ?? 'NOT FOUND');

              const finalTokens = forceFinalParse(accumulatedContent);
              console.log(`[SSE FINISH] finalTokens: ${finalTokens.length} tokens`, finalTokens);
              store().setBotTokens(msgId, finalTokens);
              console.log(`[DEBUG ID] setBotTokens final → msgId=${msgId}, tokens count=`, store().messages.find(m => m.id === msgId)?.tokens?.length ?? 'NOT FOUND');

              const finalChips = extractSuggestions(finalTokens);
              if (finalChips) store().setSuggestions(finalChips);
              break;
            }

            case 'error':
              console.error('[SSE ERROR from backend]:', data.text);
              store().setBotError(msgId, data.text ?? 'Lỗi không xác định từ server.');
              break;

            default:
              console.warn('[SSE] Unknown event type:', data.type);
              break;
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('[SSE] Stream bị huỷ (AbortError).');
        store().setBotCancelled(msgId);
      } else {
        console.error('[SSE] ❌ Fetch/Stream error:', error.name, error.message);
        store().setBotError(
          msgId,
          error.message || 'Không thể kết nối đến server. Vui lòng thử lại.'
        );
      }
    } finally {
      clearTimeout(timeoutId);
      store().removeStream(msgId);
      console.log(`[SSE] ■ Stream kết thúc. msgId=${msgId}`);
    }

    return msgId;
  }, []);

  const cancelStream = useCallback((streamId) => {
    useChatStore.getState().cancelStream(streamId);
  }, []);

  const cancelAll = useCallback(() => {
    useChatStore.getState().cancelAllStreams();
  }, []);

  return { sendMessage, cancelStream, cancelAll };
}
