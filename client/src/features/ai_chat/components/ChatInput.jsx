/**
 * ChatInput.jsx – DrinkMap AI
 *
 * Input area gồm:
 * - SuggestionChips: horizontally scrollable quick-reply chips
 * - Input field + Send button (rounded-full, green theme)
 * - Concurrency guard: disabled khi đang xử lý 2 streams cùng lúc
 */

import React, { useState, useRef } from 'react';
import useChatStore from '../store/useChatStore';
import SuggestionChips from './SuggestionChips';
import { useSSEStream } from '../hooks/useSSEStream';

const MAX_CONCURRENT = 2;

export default function ChatInput() {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  // Lấy count trực tiếp từ selector — KHÔNG gọi .activeStreamCount() trong selector
  // vì activeStreamCount là một function, dùng s.activeStreamCount() bên ngoài
  const activeStreams = useChatStore(s => s.activeStreams);
  const activeCount = Object.keys(activeStreams).length;

  const { sendMessage } = useSSEStream();

  const isAtLimit = activeCount >= MAX_CONCURRENT;
  const canSend = text.trim().length > 0 && !isAtLimit;

  const handleSend = () => {
    if (!canSend) return;
    const msg = text.trim();
    setText('');
    sendMessage(msg);
    // Focus lại input sau khi gửi
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectSuggestion = (chipText) => {
    if (isAtLimit) return;
    sendMessage(chipText);
    setText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="pt-3 pb-5 px-4">
      {/* Suggestion chips */}
      <div className="mb-3">
        <SuggestionChips onSelect={handleSelectSuggestion} />
      </div>

      {/* Input row */}
      <div className="
        relative flex items-center
        bg-white border border-gray-200
        rounded-full shadow-sm
        p-1.5
        focus-within:border-teal-400
        focus-within:ring-[3px] focus-within:ring-teal-400/20
        transition-all duration-200
      ">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAtLimit
              ? `Đang xử lý, vui lòng chờ...`
              : 'Hỏi AI về quán cafe...'
          }
          disabled={isAtLimit}
          autoComplete="off"
          spellCheck="false"
          className="
            flex-1 bg-transparent border-none outline-none
            px-4 text-gray-800 text-[14px] placeholder-gray-400
            font-medium disabled:opacity-50 min-w-0
          "
          aria-label="Nhập câu hỏi cho DrinkMap AI"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="
            w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0
            bg-gradient-to-br from-[#10705a] to-[#1a9a7c]
            text-white
            hover:from-[#0e6350] hover:to-[#178a6e]
            active:scale-95
            disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed
            transition-all duration-200 shadow-sm
          "
          aria-label="Gửi tin nhắn"
        >
          {/* Paper plane icon */}
          <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-current translate-x-[1px]">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Concurrency hint */}
      {isAtLimit && (
        <p className="text-center text-[11px] text-amber-500 mt-2 font-medium">
          ⏳ Đang xử lý {activeCount} yêu cầu — vui lòng chờ hoặc huỷ bớt
        </p>
      )}
    </div>
  );
}
