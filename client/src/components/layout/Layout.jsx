import React from 'react';
import Header from './Header';

const Layout = ({ children, hideHeader = false }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* 
        Chỉ render Header nếu trang đó không yêu cầu giấu đi 
        (Ví dụ màn hình Đăng nhập riêng biệt có thể hideHeader={true})
      */}
      {!hideHeader && <Header />}
      
      {/* 
        Khu vực chính:
        flex-1 để chiếm toàn bộ phần height còn lại.
        Tùy trang (như trang Bản đồ MapView) có thể set className riêng 
        để không bị scrollbar.
      */}
      <main className="flex-1 relative flex flex-col w-full h-full">
        {children}
      </main>
      
      {/* 
        Tuỳ chọn: Navbar bottom cho Giao diện Mobile 
        Có thể tích hợp ở đây (chỉ visible trên sm, md trở xuống)
      */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe">
        {/* Placeholder cho Bottom Bar (Tab Navigation) của Mobile */}
      </div>

      {/* AI Chat Overlay được mount toàn cục trong App.jsx */}
    </div>
  );
};

export default Layout;
