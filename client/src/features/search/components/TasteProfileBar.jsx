import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateFilters, selectShopsFilters } from '../../shops/shopsSlice';

const BEVERAGE_TYPES = [
  { id: 'date', label: 'Date lãng mạn', icon: '💕' },
  { id: 'work', label: 'Working space', icon: '💻' },
  { id: 'delicious', label: 'Đồ uống ngon', icon: '🍹' },
  { id: 'chill', label: 'View đẹp & chill', icon: '🌅' },
  { id: 'classic', label: 'Cổ điển', icon: '🏮' },
  { id: 'modern', label: 'Hiện đại', icon: '⚡' },
];

const PRICE_RANGES = [
  { id: null, label: 'Tất cả', desc: 'Mọi phân khúc' },
  { id: 1, label: '$ Thấp', desc: 'Tiết kiệm' },
  { id: 2, label: '$$ Vừa', desc: 'Hợp lý' },
  { id: 3, label: '$$$ Cao', desc: 'Sang chảnh' }
];

const TasteProfileBar = ({ className = '' }) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectShopsFilters);

  // Helper to dispatch filter changes
  const setFilter = (key, value) => {
    dispatch(updateFilters({ [key]: value }));
  };

  return (
    <div className={`w-full p-5 space-y-6 ${className}`}>
      {/* Beverage Types */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-zinc-800">
          <h3 className="font-extrabold text-[14px] uppercase tracking-wider text-zinc-700">Sở thích & Không gian</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 w-full">
          {BEVERAGE_TYPES.map(type => {
            const isActive = filters.beverage_types === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setFilter('beverage_types', isActive ? '' : type.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl min-h-[44px] text-[13px] font-bold transition-all border w-full text-left cursor-pointer ${isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10 scale-[1.01]'
                  : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
              >
                <span className="text-lg leading-none shrink-0 filter drop-shadow">{type.icon}</span>
                <span className="leading-snug font-bold">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-zinc-100" />

      {/* Price Range */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-zinc-800">
          <h3 className="font-extrabold text-[14px] uppercase tracking-wider text-zinc-700">Mức chi tiêu</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          {PRICE_RANGES.map((price) => {
            const isActive = filters.price_range === price.id;
            return (
              <button
                key={price.id === null ? 'all' : price.id}
                onClick={() => setFilter('price_range', price.id)}
                className={`flex flex-col items-start px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10 scale-[1.01]'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
                  }`}
              >
                <span className="text-[13px] font-black">{price.label}</span>
                <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-white/80' : 'text-zinc-400'}`}>{price.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <hr className="border-zinc-100" />

      {/* Distance Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-extrabold text-[14px] uppercase tracking-wider text-zinc-700">Bán kính tìm kiếm</h3>
          <span className="text-xs font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded border border-emerald-200">
            {filters.radius_km || 5.0} km
          </span>
        </div>
        <input
          type="range"
          min="1.0"
          max="20.0"
          step="1.0"
          value={filters.radius_km || 5.0}
          onChange={(e) => setFilter('radius_km', parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">
          <span>Gần (1 km)</span>
          <span>Xa (20 km)</span>
        </div>
      </div>
    </div>
  );
};

export default TasteProfileBar;

