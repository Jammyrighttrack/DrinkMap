import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, MapPinIcon, ArrowLeftIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

// Dành cho việc điều hướng - Có thể thay thế bằng useNavigate nếu dùng react-router-dom
export default function NotFoundPage() {
  const handleGoHome = () => {
    window.location.href = '/'; 
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="relative min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center overflow-hidden font-sans p-6">
      
      {/* 1. Background Ambient Graphics */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-50 dark:opacity-30">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-100/40 via-emerald-200/20 to-transparent blur-3xl"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-20 rounded-full bg-gradient-to-bl from-rose-100/40 via-purple-100/20 to-transparent blur-3xl mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      {/* 2. Main Content Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-lg w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[32px] p-8 sm:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-black/60 border border-white/60 dark:border-zinc-800 text-center"
      >
        {/* Floating Icon Animation */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
          className="mx-auto w-24 h-24 mb-6 relative"
        >
          <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 rounded-[28px] rotate-6" />
          <div className="absolute inset-0 bg-emerald-50 dark:bg-emerald-800/20 rounded-[28px] -rotate-3 backdrop-blur-md border border-white/50 dark:border-emerald-700/30 flex items-center justify-center shadow-lg">
            <MapPinIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400 drop-shadow-sm" />
          </div>
          <motion.div 
            animate={{ y: [-4, 4, -4], rotate: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-full border border-white dark:border-zinc-800 flex items-center justify-center"
          >
            <BuildingStorefrontIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
          </motion.div>
        </motion.div>

        {/* Big 404 Text */}
        <h1 className="text-[120px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-br from-zinc-800 to-zinc-400 dark:from-zinc-100 dark:to-zinc-600 tracking-tighter mb-4 select-none">
          404
        </h1>
        
        <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-3">
          Lạc đường mất rồi!
        </h2>
        
        <p className="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed max-w-[280px] mx-auto">
          Mặc dù tụi mình biết rất nhiều quán ngon, nhưng tiếc là bản đồ không tìm thấy điểm đến này.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoBack}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Trở lại
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-600/20"
          >
            <HomeIcon className="w-5 h-5" />
            Về trang chủ
          </motion.button>
        </div>
      </motion.div>

      {/* 3. Footer branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 font-bold text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-widest"
      >
        DrinkMap Vietnam
      </motion.div>
    </div>
  );
}
