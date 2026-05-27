import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Auth Feature
import { fetchCurrentUser } from './features/auth/authSlice';
import { RequireAuth } from './features/auth/components/RequireAuth';

// Pages
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ShopDetails from './pages/ShopDetails';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// ★ AI Chat Overlay — mount ngoài <Routes> để hiển thị trên MỌI trang
import ChatOverlay from './features/ai_chat/components/ChatOverlay';

// Global styles
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { isInitializing } = useSelector((state) => state.auth || {});

  // Khôi phục phiên đăng nhập khi app khởi động
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  // Loading screen (chặn FOUC trong lúc xác thực token)
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-50 z-[9999]">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-teal-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-2xl">☕</span>
        </div>
        <h2 className="text-zinc-500 font-bold text-sm tracking-widest uppercase animate-pulse">
          Đang tải DrinkMap
        </h2>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 0. Landing (public) */}
        <Route path="/welcome" element={<LandingPage />} />

        {/* 1. Home – Map (protected) */}
        <Route
          path="/"
          element={
            <RequireAuth mode="route" fallbackPath="/welcome">
              <HomePage />
            </RequireAuth>
          }
        />

        {/* 2. Shop Detail */}
        <Route path="/shop/:id" element={<ShopDetails />} />

        {/* 3. Profile (protected) */}
        <Route
          path="/profile"
          element={
            <RequireAuth mode="route" fallbackPath="/welcome">
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* 4. 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/*
        ★ ChatOverlay được render NGOÀI <Routes> để nó luôn exist trong DOM
          dù đang ở trang nào. Framer Motion AnimatePresence sẽ quản lý
          việc show/hide dựa trên isChatOpen từ Zustand store.
      */}
      <ChatOverlay />
    </Router>
  );
}

export default App;
