import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { MapPin, Search, Coffee, Heart, ArrowRight } from 'lucide-react';
import AuthModal from '../features/auth/components/AuthModal';

const LandingPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If already authenticated, redirect to the app (HomePage)
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden flex flex-col items-center justify-center font-sans text-zinc-900 dark:text-zinc-50">

      {/* Decorative Blob Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-300/30 dark:bg-orange-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/30 dark:bg-blue-600/20 rounded-full blur-3xl" />

      <main className="relative z-10 w-full max-w-6xl px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Content Area */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-start gap-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900 shadow-sm">
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Hành trình khám phá</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight">
            Khám phá thế giới <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              Đồ uống quanh bạn
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed max-w-lg">
            Chúng tôi mang đến giải pháp tìm kiếm đồ uống quanh bạn 1 cách nhanh chóng và tiện lợi theo nhu cầu và sở thích của chính bạn. Hãy cùng khám phá ngay!
          </p>

          <div className="flex flex-col w-full sm:flex-row gap-4 mt-4">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold transition-all shadow-xl shadow-zinc-900/20 dark:shadow-white/10 active:scale-95 group"
            >
              Bắt đầu ngay
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-center px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
            >
              Đăng nhập
            </button>
          </div>
        </motion.div>

        {/* Right Hero Image / Map illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full aspect-square max-w-[500px] mx-auto rounded-[2.5rem] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-white dark:border-zinc-700 shadow-2xl overflow-hidden flex items-center justify-center p-8"
        >
          {/* Decorative Map Grid overlay */}
          <div className="absolute inset-0 opacity-20 dark:opacity-10 backdrop-blur-[2px]"
            style={{ backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>

          <div className="relative w-full h-full flex flex-col gap-6 max-w-sm">
            {/* Feature Cards as a dynamic UI mockup */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/20 dark:border-zinc-800 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Tìm kiếm theo vị trí</p>
                <p className="text-xs text-zinc-500 font-medium">Khám phá các quán quanh bạn</p>
              </div>
            </motion.div>
    
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
              className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/20 dark:border-zinc-800 flex items-center gap-4 ml-8"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <Coffee className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Profile đồ uống</p>
                <p className="text-xs text-zinc-500 font-medium">Coffee, Matcha, Trà sữa...</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 2 }}
              className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/20 dark:border-zinc-800 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="font-bold text-zinc-900 dark:text-white">Lưu quán yêu thích</p>
                <p className="text-xs text-zinc-500 font-medium">Tạo bộ sưu tập riêng</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default LandingPage;
