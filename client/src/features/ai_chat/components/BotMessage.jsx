/**
 * BotMessage.jsx – v4 (DrinkMap AI Integration)
 *
 * Text rendering: plain-text renderer với typewriter cursor khi streaming.
 * Custom tokens:
 *   SHOP    → <ShopCard> (có deep link /shop/:slug qua react-router-dom)
 *   DRINK   → <DrinkCard>
 *   SUGGEST → handled globally via Zustand setSuggestions (không render ở đây)
 * Pipeline auto-hides với fade animation sau khi stream xong.
 */

import React, { useEffect, useState } from 'react';
import useChatStore from '../store/useChatStore';
import StatusPipeline from './StatusPipeline';
import ShopCard from './ShopCard';
import DrinkCard from './DrinkCard';
import { motion } from 'framer-motion';

// ── Plain text renderer với typewriter cursor ──────────────────────────────────
function TextBlock({ content, isStreaming }) {
  if (!content) return null;
  const lines = content.split('\n');
  return (
    <div className={`text-[15px] text-gray-800 leading-relaxed space-y-1.5 ${isStreaming ? 'typewriter-cursor' : ''}`}>
      {lines.map((line, idx) => (
        line.trim()
          ? <p key={idx}>{line}</p>
          : <br key={idx} />
      ))}
    </div>
  );
}

// ── Token renderer: dispatch đến card component hoặc text block ───────────────
function TokenRenderer({ tokens, isStreaming, rawContent }) {
  // FALLBACK: stream xong nhưng không parse được token nào → hiện raw
  if (!tokens?.length) {
    if (isStreaming) return null; // còn đang stream → im lặng chờ
    if (rawContent?.trim()) {
      return (
        <div className="text-[14px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
          <span className="font-semibold block mb-1">⚠️ Đang xử lý dữ liệu trả về...</span>
          <span className="font-mono text-[12px] break-all text-gray-600">{rawContent.slice(0, 600)}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-1">
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'shop':
            return (
              <motion.div
                key={`shop-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="my-2"
              >
                <ShopCard
                  name={token.name}
                  info={token.info}
                  location={token.location}
                  cover_image={token.cover_image}
                  slug={token.slug}
                />
              </motion.div>
            );
          case 'drink':
            return (
              <motion.div
                key={`drink-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="my-2"
              >
                <DrinkCard
                  name={token.name}
                  price={token.price}
                  location={token.location}
                  image_url={token.image_url}
                  slug={token.slug}
                />
              </motion.div>
            );
          case 'suggest':
            // Chip gợi ý được xử lý global qua Zustand — không render ở đây
            return null;
          case 'markdown':
          default:
            return (
              <TextBlock
                key={`text-${i}`}
                content={token.content}
                isStreaming={isStreaming && i === tokens.length - 1}
              />
            );
        }
      })}
    </div>
  );
}

// ── Pipeline auto-hide sau khi stream hoàn tất ────────────────────────────────
function AutoHidePipeline({ pipeline, status }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (status === 'done' || status === 'cancelled' || status === 'error') {
      const delayTimer  = setTimeout(() => setFading(true),  800);
      const removeTimer = setTimeout(() => setVisible(false), 1400);
      return () => {
        clearTimeout(delayTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [status]);

  if (!visible || !pipeline?.length) return null;

  return (
    <div
      style={{
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        opacity: fading ? 0 : 1,
        transform: fading ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <StatusPipeline pipeline={pipeline} />
    </div>
  );
}

// ── Streaming dots indicator (hiện khi chưa có content) ──────────────────────
function StreamingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ── BotMessage root component ─────────────────────────────────────────────────
export default function BotMessage({ message }) {
  const cancelStream = useChatStore(s => s.cancelStream);

  const isStreaming  = message.status === 'streaming';
  const isCancelled  = message.status === 'cancelled';
  const isError      = message.status === 'error';
  const isDone       = message.status === 'done';
  const hasContent   = message.tokens?.length > 0;
  const hasRawText   = message.content?.length > 0;

  // Hiển thị bubble khi:
  //   - có tokens parse được, HOẶC
  //   - stream xong + có raw text (fallback), HOẶC
  //   - trạng thái lỗi / huỷ
  const shouldShowBubble = hasContent || (isDone && hasRawText) || isCancelled || isError;

  return (
    <div className="flex flex-col w-full gap-1.5">
      {/* Pipeline + Cancel row */}
      <div className="flex items-start justify-between gap-2">
        <AutoHidePipeline pipeline={message.pipeline} status={message.status} />
        {isStreaming && (
          <button
            onClick={() => cancelStream(message.id)}
            aria-label="Huỷ tác vụ đang chạy"
            className="
              mb-2 ml-auto flex-shrink-0 text-xs font-semibold
              px-3 py-1.5 border border-red-400 text-red-500 bg-white
              rounded-full hover:bg-red-500 hover:text-white hover:border-red-500
              transition-all duration-200 whitespace-nowrap
            "
          >
            Huỷ
          </button>
        )}
      </div>

      {/* Streaming dots khi chưa có content gì */}
      {isStreaming && !hasRawText && (
        <div className="self-start ml-1">
          <StreamingDots />
        </div>
      )}

      {/* Message bubble */}
      {shouldShowBubble && (
        <div className="
          bg-[#f0f4f3] px-5 py-4
          rounded-[24px] rounded-tl-[6px]
          shadow-[0_1px_3px_rgba(0,0,0,0.06)]
          max-w-[92%] self-start flex flex-col gap-2
        ">
          {/* Token content — truyền rawContent để fallback nếu tokens rỗng */}
          <TokenRenderer
            tokens={message.tokens}
            isStreaming={isStreaming}
            rawContent={message.content}
          />

          {/* Cancelled state */}
          {isCancelled && !hasContent && (
            <p className="text-gray-400 text-sm italic flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
              Yêu cầu đã bị huỷ.
            </p>
          )}

          {/* Error state */}
          {isError && (
            <p className="text-red-500 text-sm flex items-center gap-1.5">
              ⚠️ {message.errorText || 'Đã xảy ra lỗi. Vui lòng thử lại.'}
            </p>
          )}

          {/* Total time badge */}
          {message.totalTime != null && (
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              ⚡ {message.totalTime}s
            </p>
          )}
        </div>
      )}
    </div>
  );
}
