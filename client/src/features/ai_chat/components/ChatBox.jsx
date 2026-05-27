/**
 * ChatBox.jsx – DrinkMap AI
 *
 * Scrollable message list với smart auto-scroll:
 * - Chỉ auto-scroll nếu user đang ở gần bottom (threshold 150px)
 * - Dùng behavior: 'smooth' để trải nghiệm mượt mà khi stream từng chunk
 */

import React, { useEffect, useRef } from 'react';
import useChatStore from '../store/useChatStore';
import MessageBubble from './MessageBubble';
import BotMessage from './BotMessage';

export default function ChatBox() {
  const messages = useChatStore(s => s.messages);
  const containerRef = useRef(null);

  // Smart auto-scroll: chỉ cuộn nếu đang ở gần cuối trang
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5 scroll-smooth"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
    >
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-12 select-none">
          {/* Icon vòng tròn */}
          <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-sm">
            <span className="text-4xl" role="img" aria-label="cà phê">☕</span>
          </div>
          <h2 className="text-xl font-bold text-[#10705a] mb-2 tracking-tight">
            DrinkMap AI
          </h2>
          <p className="text-gray-400 max-w-[240px] text-[13px] leading-relaxed">
            Khám phá quán cà phê và đồ uống hoàn hảo cho bạn bằng công nghệ AI sinh tạo.
          </p>

          {/* Hint chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {['Quán gần đây', 'Có máy lạnh', 'Mở cửa 24/7'].map(hint => (
              <span
                key={hint}
                className="text-[12px] px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-full shadow-sm"
              >
                {hint}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Message list */}
      {messages.map(msg =>
        msg.role === 'user'
          ? <MessageBubble key={msg.id} message={msg} />
          : <BotMessage key={msg.id} message={msg} />
      )}
    </div>
  );
}
