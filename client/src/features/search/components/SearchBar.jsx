import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilters, selectShopsFilters } from '../../shops/shopsSlice';
import { SparklesIcon, XMarkIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import useChatStore from '../../ai_chat/store/useChatStore';
import { shopsApi } from '../../shops/shopsApi';

const SearchBar = ({
  className = '',
  placeholder = 'Tìm tên quán, cà phê...',
}) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectShopsFilters);
  const [keyword, setKeyword] = useState(filters.q || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const dropdownRef = useRef(null);
  const toggleChat = useChatStore(s => s.toggleChat);

  useEffect(() => {
    setKeyword(filters.q || '');
  }, [filters.q]);

  useEffect(() => {
    // Close dropdown if clicked outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    // Only fetch suggestions if we are typing something new, not when we selected a shop
    if (keyword === filters.q) return;

    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await shopsApi.searchShops({ q: keyword.trim(), limit: 5 });
        setSuggestions(results || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error("Failed to fetch search suggestions", err);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [keyword, filters.q]);

  const handleInputChange = (e) => {
    setKeyword(e.target.value);
  };

  const handleClear = () => {
    setKeyword('');
    setSuggestions([]);
    setIsDropdownOpen(false);
    dispatch(updateFilters({ q: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword !== filters.q) {
      dispatch(updateFilters({ q: keyword }));
      setIsDropdownOpen(false);
    }
  };

  const handleSelectSuggestion = (shopName) => {
    setKeyword(shopName);
    dispatch(updateFilters({ q: shopName }));
    setIsDropdownOpen(false);
  };

  const handleAiClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SearchBar] AI button clicked, calling toggleChat()');
    toggleChat();
  };

  return (
    <div className={`flex items-center gap-2 w-full max-w-[500px] ${className}`} ref={dropdownRef}>
      {/* Search Form */}
      <div className="relative flex-1">
        <form onSubmit={handleSubmit} className="relative w-full">
          <div className="group relative flex w-full items-center rounded-2xl border border-gray-100/80 bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:border-teal-400 focus-within:ring-[3px] focus-within:ring-teal-400/20">
            <button
              type="submit"
              className="absolute left-1.5 p-2.5 text-gray-400 transition-colors duration-200 group-hover:text-teal-600"
              aria-label="Tìm kiếm"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            <input
              type="text"
              value={keyword}
              onChange={handleInputChange}
              onFocus={() => { if (suggestions.length > 0) setIsDropdownOpen(true); }}
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
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {isDropdownOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
            <ul className="py-2">
              {suggestions.map((shop) => (
                <li
                  key={shop.id || shop._id}
                  onClick={() => handleSelectSuggestion(shop.name)}
                  className="px-4 py-2.5 hover:bg-teal-50 cursor-pointer flex flex-col transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <span className="font-bold text-gray-800 text-[14px]">{shop.name}</span>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 truncate">
                    <MapPinIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI Button — tách biệt hoàn toàn khỏi form */}
      <button
        type="button"
        onClick={handleAiClick}
        title="Mở trợ lý DrinkMap AI"
        className="shrink-0 h-[52px] w-[52px] rounded-2xl bg-gradient-to-br from-[#10705a] to-[#1a9a7c] text-white flex items-center justify-center shadow-[0_8px_24px_rgba(16,112,90,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_10px_28px_rgba(16,112,90,0.5)] active:scale-95"
      >
        <SparklesIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default SearchBar;
