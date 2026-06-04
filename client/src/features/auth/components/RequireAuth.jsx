import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import AuthModal from './AuthModal';

/**
 * RequireAuth (HOC / Wrapper) - Tấm khiên bảo vệ các chức năng cần Đăng nhập.
 * 
 * @param {ReactNode} children - Component con được bảo vệ
 * @param {string} mode - 'route' (đá văng ra trang khác) | 'interaction' (bật Modal ngay tại chỗ)
 * @param {string} fallbackPath - Đường dẫn fallback nếu mode='route' (Mặc định: '/')
 * @param {boolean} visuallyLocked - Có làm mờ component con khi chưa login không (Dùng cho mode='interaction')
 */
export function RequireAuth({ 
  children, 
  mode = 'route', 
  fallbackPath = '/',
  visuallyLocked = false,
}) {
  // Lấy state từ userSlice (Giả định path file slice nằm ở ../../user/userSlice hoặc tương tự)
  // Lưu ý: Nếu userSlice chưa setup isInitializing, có thể gỡ thẻ if(isInitializing)
  const { isAuthenticated, isInitializing } = useSelector((state) => state.auth);
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);

  // 1. Nếu hệ thống đang fetch API kiểm tra token lúc vừa F5
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[50px]">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // MODE: ROUTE (Đá văng ra nếu cố truy cập URL, vd: /profile)
  // ==========================================
  if (mode === 'route') {
    if (!isAuthenticated) {
      // Chuyển hướng về fallback nhưng lưu trữ lại location hiện tại để 
      // sau khi Login xong có thể redirect ngược lại đích đến.
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }


  // ==========================================
  // MODE: INTERACTION (Bật Modal khi bấm vào Nút/Thẻ bài)
  // ==========================================
  if (mode === 'interaction') {
    if (isAuthenticated) {
      return <>{children}</>;
    }

    // Nếu chưa đăng nhập: Trải một tấm khiên chặn click
    return (
      <>
        <div 
          // Chặn sự kiện click truyền xuống children (Capture Phase)
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowModal(true);
          }}
          className={`relative inline-block w-full sm:w-auto group ${visuallyLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {/* Tấm khiên tàng hình bắt mọi lượt click */}
          <div className="absolute inset-0 z-20 pointer-events-auto" title="Yêu cầu đăng nhập để sử dụng tính năng này" />
          
          {/* Làm mờ / Đóng dấu Lock lên component con nếu cần */}
          <div className={`relative transition-all duration-300 ${visuallyLocked ? 'opacity-50 grayscale pointer-events-none' : 'pointer-events-none'}`}>
            {children}
            
            {visuallyLocked && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-900/80 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <LockClosedIcon className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Modal Đăng nhập dành riêng cho Tấm khiên này */}
        <AuthModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      </>
    );
  }

  return <>{children}</>;
}
