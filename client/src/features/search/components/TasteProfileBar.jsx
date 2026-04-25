import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilters, selectShopsFilters } from '../../shops/shopsSlice';

const BEVERAGE_TYPES = [
  { id: '', label: 'For you', icon: '✨' },
  { id: 'coffee', label: 'Coffee', icon: '☕' },
  { id: 'milktea', label: 'Milktea', icon: '🧋' },
  { id: 'tea', label: 'Fruit tea', icon: '🍹' },
  { id: 'matcha', label: 'Matcha', icon: '🍵' },
  { id: 'sweet', label: 'Sweet & Cake', icon: '🍰' },
  { id: 'work', label: 'Work', icon: '💻' },
  { id: 'chill', label: 'Chill', icon: '🌅' },
  { id: 'date', label: 'Date', icon: '💕' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'All' },
  { id: 'cheap', label: '$' },
  { id: 'mid', label: '$$' },
  { id: 'high', label: '$$$' }
];

const RATINGS = [
  { id: 4.5, label: '4.5+' },
  { id: 4.0, label: '4.0+' },
];

const TasteProfileBar = ({ className = '' }) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectShopsFilters);

  // Helper to dispatch filter changes
  const setFilter = (key, value) => {
    dispatch(updateFilters({ [key]: value }));
  };

  return (
    <div className={`w-full p-4 bg-orange-50 space-y-6 rounded-b-2xl ${className}`}>
      {/* Beverage Types */}
      <div>
        <div className="flex items-center gap-2 mb-4 text-orange-900">
          <h3 className="font-bold text-[15px]">Beverage Types</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          {BEVERAGE_TYPES.map(type => {
            const isActive = (filters.category || '') === type.id;
            return (
              <button
                key={type.id || 'ai-match'}
                onClick={() => setFilter('category', type.id)}
                className={`flex justify-center items-center gap-1.5 px-2 py-2 rounded-xl min-h-[44px] text-xs font-semibold transition-colors border filter drop-shadow-sm w-full ${isActive
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-orange-600 border-orange-200 hover:bg-orange-100'
                  }`}
              >
                <span className="text-[14px] leading-none shrink-0">{type.icon}</span>
                <span className="leading-snug break-words text-left">{type.label}</span>
              </button>
            );
          })}
        </div>  
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-orange-900">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
          </svg>
          <h3 className="font-bold text-[15px]">Price</h3>
        </div>
        <div className="flex bg-orange-200/50 p-1.5 rounded-full w-full">
          {PRICE_RANGES.map((price) => (
            <button
              key={price.id}
              onClick={() => setFilter('priceRange', price.id)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${(filters.priceRange || 'all') === price.id
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-orange-900 hover:text-orange-600'
                }`}
            >  
              {price.label}
            </button>
          ))}
        </div>
      </div>

      {/* Distance Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2 text-orange-900">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>  
            <h3 className="font-bold text-[15px]">Distance</h3>
          </div>
          <div className="flex flex-col items-center justify-center w-[52px] h-[52px] rounded-full bg-orange-100 text-orange-600 shadow-sm shrink-0 border border-orange-200">
            <span className="text-[17px] font-black leading-none">
              {filters.max_distance >= 1000
                ? `${filters.max_distance / 1000}`
                : `${filters.max_distance || 5000}`}
            </span>
            <span className="text-[11px] font-bold leading-none mt-1">
              {filters.max_distance >= 1000 ? 'km' : 'm'}
            </span>
          </div>
        </div>
        <input
          type="range"
          min="500" max="15000" step="500"
          value={filters.max_distance || 5000}
          onChange={(e) => setFilter('max_distance', parseInt(e.target.value))}
          className="w-full h-2.5 bg-orange-200 rounded-full appearance-none cursor-pointer accent-orange-600"
        />
        <div className="flex justify-between text-xs text-orange-900/70 font-medium px-1">
          <span>Gần (500m)</span>
          <span>Xa (15km)</span>
        </div>
      </div>

      {/* Star Ratings */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-orange-900">
          <h3 className="font-bold text-[15px]">Star Ratings</h3>
        </div>
        <div className="space-y-2">
          {RATINGS.map(rating => {
            const isSelected = filters.minRating === rating.id;
            return (
              <button
                key={rating.id}
                onClick={() => setFilter('minRating', rating.id)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl transition-shadow ${isSelected ? 'ring-2 ring-orange-600 shadow-md' : 'border border-orange-100 hover:shadow-sm'
                  }`}
              >
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${star <= rating.id ? 'text-amber-500' : 'text-gray-300'} ${star === 5 && rating.id === 4.5 ? 'text-amber-500 opacity-50' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="font-bold text-[14px] text-orange-900">{rating.label}</span>
              </button>
            )   
          })}
        </div>
      </div>
    </div>
  );
};

export default TasteProfileBar;
