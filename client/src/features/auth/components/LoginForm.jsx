import React, { useState } from 'react';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export function LoginForm({ onSuccess, onForgotPassword }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error context when user starts typing again
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Wrap with Redux thunk -> await dispatch(login(formData)).unwrap()
      // Mock network delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Simulate success    
      console.log('Login successful', formData);
      if (onSuccess) onSuccess();
      
    } catch (err) {
      setError('Email hoặc mật khẩu không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full relative">
      {/* Thông báo lỗi bằng thiết kế mềm */}
      {error && (
        <div className="p-3 mb-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-[13px] font-bold text-red-600 dark:text-red-400 animate-in slide-in-from-top-2 fade-in">
          {error}
        </div>
      )}

      {/* Input Group: Email */}
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

      {/* Input Group: Password */}
      <div className="relative group">
        <LockClosedIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${formData.password ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400'}`} />
        <input 
          required
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          type="password" 
          placeholder="Mật khẩu" 
          disabled={isLoading}
          className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 focus:bg-white dark:focus:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-medium disabled:opacity-60"
        />
      </div>

      {/* Options Row */}
      <div className="flex justify-between items-center pt-1 pb-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex items-center justify-center">
            <input type="checkbox" className="peer w-4 h-4 rounded appearance-none border-2 border-zinc-300 dark:border-zinc-700 checked:bg-emerald-600 checked:border-emerald-600 transition-all cursor-pointer" />
            <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white transition-opacity">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-[13px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-colors">Ghi nhớ</span>
        </label>
        
        <button 
          onClick={onForgotPassword}
          type="button" 
          className="text-[13px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors focus:outline-none focus:underline"
        >
          Quên mật khẩu?
        </button>
      </div>

      {/* Submit Action */}
      <button 
        type="submit"
        disabled={isLoading || !formData.email || !formData.password}
        className="relative w-full overflow-hidden flex items-center justify-center gap-2 py-4 mt-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-2xl font-bold shadow-lg shadow-black/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 group"
      >
        <span className={`flex items-center gap-2 transition-all ${isLoading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          Đăng nhập
          <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 group-disabled:translate-x-0 transition-transform" />
        </span>
        
        {/* Loading Spinner */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all ${isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
        </div>
      </button>
    </form>
  );
}
