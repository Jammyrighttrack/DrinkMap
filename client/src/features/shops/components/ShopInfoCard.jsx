import React from 'react';
import { Heart, MapPin, Clock } from 'lucide-react';
import { RatingStars } from '../../../components/ui/RatingStars';
import { motion } from 'framer-motion';

// Mock data fallback if no props are passed
const DEFAULT_SHOP = {
  id: '1',
  name: 'The Vintage Coffee Roasters',
  rating: 4.8,  
  reviewCount: 324,
  category: 'Coffee Shop',
  distance: '1.2 km',
  isOpen: true,
  closingTime: '22:00',  
  address: '123 Artisan Street, Coffee District, CA',
  image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop',
  isFavorite: false,
};

export function ShopInfoCard({
  shop = DEFAULT_SHOP,
  onClick,
  onToggleFavorite,
  className = ''
}) {
  const {
    id, name, rating, reviewCount, category,
    distance, isOpen, closingTime, address,
    image, isFavorite   
  } = shop;

  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Mute the click event so it doesn't trigger the card onClick
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onClick && onClick(shop)}
      className={`         
        group relative flex flex-col sm:flex-row bg-white dark:bg-zinc-950 
        rounded-2xl md:rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.06)] 
        hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        border border-zinc-100 dark:border-zinc-800/80
        cursor-pointer overflow-hidden transition-all duration-300 ease-out
        ${className}
      `}
    >
      {/* Visual Section: Image & Overlays */}
      <div className="relative w-full sm:w-36 md:w-44 h-44 sm:h-auto shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <img
          src={image || 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf'}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Dark subtle gradient from top and bottom to make text legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

        {/* Status Badge Over Image */}
        <div className="absolute top-3 left-3 z-10 flex gap-1.5">
          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md text-white rounded-lg border shadow-sm ${isOpen ? 'bg-emerald-500/80 border-emerald-400/30' : 'bg-red-500/80 border-red-400/30'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* Favorite Action Area */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-10 p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md transition-all active:scale-90"
          aria-label="Toggle favorite"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`}
            strokeWidth={isFavorite ? 0 : 2.5}
          />
        </button>
      </div>

      {/* Details Section */}
      <div className="flex flex-col flex-1 p-4 md:p-5">
        <div className="flex justify-between items-start mb-1.5 gap-2">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h3>
          <span className="shrink-0 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full whitespace-nowrap">
            {distance}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{rating}</span>
          <RatingStars rating={rating} size="sm" readOnly />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">({reviewCount})</span>
        </div>

        {/* Categories & Location */}
        <div className="flex flex-col gap-1.5 text-[13px] text-zinc-600 dark:text-zinc-400 mb-3">
          <div className="flex items-center font-medium">
            <span className="text-zinc-800 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-md text-xs">{category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">{address}</span>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            {isOpen ? `Closes ${closingTime}` : 'Opens tomorrow'}
          </div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            View details &rarr;
          </span>
        </div>
      </div>
    </motion.div>
  );
}
