import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Lấy Thunk phục hồi phiên đăng nhập từ Auth Feature
import { fetchCurrentUser } from './features/auth/authSlice';

// HOC Bảo vệ Route bằng Cửa chặn Đăng nhập
import { RequireAuth } from './features/auth/components/RequireAuth';

// FSD Pages (Các màn hình được bóc tách độc lập)
import LandingPage from './pages/LandingPage';
import FilterSelectionPage from './pages/FilterSelectionPage';
import HomePage from './pages/HomePage';
import ShopDetails from './pages/ShopDetails';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Styles CSS Khởi tạo Toàn cục (Tailwind Base + Utilities)
import './App.css';

function App() {
  const dispatch = useDispatch();

  // Lấy trạng thái từ Redux để biết App đang trong quá trình load data xác thực hay không
  // Dùng fallback rỗng {} phòng khi setup Store ban đầu bị lỗi chập chờn
  const { isInitializing } = useSelector((state) => state.auth || {});

  // KÍCH HOẠT NHỊP ĐẬP: Thống nhất mọi user session
  // Khôi phục phiên đăng nhập (đọc Token từ ổ cứng) ngay khi App tĩnh giấc
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Loading Screen Toàn trang (Chặn Flash Content / FOUC)
  // Nếu App đang gửi token xuống Backend để xin cục Profile, màn hình sẽ mờ nhẹ chờ 1 tí
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-[9999] transition-opacity duration-300">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          {/* Logo or loading animation */}
          <div className="absolute inset-0 border-4 border-emerald-100 dark:border-emerald-900/40 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-zinc-600 dark:text-zinc-400 font-bold text-sm tracking-widest uppercase animate-pulse">
          Đang tải DrinkMap
        </h2>
      </div>
    );
  }

  return (
    // Bọc toàn bộ App bằng Router (react-router-dom)
    <Router>
      <Routes>

        {/* 0. Landing Page (Công khai) */}
        <Route path="/" element={<LandingPage />} />

        {/* 1. Màn hình Lọc lựa chọn ban đầu (Đã bảo vệ) */}
        <Route
          path="/filters"
          element={
            <RequireAuth mode="route" fallbackPath="/">
              <FilterSelectionPage />
            </RequireAuth>
          }
        />

        {/* 2. Màn hình Core Bản đồ (Đã bảo vệ) */}
        <Route
          path="/map"
          element={
            <RequireAuth mode="route" fallbackPath="/">
              <HomePage />
            </RequireAuth>
          }
        />

        {/* 2. Màn hình Chi tiết một Quán cà phê (Truyền tham số params :id) */}
        <Route path="/shop/:id" element={<ShopDetails />} />

        {/* 3. Màn hình Cá nhân (Route được Bảo vệ) 
             Sử dụng HOC RequireAuth ở mode='route'. Nếu User cố gõ link /profile 
             mà chưa đăng nhập, HOC này sẽ dùng <Navigate> đá văng về '/' ngay lập tức.
        */}
        <Route
          path="/profile"
          element={
            <RequireAuth mode="route" fallbackPath="/">
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* 4. Màn hình Lỗi Lạc Đường (Dành cho tất cả các đường dẫn ma /abcd) */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Router>
  );
}

export default App;
