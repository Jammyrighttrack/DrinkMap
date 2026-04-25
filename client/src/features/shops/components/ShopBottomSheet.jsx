import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, MapPin, Clock, Phone, Navigation2, 
  Bookmark, Share2, Star, CheckCircle2,
  ChevronLeft, ChevronRight, Globe, Coffee, Info
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import Button from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';

// Placeholder mock data in case shop is null
const MOCK_SHOP = {
  id: '1',
  name: 'The Vintage Coffee Roasters',
  rating: 4.8,
  reviewCount: 324,
  category: 'Coffee Shop',
  priceRange: '$$',
  isOpen: true,
  closingTime: '22:00',
  address: '123 Artisan Street, Coffee District, CA 90210',
  phone: '+1 (555) 123-4567',
  website: 'vintagecoffeeroasters.com',
  images: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=1000&auto=format&fit=crop'
  ],
  description: 'Specialty coffee roaster featuring single-origin beans, house-made pastries, and a cozy atmosphere perfect for studying or catching up with friends.',
  features: ['Free WiFi', 'Outdoor Seating', 'Pet Friendly', 'Vegan Options'],
  menu: [
    { name: 'Pour Over', price: '$4.50', desc: 'Single origin hand-poured' },
    { name: 'Oat Milk Latte', price: '$5.50', desc: 'House espresso with silky oat milk' },
    { name: 'Cold Brew', price: '$4.00', desc: 'Steeped for 24 hours' },
    { name: 'Avocado Toast', price: '$8.50', desc: 'Sourdough, radish, microgreens' }
  ],
  reviews: [
    { user: 'Alex D.', rating: 5, text: 'Best cold brew in the city!', date: '2 days ago' },
    { user: 'Sam K.', rating: 4, text: 'Great vibe but can get a bit loud.', date: '1 week ago' }
  ]
};

export function ShopBottomSheet({ 
  isOpen, 
  onClose, 
  shop = null,
  // Let parent control if it's a modal (with backdrop) or floating panel
  isModal = false 
}) {
  const navigate = useNavigate();
  const data = shop || MOCK_SHOP;
  const controls = useAnimation();
  const dragControls = useDragControls();
  const [activeTab, setActiveTab] = useState('overview');
  const scrollContainerRef = useRef(null);

  // Drag logic for closing the sheet
  const handleDragEnd = (event, info) => {
    // If dragged down by roughly 100px or fast swipe down
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      controls.start({ y: 0, transition: { type: 'spring', bounce: 0.1, duration: 0.4 } });
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleOpenDetails = () => {
    if (!data?.id) {
      return;
    }

    onClose();
    navigate(`/shop/${data.id}`);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModal && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isModal]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Optional based on isModal prop) */}
          {isModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />
          )}

          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className={`
              fixed bottom-0 left-0 right-0 z-[101] flex flex-col
              bg-white dark:bg-zinc-950
              rounded-t-[28px] md:rounded-[24px]
              shadow-[0_-8px_40px_rgba(0,0,0,0.12)]
              border border-zinc-200 dark:border-zinc-800
              ${isModal ? 'h-[88vh] md:h-[80vh] md:max-w-2xl md:left-1/2 md:-translate-x-1/2 md:bottom-8' : 'h-[85vh] md:w-[400px] md:h-[calc(100vh-32px)] md:right-4 md:left-auto md:bottom-4 md:rounded-[24px]'}
              overflow-hidden
            `}
          >
            {/* Drag Indicator Handle (Mobile usually) */}
            <div className="w-full h-8 flex justify-center items-center cursor-grab active:cursor-grabbing shrink-0 mt-2">
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            </div>

            {/* Absolute Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors z-20"
            >
              <X className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </button>

            {/* Scrollable Content inside sheet */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">
              
              {/* Image Carousel */}
              {data.images && data.images.length > 0 && (
                <div className="relative group">
                  <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  >
                    {data.images.map((img, idx) => (
                      <div key={idx} className="w-full shrink-0 h-64 sm:h-72 relative snap-center">
                        <img 
                          src={img} 
                          alt={`${data.name} photo ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </div>

                  {/* Carousel Controls (visible on hover or larger screens) */}
                  {data.images.length > 1 && (
                    <>
                      <button onClick={scrollLeft} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={scrollRight} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 right-4 px-2.5 py-1 text-xs font-medium text-white bg-black/40 backdrop-blur-md rounded-full">
                        1 / {data.images.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Header Info */}
              <div className="p-5 pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      {data.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-200">
                        {data.rating}
                      </span>
                      {/* Assuming RatingStars is a valid component */}
                      <RatingStars rating={data.rating} size="sm" readOnly />
                      <span>({data.reviewCount})</span>
                      <span>•</span>
                      <span>{data.priceRange}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Category */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                  <div className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full ${data.isOpen ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {data.isOpen ? <Clock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {data.isOpen ? `Open · Closes ${data.closingTime}` : 'Closed right now'}
                  </div>
                  <div className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-medium">
                    {data.category}
                  </div>
                </div>

                {/* Quick Actions Action Row */}
                <div className="grid grid-cols-4 gap-2 mt-6">
                  <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    <Navigation2 className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">Directions</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <Bookmark className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">Save</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <Phone className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">Call</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <Share2 className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">Share</span>
                  </button>
                </div>

                {data.id && (
                  <button
                    onClick={handleOpenDetails}
                    className="mt-3 w-full rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    View full shop details
                  </button>
                )}
              </div>

              {/* Tabs Section using Radix Tabs for accessibility and clean structure */}
              <Tabs.Root 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="mt-6 flex flex-col"
              >
                <Tabs.List className="flex w-full border-b border-zinc-200 dark:border-zinc-800 px-5 relative">
                  {['overview', 'menu', 'reviews'].map((tab) => (
                    <Tabs.Trigger
                      key={tab}
                      value={tab}
                      className={`
                        relative px-4 py-3 text-sm font-semibold capitalize outline-none whitespace-nowrap
                        ${activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}
                      `}
                    >
                      {tab}
                      {activeTab === tab && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <div className="px-5 py-6 pb-20 md:pb-6">
                  {/* Overview Tab */}
                  <Tabs.Content value="overview" className="outline-none space-y-6">
                    <div>
                      <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2.5">About</h3>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {data.description}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">Details</h3>
                      <div className="flex gap-3 items-start p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                        <MapPin className="w-5 h-5 mt-0.5 text-zinc-400" />
                        <div>
                          <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{data.address}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 cursor-pointer font-medium hover:underline">See on map</p>
                        </div>
                      </div>
                      
                      {data.website && (
                        <div className="flex gap-3 items-center p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                          <Globe className="w-5 h-5 text-zinc-400 shrink-0" />
                          <a href={`https://${data.website}`} target="_blank" rel="noreferrer" className="text-sm text-zinc-900 dark:text-zinc-100 font-medium truncate hover:underline">
                            {data.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {data.features && (
                      <div>
                        <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-3">Features & Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {data.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Tabs.Content>

                  {/* Menu Tab */}
                  <Tabs.Content value="menu" className="outline-none space-y-4">
                    {data.menu ? (
                      <div className="space-y-3">
                        {data.menu.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 hover:border-blue-100 dark:hover:border-blue-900/30 transition-colors cursor-default">
                            <div>
                              <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{item.name}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{item.desc}</div>
                            </div>
                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-200">{item.price}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center flex flex-col items-center opacity-60">
                        <Coffee className="w-8 h-8 mb-2" />
                        <p className="text-sm">Menu not available</p>
                      </div>
                    )}
                  </Tabs.Content>

                  {/* Reviews Tab */}
                  <Tabs.Content value="reviews" className="outline-none space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-3xl font-bold">{data.rating}</div>
                        <div className="text-xs text-zinc-500 mt-1">Based on {data.reviewCount} reviews</div>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-full rounded-[24px]">Write Review</Button>
                    </div>

                    <div className="space-y-4">
                      {data.reviews ? data.reviews.map((rev, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{rev.user}</span>
                            <span className="text-xs text-zinc-400">{rev.date}</span>
                          </div>
                          <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, idx) => (
                              <Star key={idx} className={`w-3.5 h-3.5 ${idx < rev.rating ? 'fill-current' : 'text-zinc-300 dark:text-zinc-700'}`} />
                            ))}
                          </div>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{rev.text}</p>
                        </div>
                      )) : (
                        <div className="py-10 text-center flex flex-col items-center opacity-60">
                          <Info className="w-8 h-8 mb-2" />
                          <p className="text-sm">No reviews yet</p>
                        </div>
                      )}
                    </div>
                  </Tabs.Content>
                </div>
              </Tabs.Root>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ShopBottomSheet;
