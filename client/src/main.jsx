import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

// Redux Store (Trọng tâm quản lý State toàn cục)
import { store } from './store/index.js';

// Styles & Component Rễ
import './index.css';
import App from './App.jsx';

/**
 * DrinkMap App Entry Point
 * ---
 * 1. StrictMode: Bắt lỗi React lifecycle, detect các hàm unmount chưa được dọn dẹp (tự chạy 2 lần ở màn Dev).
 * 2. Provider: Bọc toàn bộ App để bơm dòng máu dữ liệu từ (store) chảy xuống tất cả Component con.
 */
const mountPoint = document.getElementById('root');

if (!mountPoint) {
  throw new Error('Critical: Không tìm thấy thẻ <div id="root"> trong file index.html');
}

createRoot(mountPoint).render(
  <StrictMode>
    {/* Truyền Store tổng vào hệ sinh thái React */}
    <Provider store={store}>
      {/* 
        (Tùy chọn mở rộng sau này)
        Bạn có thể đặt thư viện Toast Notifications (như Sonner / React-Toastify) hoặc 
        ErrorBoundary (Tấm khiên chống sập trắng trang màn hình) ở mép ngoài cùng này.
      */}
      <App />
    </Provider>
  </StrictMode>
);