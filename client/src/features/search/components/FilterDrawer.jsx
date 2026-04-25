import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilters, selectShopsFilters } from '../../shops/shopsSlice';

/**
 * FilterDrawer Component (Ngăn xếp Bộ Lọc Nâng Cao)
 * Trượt lên từ dưới cùng màn hình (Bottom Sheet dạng iOS/Google Maps)
 * @param {boolean} isOpen - Trạng thái hiển thị ngăn kéo
 * @param {Function} onClose - Hàm gọi khi người dùng muốn đóng
 */
const FilterDrawer = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const globalFilters = useSelector(selectShopsFilters);
    
  // Tách riêng state dạng Local để tránh việc người dùng vừa kéo Slider (chưa ấn Áp dụng)
  // mà bản đồ đã giật lag chạy API liên tục.
  const [localFilters, setLocalFilters] = useState({
    max_distance: 5000, // Mặc định 5km
    minRating: 0,       // Đánh giá tối thiểu từ 0 -> 5 sao
    priceRange: 'all'   // Mức giá (Optional)
  });

  // Đồng bộ lại dữ liệu đang có trên cục tổng (Redux) mỗi khi mở lại Drawer
  useEffect(() => {
    if (isOpen) {
      setLocalFilters({
        max_distance: globalFilters.max_distance || 5000,
        minRating: globalFilters.minRating || 0,
        priceRange: globalFilters.priceRange || 'all',
      });
      // Khóa thanh cuộn Body để ngăn màn hình nền sau trượt theo
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, globalFilters]);

  // Function xử lý thay đổi thông số an toàn  
  const handleChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  // Cập nhật State lên App (MapCore sẽ nghe thấy và fetch lại API Backend)
  const handleApply = () => {  
    dispatch(updateFilters(localFilters));
    onClose();
  };

  const handleReset = () => {
    // Reset cục bộ & Reset tổng
    const defaultFilters = { max_distance: 5000, minRating: 0, priceRange: 'all' };
    setLocalFilters(defaultFilters);
    dispatch(updateFilters(defaultFilters));
    onClose();
  };

  // Bấm vào mảng đen ngoài Drawer thì tự đóng
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Nếu UI không mở, ta rút gọn Dom cho nhẹ
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex flex-col justify-end lg:justify-center lg:items-center">
      
      {/* 
        1. Lớp Màng Đen / Kính Xám (Overlay Backdrop)
        Có hiệu ứng mờ dần (fade-in) để êm mắt
      */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
        onClick={handleOverlayClick}
      />

      {/* 
        2. Bảng Ngăn Kéo (Drawer Content) 
        Trượt mượt từ dưới lên (Slide Up) cho mobile. 
        Màn lớn máy tính thì là 1 khối Box bo góc nằm giữa (Modal).
      */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl lg:rounded-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.12)] transform transition-transform duration-300 animate-in slide-in-from-bottom-full lg:slide-in-from-bottom-8">
        
        {/* Thanh gạt nhỏ biểu tượng trên nắp Drawer (Thường hấy ở iOS) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Bộ lọc tinh chỉnh</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* --- KHU VỰC THÂN LỌC --- */}
        <div className="px-6 py-6 space-y-8 max-h-[65vh] overflow-y-auto">
          
          {/* Lọc: Bán kính khoảng cách */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-[15px] font-semibold text-gray-800">Bán kính tìm kiếm</label>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {localFilters.max_distance >= 1000 
                  ? `${localFilters.max_distance / 1000} km` 
                  : `${localFilters.max_distance} m`}
              </span>
            </div>
            {/* Thanh kéo ngang (Range Input / Slider custom CSS) */}
            <input 
              type="range" 
              min="500" max="15000" step="500"
              value={localFilters.max_distance}
              onChange={(e) => handleChange('max_distance', parseInt(e.target.value))}
              className="w-full h-2.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 font-medium">
              <span>Gần (500m)</span>
              <span>Xa (15km)</span>
            </div>
          </div>

          {/* Lọc: Đánh Giá Tối Thiểu */}
          <div className="space-y-4">
            <label className="text-[15px] font-semibold text-gray-800">Đánh giá tối thiểu (Sao)</label>
            <div className="grid grid-cols-4 gap-3">
              {[0, 3, 4, 4.5].map((stars) => {
                const isActive = localFilters.minRating === stars;
                return (
                  <button
                    key={stars}
                    onClick={() => handleChange('minRating', stars)}
                    className={`
                      py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 flex justify-center items-center gap-1
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-sm ring-1 ring-blue-500/50' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }
                    `}
                  >
                    {stars === 0 ? 'Bất kỳ' : `${stars}+`}
                    {stars > 0 && <span className="text-yellow-400 text-base -mt-0.5">★</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lọc: Mức Giá Tiền (Segmented Control) */}
          <div className="space-y-4">
            <label className="text-[15px] font-semibold text-gray-800">Khoảng Giá / Mức Chi Tiêu</label>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'cheap', label: '$ Bình dân' },
                { id: 'mid', label: '$$ Vừa phải' },
                { id: 'high', label: '$$$ Hạng sang' }
              ].map((price) => (
                <button
                  key={price.id}
                  onClick={() => handleChange('priceRange', price.id)}
                  className={`
                    flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-300
                    ${localFilters.priceRange === price.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {price.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* --- KHU VỰC NÚT BẤM (FOOTER) --- */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 lg:bg-white rounded-b-3xl flex gap-4 mt-auto">
          <button 
            onClick={handleReset}
            className="flex-1 py-3.5 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 hover:text-red-600 transition-colors shadow-sm"
          >
            Thiết lập lại
          </button>
          
          <button 
            onClick={handleApply}
            className="flex-[2] py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-[0_4px_12px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.4)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Hiển Thị Quán Nước
          </button>
        </div>

      </div>
    </div>
  );
};

export default FilterDrawer;
