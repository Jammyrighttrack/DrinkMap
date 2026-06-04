import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EllipsisVerticalIcon, HandThumbUpIcon, ChatBubbleLeftIcon, StarIcon, PhotoIcon } from '@heroicons/react/24/outline';

// Dùng đường dẫn tương đối để lên thẳng thư mục src/components
import { RatingStars } from '../../../components/ui/RatingStars';

/**
 * ReviewItem - Component "cục gạch" chuẩn mực hiển thị 1 bình luận/Đánh giá.
 * 
 * @param {Object} review - Data của 1 comment
 * @param {Function} onImageClick - Lệnh mở Full-screen Image Viewer khi bấm vào ảnh thu nhỏ
 */
export function ReviewItem({ review, onImageClick }) {
  // Phòng hờ nếu thiếu data thì lấy dữ liệu Mock tạm thời để dev UI không bị vỡ
  const safeReview = review || {
    id: 'mock-1',
    user: {
      fullName: 'Người dùng Ẩn danh',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      level: 'Thành viên mới'
    },
    rating: 5,
    createdAt: 'Hôm qua',
    content: 'Quán decor siêu xinh, cà phê pha máy rất đậm đà không bị chua. Chỗ ngồi hơi ít nên đi nhóm đông phải canh giờ. Chắc chắn sẽ ôm laptop ra đây thả hồn vào những chiều thu Hà Nội! ❤️',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=300'
    ],
    likesCount: 12,
    isLiked: false
  };

  const { id, user, rating, createdAt, content, images, likesCount, isLiked } = safeReview;
  
  // State cục bộ xử lý việc xem thêm do text quá dài và nút Hữu ích
  const [isExpanded, setIsExpanded] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);

  // Cắt ngắn content nếu quá dài (chuẩn UI chống tràn màn hình)
  const isContentLong = content && content.length > 200;
  const displayContent = isContentLong && !isExpanded 
    ? content.substring(0, 200) + '...' 
    : content;

  // Xử lý nút Hữu Ích (Fake gọi API update số đếm)
  const handleToggleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.4 }}
      className="py-5 border-b border-zinc-100 dark:border-zinc-800/80 last:border-b-0"
    >
      {/* 1. Header Của Comment: Avatar, Tên, Cấp độ, 3 Chấm */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3 w-full">
          {/* Avatar User */}
          <div className="relative w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 shrink-0 shadow-sm border border-zinc-200/50 dark:border-zinc-700/50 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                {user?.fullName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          {/* Thông tin tên & Thời gian */}
          <div className="flex flex-col flex-1 min-w-0">
            <h4 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
              {user?.fullName}
              {user?.level && (
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-bold tracking-widest rounded">
                  {user.level}
                </span>
              )}
            </h4>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{createdAt}</span>
          </div>

          {/* Nút tuỳ chọn (Báo cáo, Xoá...) */}
          <button className="p-2 -mr-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none">
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Rating & Review Content */}
      <div className="pl-0 sm:pl-14">
        {/* Số sao của bình luận này */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <RatingStars rating={rating} size="sm" readOnly />
          {rating === 5 && (
            <span className="ml-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Tuyệt vời</span>
          )}
        </div>

        {/* Text Body */}
        {content && (
          <div className="relative">
            <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-line antialiased">
              {displayContent}
            </p>
            {isContentLong && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[14px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 mt-1 focus:outline-none"
              >
                {isExpanded ? 'ẩn bớt' : '...Xem thêm'}
              </button>
            )}
          </div>
        )}

        {/* 3. Mảng Hình Ảnh Thu Nhỏ (Thumbnails Gallery) */}
        {images && images.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {images.slice(0, 4).map((imgUrl, index) => (
              <div 
                key={index}
                onClick={() => onImageClick && onImageClick(images, index)} // Mở lightbox (nếu có prop truyền vào)
                className="relative group w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden cursor-pointer shadow-sm border border-zinc-200/50 dark:border-zinc-700/50"
              >
                <img 
                  src={imgUrl} 
                  alt="Review picture" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out" 
                  loading="lazy"
                />
                
                {/* Nếu ảnh > 4 tấm, tấm cuối cùng sẽ đè số lượng ảnh còn lại (Như Facebook) */}
                {index === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. Action Bar (Hữu ích & Bình luận) */}
        <div className="mt-4 flex items-center gap-4">
          <button 
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors ${
              liked 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400' 
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <HandThumbUpIcon className={`w-3.5 h-3.5 ${liked ? 'fill-emerald-600 dark:fill-emerald-400' : ''}`} />
            {likes > 0 ? (liked ? `Đã Hữu ích (${likes})` : `Hữu ích (${likes})`) : 'Hữu ích'}
          </button>

          {/* (Tuỳ chọn mở rộng: Rep comment) */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 border border-transparent transition-colors">
            <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
            Thảo luận
          </button>
        </div>
      </div>
    </motion.div>
  );
}
