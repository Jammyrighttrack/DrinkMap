import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilters, selectShopsFilters } from '../../shops/shopsSlice';

const SearchBar = ({
  className = '',
  placeholder = 'Tim ten quan xin, ca phe tron nang...',
}) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectShopsFilters);
  const [keyword, setKeyword] = useState(filters.q || '');
   
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

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative z-[1000] w-full max-w-[420px] ${className}`}
    >
      <div className="group relative flex w-full items-center rounded-2xl border border-gray-100/80 bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:border-blue-500 focus-within:ring-[3px] focus-within:ring-blue-500/30">
        <button
          type="submit"
          className="absolute left-1.5 p-2.5 text-gray-400 transition-colors duration-200 group-hover:text-blue-500"
          aria-label="Tim kiem"
        >      
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        <input
          type="text"
          value={keyword}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full rounded-2xl bg-transparent py-3.5 pl-[3.25rem] pr-12 text-[15px] font-medium text-gray-800 outline-none placeholder:text-gray-400/80"
        />

        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 rounded-full p-1.5 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Xoa tu khoa"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar;
