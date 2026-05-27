/**
 * ShopCard.jsx – SHOP: rich recommendation card
 * Rendered from { type: 'shop', name, info, location, cover_image, slug } token.
 *
 * Deep linking: bọc bằng <Link to={`/shop/${slug}`}> để SPA navigation đúng chuẩn.
 * XSS-safe: không dùng innerHTML, mọi giá trị đều là React text nodes.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMapStore } from '../../../store/useMapStore';

// Ảnh fallback deterministic theo tên quán
const getImgUrl = (name) => {
  const idx = (name.length % 9) + 1;
  return `https://loremflickr.com/80/80/cafe,coffee?lock=${idx}`;
};

export default function ShopCard({ name, info, location, cover_image, slug }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const setFocusedShop = useMapStore(state => state.setFocusedShop);

  const cardContent = (
    <div
      role="article"
      aria-label={`Quán ${name} tại ${location}`}
      onMouseEnter={() => setFocusedShop({ name, info, location, cover_image, slug })}
      onClick={() => setFocusedShop({ name, info, location, cover_image, slug })}
      className="
        flex items-center gap-4 rounded-[30px] p-2.5 px-3 my-2 cursor-pointer
        bg-white border-none
        shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]
        hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-300 ease-out
      "
    >
      {/* Avatar ảnh quán */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
        <img
          src={cover_image || getImgUrl(name)}
          alt={`Ảnh quán ${name}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { e.currentTarget.src = getImgUrl(name); }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Shimmer placeholder khi ảnh chưa load */}
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse rounded-full" />
        )}
      </div>

      {/* Thông tin quán */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="font-bold text-gray-800 text-[14px] leading-tight truncate">
          ☕ {name}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] opacity-70">💰</span>
          <p className="text-[#10705a] text-[13px] font-extrabold tracking-tight">
            {info && (info.includes('VND') || info.includes('₫') || info === 'N/A')
              ? info
              : `${info} VND`}
          </p>
        </div>
        <p className="text-gray-400 text-[10px] mt-1 truncate flex items-center gap-0.5">
          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current opacity-70 flex-shrink-0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span className="truncate">{location}</span>
        </p>
      </div>

      {/* Arrow */}
      <span className="text-gray-300 text-2xl font-light pr-2 mb-1 flex-shrink-0" aria-hidden>›</span>
    </div>
  );

  // Nếu có slug → SPA Link, không có → div không-clickable (tránh broken link)
  if (slug) {
    return (
      <Link
        to={`/shop/${slug}`}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 rounded-[30px]"
        style={{ textDecoration: 'none', color: 'inherit' }}
        aria-label={`Xem chi tiết quán ${name}`}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
