import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Coffee, CheckCircle2 } from 'lucide-react';

const MOCK_MENU = [
  { id: '1', name: 'Classic Espresso', category: 'Coffee', price: '45,000đ', desc: 'Rich espresso shot with a thick, smooth crema. Sourced from local highland farms.', recommended: true },
  { id: '2', name: 'Caramel Macchiato', category: 'Coffee', price: '55,000đ', desc: 'Espresso mixed with vanilla syrup and velvety steamed milk, topped with a caramel drizzle.' },
  { id: '3', name: 'Cold Brew', category: 'Coffee', price: '50,000đ', desc: 'Slow-steeped cold brew for 24 hours, smooth and highly refreshing.' },
  { id: '4', name: 'Matcha Latte', category: 'Tea', price: '60,000đ', desc: 'Premium Japanese matcha imported directly, blended with perfectly steamed milk.', recommended: true },
  { id: '5', name: 'Peach Black Tea', category: 'Tea', price: '45,000đ', desc: 'Iced black tea infused with real peach slices and lemongrass.' },
  { id: '6', name: 'Almond Croissant', category: 'Bakery', price: '35,000đ', desc: 'Buttery, flaky, freshly baked croissant topped with toasted almonds.', image: 'https://images.unsplash.com/photo-1549996647-190b679b33d7?auto=format&fit=crop&q=80&w=200' },
  { id: '7', name: 'Tiramisu Slice', category: 'Bakery', price: '45,000đ', desc: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream.', recommended: true }
];

export function ShopMenuList({ items = MOCK_MENU }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Derive unique categories from the items array dynamically
  const categories = useMemo(() => {
    if (!items) return ['All'];
    const cats = new Set(items.map(item => item.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [items]);

  // Filter items based on search query and currently active category
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [items, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col w-full h-full bg-white dark:bg-zinc-950 font-sans">
      
      {/* Sticky Header: Search Bar & Categories */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/80 pt-4 pb-3 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search menu..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 border-transparent rounded-[14px] text-sm outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
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
                  className="group flex gap-4 p-4 rounded-[20px] border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-blue-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:border-blue-900/30 transition-all duration-300 cursor-pointer"
                >
                  {/* Item Text Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-[15px] sm:text-base text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.name}
                      </h4>
                      {item.recommended && (
                        <span className="shrink-0 flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/40 px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Must Try
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
                        <Coffee className="w-6 h-6 mb-1 opacity-70" />
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
                <Search className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">No items found</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                We couldn't find anything matching "<span className="font-semibold text-zinc-700 dark:text-zinc-300">{searchQuery}</span>" in {activeCategory}.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="mt-6 px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-sm font-bold shadow-lg shadow-black/10 hover:shadow-black/20 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
