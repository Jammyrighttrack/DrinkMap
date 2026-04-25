import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { loginApi, mockGoogleLogin } from '../authSlice';

export default function AuthModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setMode('login'), 300);
      setFormData({ fullName: '', email: '', password: '' });
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGoogleLogin = () => {
    console.log('Logging in with simulated Google flow...');
    dispatch(mockGoogleLogin());
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`Submitting ${mode}:`, formData);

    if (mode === 'login') {
      try {
        // Mô phỏng việc gọi API thành công bằng mockGoogleLogin để đi thẳng vào HomePage
        dispatch(mockGoogleLogin());
        onClose(); // Close modal on success
      } catch (err) {
        console.error('Login failed:', err);
      }
    } else {
      // TODO: Dispatch registerApi
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">

          {/* Backdrop (Kính mờ xịn) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div   
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-[420px] bg-white dark:bg-zinc-950 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-black/70 overflow-hidden border border-white dark:border-zinc-800"
          >
            {/* Nút Đóng (Treo góc trên) */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header / Branding */}
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-600/20 transform -rotate-6">
                <span className="text-2xl font-black text-white transform rotate-6 font-serif">DM</span>
              </div>
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white mb-2">
                {mode === 'login' ? 'Mừng bạn trở lại' : 'Bắt đầu hành trình'}
              </h2>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {mode === 'login'
                  ? 'Khám phá quán quen, lưu giữ hương vị mới.'
                  : 'Gia nhập cộng đồng DrinkMap Việt Nam ngay hôm nay.'}
              </p>
            </div>

            {/* Form & Actions */}
            <div className="px-8 pb-10">

              {/* Nút Đăng nhập bằng Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-700 dark:text-zinc-200 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-[0.98]"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                  <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.72 18.23 13.47 18.63 12 18.63C9.15 18.63 6.74 16.71 5.86 14.14H2.18V16.99C4.01 20.62 7.69 23 12 23Z" fill="#34A853" />
                  <path d="M5.86 14.14C5.63 13.48 5.5 12.76 5.5 12C5.5 11.24 5.63 10.52 5.86 9.86V7.01H2.18C1.43 8.5 1 10.2 1 12C1 13.8 1.43 15.5 2.18 16.99L5.86 14.14Z" fill="#FBBC05" />
                  <path d="M12 5.38C13.62 5.38 15.06 5.93 16.21 7.02L19.35 3.88C17.46 2.13 14.97 1 12 1C7.69 1 4.01 3.38 2.18 7.01L5.86 9.86C6.74 7.29 9.15 5.38 12 5.38Z" fill="#EA4335" />
                </svg>
                Tiếp tục với Google
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Hoặc</span>
                <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                <AnimatePresence mode="popLayout">
                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="relative"
                    >
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        required
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Họ và tên"
                        className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-medium"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email"
                    placeholder="Email"
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-medium"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-medium"
                  />
                </div>

                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button type="button" className="text-[13px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center gap-2 py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold shadow-lg shadow-black/10 transition-all active:scale-[0.98] group"
                >
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              {/* Toggle Mode */}
              <div className="mt-8 text-center text-[14px]">
                <span className="text-zinc-500 font-medium">
                  {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                </span>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="font-bold text-zinc-900 dark:text-white hover:underline transition-all"
                >
                  {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
