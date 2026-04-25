import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, SlidersHorizontal, Edit3, MessageSquareOff } from 'lucide-react';
import { RatingStars } from '../../../components/ui/RatingStars';
import { ReviewItem } from './ReviewItem';

// DỮ LIỆU MOCK TẠM THỜI CHỜ NỐI API
const MOCK_REVIEWS = [
  {
    id: 'r1',
    user: { fullName: 'Minh Tuấn', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80', level: 'Local Guide' },
    rating: 5,
    createdAt: '2 ngày trước',
    content: 'Cà phê ủ lạnh (Cold Brew) ở đây làm cực kỳ xuất sắc, vị trái cây lên rất mượt mà không bị gắt cồn. Không gian tông gỗ ấm siêu hợp để ngồi chạy deadline luôn nhé bà con!',
    images: ['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=300'],
    likesCount: 24,
    isLiked: true
  },
  {
    id: 'r2',
    user: { fullName: 'Hương Ly', avatar: null, level: 'Thành viên mới' },
    rating: 4,
    createdAt: '1 tuần trước',
    content: 'Bánh matcha ngon, nước ổn. Nhưng điểm trừ là cuối tuần quán mở nhạc hơi to, mình không thể tập trung nói chuyện với bạn được. Nhân viên nhiệt tình, dễ thương.',
    images: [],
    likesCount: 3,
    isLiked: false
  },
  {
    id: 'r3',
    user: { fullName: 'Chris P. Bacon', avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=150&q=80' },
    rating: 5,
    createdAt: '2 tháng trước',
    content: 'Hidden gem in District 1! The pour-over V60 here using Ethiopian beans blew my mind. Will definitely come back.',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300',
      'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=300',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=300',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=300',
      'https://images.unsplash.com/photo-1495474472204-51860be24c75?auto=format&fit=crop&w=300',
    ],
    likesCount: 89,
    isLiked: false
  }
];

const RATING_STATS = {
  average: 4.8,
  total: 124,
  distribution: { 5: 85, 4: 25, 3: 10, 2: 3, 1: 1 } // Số lượng đánh giá theo từng sao
};

/**
 * ReviewList - Khung danh sách chứa toàn bộ Review của 1 Shop
 * Thường nằm trong Tab của ShopBottomSheet hoặc ShopDetails.
 * 
 * @param {string} shopId - Truyền id quán để fetch list hoặc tự móc (nếu có Redux)
 * @param {Function} onWriteReview - Lệnh mở form/modal Viết Đánh Giá
 */
export function ReviewList({ shopId, onWriteReview }) {
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest' | 'helpful'
  
  // Tính % độ dài của từng thanh bar hiển thị số sao
  const getPercentage = (count) => {
    return Math.round((count / RATING_STATS.total) * 100);
  };

  // Mock Sort Logic (Tương lai Handle bằng API Sort Query)
  const sortedReviews = [...MOCK_REVIEWS].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    if (sortBy === 'helpful') return b.likesCount - a.likesCount;
    return 0; // Mặc định newest thì giữ nguyên (Mock date)
  });

  return (
    <div className="w-full bg-white dark:bg-zinc-950/50 pb-8 rounded-b-3xl sm:rounded-b-2xl">
      
      {/* 1. KẸP OVERALL SUMMARY: Tổng quan Số Sao & Khung Bar */}
      <div className="p-5 sm:p-8 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800/80">
        <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-6">Tổng quan đánh giá</h3>
        
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
          
          {/* Cục điểm trung bình to đùng */}
          <div className="flex flex-col items-center justify-center shrink-0 w-32">
            <span className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none mb-2">
              {RATING_STATS.average}
            </span>
            <RatingStars rating={RATING_STATS.average} size="md" readOnly />
            <span className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400 mt-2">
              Dựa trên <b>{RATING_STATS.total}</b> lượt
            </span>
          </div>

          {/* Biểu đồ thanh ngang (Tiêu chuẩn của App xịn) */}
          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = RATING_STATS.distribution[star] || 0;
              const percent = getPercentage(count);
              
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="shrink-0 w-12 text-zinc-600 dark:text-zinc-400 font-bold flex items-center justify-end gap-1">
                    {star} <Star className="w-3.5 h-3.5 fill-current" />
                  </span>
                  
                  <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
                    <motion.div 
                      // Hiệu ứng "chạy" thanh loading khi vừa kéo đến
                      initial={{ width: 0 }}
                      whileInView={{ width: `${percent}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`absolute top-0 bottom-0 left-0 rounded-full ${
                        star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-amber-300' : 'bg-red-400'
                      }`}
                    />
                  </div>
                  
                  <span className="shrink-0 w-10 text-right text-xs font-bold text-zinc-400 dark:text-zinc-500">
                    {percent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. THANH CÔNG CỤ: Filter / Sắp xếp & Nút Viết Review */}
      <div className="p-4 sm:px-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between items-center sm:sticky sm:top-[60px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-10">
        
        {/* Dropdown Sắp xếp (Dùng native select cực mượt trên Mobile) */}
        <div className="relative w-full sm:w-auto">
          <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto appearance-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm font-bold rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
          >
            <option value="newest">Mới nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
            <option value="helpful">Hữu ích nhất</option>
          </select>
          {/* Mũi tên Custom cho Select */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Nút Viết Đánh giá Gọi Modal */}
        <button 
          onClick={onWriteReview}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Edit3 className="w-4 h-4" />
          Viết đánh giá
        </button>
      </div>

      {/* 3. DANH SÁCH RENDER */}
      <div className="px-4 sm:px-8">
        {sortedReviews.length > 0 ? (
          <div className="flex flex-col">
            {sortedReviews.map((review) => (
              <ReviewItem 
                key={review.id} 
                review={review} 
                onImageClick={(imgs, idx) => console.log('Viewing image', idx)} 
              />
            ))}
          </div>
        ) : (
          // Empty State nếu Quán chưa có comment nào
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <MessageSquareOff className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
            </div>
            <h4 className="text-[17px] font-extrabold text-zinc-900 dark:text-white mb-1">Chưa có đánh giá nào</h4>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 leading-relaxed">
              Bạn hãy trở thành người đầu tiên trải nghiệm và để lại nhận xét cho quán cà phê này nhé!
            </p>
            <button 
              onClick={onWriteReview}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Viết đánh giá ngay
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
