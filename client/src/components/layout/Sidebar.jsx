import React from 'react';
import TasteProfileBar from '../../features/search/components/TasteProfileBar';

const Sidebar = ({ isOpen, onClose, visibleShopsCount, isLoading }) => {
  return (
    <>
      {/* 
        Overlay đen mờ khi Sidebar mở ra (Áp dụng cho mọi loại màn hình khi Sidebar đóng vai trò như Drawer)
      */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 
        Container Sidebar chính: 
        - Mobile/Tablet: Bị giấu đi (-translate-x-full), chỉ chui ra khi isOpen = true
      */}
      <aside
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-72 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out shadow-xl flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-5 border-b border-zinc-100 shrink-0 bg-white flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black text-zinc-900">Bộ lọc quán nước</h2>
            <p className="text-xs text-zinc-500 mt-1">Tìm kiếm theo 3 tiêu chí của bạn</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TasteProfileBar />
        </div>

        {/* Tích hợp trực tiếp thẻ trạng thái "Đang xem" ở dưới đáy Sidebar */}
        <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Trạng thái tìm kiếm
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">
              {visibleShopsCount}
            </span>
            <span className="text-sm font-semibold text-zinc-600">
              địa điểm gần bạn
            </span>
          </div>
          {isLoading && (
            <p className="mt-2 text-xs text-emerald-600 font-medium animate-pulse">
              Đang tải danh sách quán...
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
