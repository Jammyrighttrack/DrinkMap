import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, BuildingStorefrontIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export function ShopMenuList({ items = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  // Derive unique categories from the items array dynamically
  const categories = useMemo(() => {
    if (!items) return ['Tất cả'];
    const cats = new Set(items.map(item => item.category).filter(Boolean));
    return ['Tất cả', ...Array.from(cats)];
  }, [items]);

  // Filter items based on search query and currently active category
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = activeCategory === 'Tất cả' || item.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-zinc-950 font-sans">

      {/* Sticky Header: Search Bar & Categories */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/80 pt-4 pb-3 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]">

        {/* Search Input */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm kiếm trong thực đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 border-transparent rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {/* Categories Scrollable Row */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1.5 -mx-4 px-4 mask-edges">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-300
                ${activeCategory === cat
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md scale-100'
                  : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 scale-95 hover:scale-100'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredItems.length > 0 ? (
            <div className="space-y-3.5">
              {filteredItems.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, type: 'spring', bounce: 0.2 }}
                  key={item.id}
                  className="group flex gap-4 p-4 rounded-[20px] border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-emerald-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:border-emerald-900/30 transition-all duration-300 cursor-pointer"
                >
                  {/* Item Text Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[15px] sm:text-base text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h4>
                      {item.recommended && (
                        <span className="shrink-0 flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/40 px-1.5 py-0.5 rounded-md">
                          <CheckCircleIcon className="w-3 h-3" />
                          Nên thử
                        </span>
                      )}
                    </div>
                    {item.desc && (
                      <p className="text-[13px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-2.5">
                        {item.desc}
                      </p>
                    )}
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-auto">
                      {item.price}
                    </div>
                  </div>

                  {/* Item Visual / Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-100 dark:border-zinc-800">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-600 transition-transform duration-500 group-hover:scale-110">
                        <BuildingStorefrontIcon className="w-6 h-6 mb-1 opacity-70" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center h-full"
            >
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-5 shadow-inner">
                <MagnifyingGlassIcon className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">Không tìm thấy món</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                Không tìm thấy món nào khớp với từ khóa "<span className="font-semibold text-zinc-700 dark:text-zinc-300">{searchQuery}</span>" trong danh mục {activeCategory}.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('Tất cả'); }}
                className="mt-6 px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-sm font-bold shadow-lg shadow-black/10 hover:shadow-black/20 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Xóa bộ lọc
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
