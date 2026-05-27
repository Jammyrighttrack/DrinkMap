/**
 * SuggestionChips.jsx – DrinkMap AI
 *
 * Horizontally scrollable quick-reply chips.
 * Hỗ trợ:
 *   - Drag to scroll (chuột)
 *   - Wheel horizontal scroll
 *   - Ẩn scrollbar (chips-scroll class trong index.css)
 */

import React, { useRef, useState } from 'react';
import useChatStore from '../store/useChatStore';

export default function SuggestionChips({ onSelect }) {
  const suggestions = useChatStore(s => s.suggestions);
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [didDrag, setDidDrag] = useState(false);

  if (!suggestions || suggestions.length === 0) return null;

  // ── Drag to scroll ──────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDidDrag(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 4) setDidDrag(true);
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // ── Wheel horizontal scroll ─────────────────────────────────────────────────
  const handleWheel = (e) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      className={`
        flex flex-row overflow-x-auto gap-2 whitespace-nowrap p-2 w-full select-none
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      aria-label="Từ khóa gợi ý"
    >
      {suggestions.map((chip, i) => (
        <button
          key={`${chip}-${i}`}
          onClick={() => {
            if (!didDrag) onSelect(chip);
          }}
          className="
            flex-shrink-0
            bg-white border border-gray-200
            text-gray-600 font-medium text-[12px]
            px-3.5 py-2 rounded-full
            hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700
            active:scale-95
            transition-all duration-150
            whitespace-nowrap
            shadow-sm
          "
          style={{ animationDelay: `${i * 40}ms` }}
          aria-label={`Gợi ý: ${chip}`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
