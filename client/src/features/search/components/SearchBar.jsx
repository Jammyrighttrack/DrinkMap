import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilters, selectShopsFilters } from '../../shops/shopsSlice';
import { Sparkles, X, Search } from 'lucide-react';
import useChatStore from '../../ai_chat/store/useChatStore';
import { useState, useEffect } from 'react';

const SearchBar = ({
  className = '',
  placeholder = 'Tìm tên quán, cà phê...',
}) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectShopsFilters);
  const [keyword, setKeyword] = useState(filters.q || '');
  const toggleChat = useChatStore(s => s.toggleChat);

  useEffect(() => {
    setKeyword(filters.q || '');
  }, [filters.q]);

  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleClear = () => {
    setKeyword('');
    dispatch(updateFilters({ q: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword !== filters.q) {
      dispatch(updateFilters({ q: keyword }));
    }
  };

  const handleAiClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SearchBar] AI button clicked, calling toggleChat()');
    toggleChat();
  };

  return (
    <div className={`flex items-center gap-2 w-full max-w-[500px] ${className}`}>
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative flex-1">
        <div className="group relative flex w-full items-center rounded-2xl border border-gray-100/80 bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:border-teal-400 focus-within:ring-[3px] focus-within:ring-teal-400/20">
          <button
            type="submit"
            className="absolute left-1.5 p-2.5 text-gray-400 transition-colors duration-200 group-hover:text-teal-600"
            aria-label="Tìm kiếm"
          >
            <Search className="h-5 w-5" />
          </button>

          <input
            type="text"
            value={keyword}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full rounded-2xl bg-transparent py-3.5 pl-[3.25rem] pr-10 text-[15px] font-medium text-gray-800 outline-none placeholder:text-gray-400/80"
          />

          {keyword && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 rounded-full p-1.5 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Xóa từ khóa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* AI Button — tách biệt hoàn toàn khỏi form */}
      <button
        type="button"
        onClick={handleAiClick}
        title="Mở trợ lý DrinkMap AI"
        className="shrink-0 h-[52px] w-[52px] rounded-2xl bg-gradient-to-br from-[#10705a] to-[#1a9a7c] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(16,112,90,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_28px_rgba(16,112,90,0.5)] active:scale-95"
      >
        <Sparkles className="h-5 w-5" />
      </button>
    </div>
  );
};

export default SearchBar;
