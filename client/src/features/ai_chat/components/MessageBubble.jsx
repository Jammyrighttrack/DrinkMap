/**
 * MessageBubble.jsx – User message bubble
 *
 * Màu xanh đậm (#10705a inspired) cho user — phân biệt rõ với bot (xám nhạt).
 * Self-aligned right, corner bottom-right vuông, các corner còn lại tròn.
 */

import React from 'react';

export default function MessageBubble({ message }) {
  if (message.role !== 'user') return null;

  return (
    <div className="flex justify-end w-full">
      <div className="
        bg-gradient-to-br from-[#10705a] to-[#1a9a7c]
        text-white
        py-3 px-5
        rounded-[22px] rounded-br-[6px]
        shadow-[0_2px_8px_rgba(16,112,90,0.25)]
        max-w-[85%]   
        text-[14px] leading-relaxed font-medium
        break-words
      ">
        {message.content}
      </div>
    </div>
  );
}
