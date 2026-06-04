import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/outline';

const SIZE_MAP = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
};

const GAP_MAP = {
  sm: 'gap-0.5',
  md: 'gap-1.5',
  lg: 'gap-2',
  xl: 'gap-3',
};

/**
 * RatingStars - FSD Shared UI Component
 * 
 * @description Hiển thị đánh giá sao với độ chính xác đến từng phần trăm (ví dụ 4.8 sao).
 * Hoạt động mượt mà cả ở chế độ Đọc (ReadOnly) và chế độ Tương tác đánh giá (Interactive).
 * 
 * @param {number} rating - Số sao truyền vào (Hỗ trợ số thập phân như 4.2)
 * @param {number} max - Tổng số lượng sao (Mặc định: 5)
 * @param {string} size - Kích cỡ sao ('sm', 'md', 'lg', 'xl')
 * @param {boolean} readOnly - Chế độ chỉ đọc (true) hay cho phép người dùng vote (false)
 * @param {Function} onChange - (Optional) Hàm hứng giá trị khi người dùng click đánh giá
 */
export function RatingStars({ 
  rating = 0, 
  max = 5, 
  size = 'md', 
  readOnly = false, 
  onChange 
}) {
  // State cục bộ lưu tracking con trỏ chuột khi lướt qua các ngôi sao
  const [hoverRating, setHoverRating] = useState(0);

  const starSizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const gapClass = GAP_MAP[size] || GAP_MAP.md;

  // ===============================================
  // MODE 1: NGƯỜI DÙNG TƯƠNG TÁC (VOTE SAO)
  // ===============================================
  if (!readOnly) {
    return (
      <div className={`flex items-center ${gapClass}`}>
        {[...Array(max)].map((_, index) => {
          const starValue = index + 1;
          // Ngôi sao sáng lên nếu StarValue nhỏ hơn hoặc bằng Hover (khi đang rê chuột) 
          // HOẶC nhỏ hơn/bằng Rating (kẻo chưa rê chuột)
          const isActive = starValue <= (hoverRating || rating);
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.25, rotate: 5 }}
              whileTap={{ scale: 0.85 }}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => onChange && onChange(starValue)}
              className="cursor-pointer"
            >
              <StarIcon 
                className={`${starSizeClass} transition-colors duration-300 ease-out ${
                  isActive 
                    ? 'text-amber-400 fill-amber-400 dark:text-amber-500 dark:fill-amber-500' // Sáng vàng
                    : 'text-zinc-300 fill-transparent dark:text-zinc-700' // Tối màu rỗng ruột
                }`} 
                strokeWidth={isActive ? 1.5 : 2}
              />
            </motion.div>
          );
        })}
      </div>
    );
  }

  // ===============================================
  // MODE 2: CHỈ ĐỌC (HIỂN THỊ TỈ LỆ % TUYỆT ĐỐI)
  // ===============================================
  return (
    <div className={`flex items-center ${gapClass}`}>
      {[...Array(max)].map((_, index) => {
        // Toán học xử lý tô màu % sao. 
        // Ví dụ Rating: 4.8 
        // - Star 1->4: fillPercentage = 100%
        // - Star 5: (4.8 - 4) * 100 = 80% (Bị cắt xén 20% bên phải)
        const starIndex = index;
        let fillPercentage = 0;
        
        if (rating >= starIndex + 1) {
          fillPercentage = 100;
        } else if (rating > starIndex && rating < starIndex + 1) {
          fillPercentage = (rating - starIndex) * 100;
        }

        return (
          <div key={index} className="relative inline-block">
            {/* 1. Lớp Nền Xám (Empty Star) */}
            <StarIcon 
              className={`${starSizeClass} text-zinc-300 dark:text-zinc-700 flex-shrink-0`} 
              strokeWidth={2}
              fill="currentColor"
            />
            
            {/* 2. Lớp Nổi Vàng (Filled Star) 
                Dùng thủ thuật overflow-hidden và custom width để xén cúp SVG cực kỳ chính xác! 
            */}
            {fillPercentage > 0 && (
              <div 
                className="absolute top-0 left-0 h-full overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                {/* max-w-none cực kỳ quan trọng để đảm bảo icon lúc bị xén width 
                    không tự động ép bóp méo khung (squish) mà sẽ bị cắt lẹm đúng nghĩa 
                */}
                <StarIcon 
                  className={`${starSizeClass} max-w-none text-amber-400 fill-amber-400 dark:text-amber-500 dark:fill-amber-500`} 
                  strokeWidth={2}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
