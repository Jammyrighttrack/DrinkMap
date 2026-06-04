import React, { useState } from 'react';
import { UserIcon, EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return false;
    }    
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Wrap with Redux thunk -> await dispatch(register(formData)).unwrap()
      // Mock network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate success
      console.log('Register successful', formData);
      if (onSuccess) onSuccess();

    } catch (err) {
      setError('Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full relative">

      {/* Alert Error */}
      {error && (
        <div className="p-3 mb-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-[13px] font-bold text-red-600 dark:text-red-400 animate-in slide-in-from-top-2 fade-in flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* Tên hiển thị */}
      <div className="relative group">
        <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formData.fullName ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400'}`} />
        <input
          required
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          type="text"
          placeholder="Họ và tên"
          disabled={isLoading}
          className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 focus:bg-white dark:focus:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-medium disabled:opacity-60"
        />
      </div>

      {/* Email */}
      <div className="relative group">
        <EnvelopeIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formData.email ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400'}`} />
        <input
          required
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          type="email"
          placeholder="Địa chỉ Email"
          disabled={isLoading}
          className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 focus:bg-white dark:focus:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-medium disabled:opacity-60"
        />
      </div>

      {/* Mật khẩu */}
      <div className="relative group">
        <LockClosedIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formData.password ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400'}`} />
        <input
          required
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          type="password"
          placeholder="Mật khẩu (Tối thiểu 6 ký tự)"
          disabled={isLoading}
          className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 focus:bg-white dark:focus:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-medium disabled:opacity-60"
        />
      </div>

      {/* Xác nhận Mật khẩu */}
      <div className="relative group">
        <ShieldCheckIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formData.confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400'}`} />
        <input
          required
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          type="password"
          placeholder="Xác nhận lại mật khẩu"
          disabled={isLoading}
          className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 focus:bg-white dark:focus:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-medium disabled:opacity-60"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !formData.email || !formData.password || !formData.fullName || !formData.confirmPassword}
        className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-4 mt-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-2xl font-bold shadow-lg shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 group"
      >
        <span className={`flex items-center gap-2 transition-all ${isLoading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          Đăng ký tài khoản
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 group-disabled:translate-x-0 transition-transform" />
        </span>

        {/* Loading Spinner */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all ${isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
        </div>
      </button>

      {/* Điều khoản */}
      <p className="text-center text-[12px] text-zinc-500 dark:text-zinc-400 mt-4 leading-relaxed px-4">
        Bằng việc đăng ký, bạn đồng ý với{' '}
        <a href="#" className="font-bold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">Điều khoản dịch vụ</a>{' '}
        và{' '}
        <a href="#" className="font-bold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400">Chính sách bảo mật</a> của DrinkMap.
      </p>
    </form>
  );
}
