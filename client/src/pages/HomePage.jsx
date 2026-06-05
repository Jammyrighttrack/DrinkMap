import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { StarIcon, MapPinIcon, ClockIcon, BuildingStorefrontIcon, MapIcon, XMarkIcon } from '@heroicons/react/24/outline';

import Sidebar from '../components/layout/Sidebar';
import { useMapStore } from '../store/useMapStore';
import MapCore from '../features/map/components/MapCore';
import ShopBottomSheet from '../features/shops/components/ShopBottomSheet';
import ChatOverlay from '../features/ai_chat/components/ChatOverlay';
import SearchBar from '../features/search/components/SearchBar';
import AuthModal from '../features/auth/components/AuthModal';
import useNearbyShops from '../features/map/hooks/useNearbyShops';
import useGeolocation from '../features/map/hooks/useGeolocation';
import TasteProfileBar from '../features/search/components/TasteProfileBar';

const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 }; // Hồ Hoàn Kiếm, Hà Nội

// Removed obsolete SECTION_CONTENT

const TASTE_PROFILE_KEYWORDS = {
  date: ['date', 'romantic', 'lãng mạn', 'lang man', 'hen ho', 'hẹn hò', 'cap doi', 'cặp đôi'],
  work: ['wifi', 'study', 'quiet', 'work', 'deadline', 'working', 'lam viec', 'làm việc'],
  delicious: ['ngon', 'signature', 'specialty', 'chat luong', 'chất lượng', 'delicious', 'tasty', 'coffee', 'cafe', 'tea', 'tra', 'milktea', 'boba'],
  chill: ['chill', 'view', 'cozy', 'song ao', 'sống ảo', 'instagram', 'thoai mai', 'thoải mái', 'view dep', 'view đẹp'],
  classic: ['classic', 'co dien', 'cổ điển', 'traditional', 'truyen thong', 'truyền thống', 'nostalgic', 'hoai niem', 'hoài niệm'],
  modern: ['modern', 'hien dai', 'hiện đại', 'tre trung', 'trẻ trung', 'cyber', 'industrial'],
};

// Removed obsolete PRICE_RANGE_MAP

const getShopRating = (shop) => shop?.average_rating ?? shop?.rating ?? 0;
const getShopReviewCount = (shop) => shop?.total_reviews ?? shop?.reviewCount ?? 0;

const getShopCategoryText = (shop) => {
  if (Array.isArray(shop?.category) && shop.category.length > 0) {
    return shop.category.join(', ');
  }

  if (typeof shop?.category === 'string' && shop.category.trim() !== '') {
    return shop.category;
  }

  return 'Beverage Shop';
};

const buildShopSearchText = (shop) => {
  const categories = Array.isArray(shop?.category) ? shop.category.join(' ') : shop?.category || '';
  const tags = Array.isArray(shop?.tags) ? shop.tags.join(' ') : '';

  return [
    shop?.name,
    shop?.address,
    shop?.description,
    categories,
    tags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const matchesKeyword = (shop, query) => {
  if (!query) {
    return true;
  }

  return buildShopSearchText(shop).includes(query.trim().toLowerCase());
};

const matchesTasteProfile = (shop, profileId) => {
  if (!profileId) {
    return true;
  }

  const keywords = TASTE_PROFILE_KEYWORDS[profileId];

  if (!keywords) {
    return true;
  }

  const haystack = buildShopSearchText(shop);
  return keywords.some((keyword) => haystack.includes(keyword));
};

const matchesPriceRange = (shop, priceRange) => {
  if (priceRange === null || priceRange === undefined || priceRange === '') {
    return true;
  }

  const target = Number(priceRange);
  let shopPrice = shop?.price_range || shop?.priceRange;

  if (!shopPrice) {
    // Fallback cho dữ liệu mock nếu thiếu price_range (ước lượng từ giá menu)
    if (Array.isArray(shop?.menu) && shop.menu.length > 0) {
      const avgPrice = shop.menu.reduce((sum, item) => sum + item.price, 0) / shop.menu.length;
      if (avgPrice < 30000) shopPrice = 1;
      else if (avgPrice <= 50000) shopPrice = 2;
      else shopPrice = 3;
    } else {
      shopPrice = 2; // Mặc định tầm trung
    }
  }

  return Number(shopPrice) === target;
};

const hasValidCoordinates = (shop) => {
  const coordinates = shop?.location?.coordinates;

  return (
    Array.isArray(coordinates) &&
    coordinates.length >= 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1])
  );
};

const toMapCenter = (shop) => {
  if (!shop?.location?.coordinates || shop.location.coordinates.length < 2) {
    return null;
  }

  return {
    lat: shop.location.coordinates[1],
    lng: shop.location.coordinates[0],
  };
};

const normalizeShopForUI = (shop) => {
  if (!shop) {
    return null;
  }

  const priceRangeLabel = {
    low: '$',
    medium: '$$',
    high: '$$$',
    1: '$',
    2: '$$',
    3: '$$$',
  };

  return {
    ...shop,
    rating: getShopRating(shop),
    reviewCount: getShopReviewCount(shop),
    category: getShopCategoryText(shop),
    priceRange: priceRangeLabel[shop.price_range || shop.priceRange] || '$$',
    isOpen: shop.is_active !== false,
    closingTime: shop.opening_hours || '22:00',
    features: Array.isArray(shop.tags) ? shop.tags : [],
    images: Array.isArray(shop.images) && shop.images.length > 0 ? shop.images : undefined,
  };
};

// Removed obsolete getSectionShops

const CATEGORY_LABELS = {
  date: 'Date lãng mạn',
  work: 'Working space',
  delicious: 'Đồ uống ngon',
  chill: 'View đẹp & chill',
  classic: 'Cổ điển',
  modern: 'Hiện đại',
};

const ShopListPanel = ({
  visibleShops,
  onOpenShop,
  isLoading,
  error,
  locationError,
  categoryFilter,
}) => {
  const displayTitle = categoryFilter
    ? `Bộ sưu tập: ${CATEGORY_LABELS[categoryFilter] || categoryFilter}`
    : 'Danh sách quán nước';

  const getTagStyle = (tag) => {
    const lower = tag.toLowerCase();
    if (lower.includes('date') || lower.includes('lãng mạn')) {
      return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
    }
    if (lower.includes('work') || lower.includes('space')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
    }
    if (lower.includes('chill') || lower.includes('view')) {
      return 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30';
    }
    if (lower.includes('ngon') || lower.includes('đồ uống')) {
      return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    }
    return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  };

  const formatDistance = (meters) => {
    if (meters === undefined || meters === null) return '';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatPriceRange = (range) => {
    if (range === 1 || range === 'low') return 'Tiết kiệm';
    if (range === 2 || range === 'medium') return 'Vừa phải';
    if (range === 3 || range === 'high') return 'Cao cấp';
    return 'Hợp lý';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-[400px] shrink-0 border-l border-zinc-200 bg-white h-full flex flex-col z-20 hidden lg:flex rounded-l-3xl overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.03)]"
    >
      <div className="p-6 shrink-0 border-b border-zinc-100 bg-zinc-50/30">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
          {displayTitle}
        </p>
        <h3 className="mt-1 text-2xl font-black tracking-tight text-zinc-900">{visibleShops.length} địa điểm</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">Các quán nước được chọn lọc gần vị trí của bạn.</p>

        {locationError && (
          <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-800 border border-amber-100">
            Đang dùng vị trí mặc định do thiếu quyền định vị.
          </div>
        )}

        {isLoading && (
          <div className="mt-4 rounded-xl bg-zinc-100/80 px-3 py-3 text-xs font-bold text-zinc-500 animate-pulse border border-zinc-200/50">
            Đang quét các địa điểm lân cận...
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-3 py-3 text-xs font-semibold leading-relaxed text-rose-700 border border-rose-100">
            Không tải được dữ liệu. Vui lòng kiểm tra lại.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin">
        {!isLoading && !error && visibleShops.length === 0 && (
          <div className="rounded-2xl bg-emerald-50/50 p-6 text-xs font-bold leading-relaxed text-emerald-800 border border-emerald-100 text-center">
            Không tìm thấy quán nước nào. Hãy thử nới rộng bán kính hoặc chọn tiêu chí khác.
          </div>
        )}

        {!isLoading && !error && visibleShops.length > 0 && (
          visibleShops.map((shop) => {
            const hasDist = shop.distance !== undefined && shop.distance !== null;
            const distText = formatDistance(shop.distance);

            return (
              <button
                key={shop.id}
                onClick={() => onOpenShop(shop)}
                className="flex gap-4 w-full rounded-2xl border border-zinc-100 bg-white p-3.5 text-left transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-zinc-200/40 hover:bg-emerald-50/10 group cursor-pointer"
              >
                {/* Thumbnail / Gradient Placeholder */}
                <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100 flex items-center justify-center relative">
                  {shop.thumbnail ? (
                    <img
                      src={shop.thumbnail}
                      alt={shop.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-amber-500 flex items-center justify-center text-white transition-transform duration-500 group-hover:scale-110">
                      <BuildingStorefrontIcon className="w-7 h-7 stroke-[2]" />
                    </div>
                  )}
                </div>

                {/* Info Text Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-[15px] text-zinc-800 leading-snug truncate group-hover:text-emerald-600 transition-colors">
                        {shop.name}
                      </h4>
                      <div className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-600">
                        <StarIcon className="w-3 h-3 fill-emerald-500 stroke-emerald-500" />
                        <span>{getShopRating(shop).toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-zinc-400">
                      <span>{getShopCategoryText(shop)}</span>
                      <span>•</span>
                      <span>{formatPriceRange(shop.price_range)}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500 font-semibold truncate">
                    <MapPinIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>
                      {hasDist ? `${distText} · ` : ''}{shop.address}
                    </span>
                  </div>

                  {/* Tags */}
                  {shop.tags && shop.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {shop.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className={`inline-block rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border ${getTagStyle(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth || state.user || {});

  const {

    shops,
    selectedShop,
    filters,
    isLoading,
    error,
    loadNearbyShops,
    handleSelectShop,
    handleDeselectShop,
  } = useNearbyShops();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [queryCenter, setQueryCenter] = useState({
    lat: filters?.lat || DEFAULT_CENTER.lat,
    lng: filters?.lng || DEFAULT_CENTER.lng,
  });
  const [focusCenter, setFocusCenter] = useState(null);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);
  const prevFilters = useRef({
    beverage_types: filters?.beverage_types,
    price_range: filters?.price_range,
    radius_km: filters?.radius_km,
    q: filters?.q,
  });

  // Sync center when filter location is updated (from FilterSelectionPage)
  useEffect(() => {
    if (filters?.lat && filters?.lng) {
      setQueryCenter({ lat: filters.lat, lng: filters.lng });
    }
  }, [filters?.lat, filters?.lng]);

  const {
    location,
    error: locationError,
    requestLocation,
  } = useGeolocation();

  const activeRoute = useMapStore((state) => state.activeRoute);
  const clearActiveRoute = useMapStore((state) => state.clearActiveRoute);
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const clearActiveShops = useMapStore((state) => state.clearActiveShops);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (location) {
      setUserLocation(location);
    }
  }, [location, setUserLocation]);

  useEffect(() => {
    if (!location || hasCenteredOnUser) {
      return;
    }

    setFocusCenter(null);
    setQueryCenter({ lat: location.lat, lng: location.lng });
    setHasCenteredOnUser(true);
  }, [location, hasCenteredOnUser]);

  useEffect(() => {
    loadNearbyShops({
      lng: queryCenter.lng,
      lat: queryCenter.lat,
      radius_km: filters.radius_km,
      beverage_types: filters.beverage_types,
      price_range: filters.price_range,
      q: filters.q,
    });
  }, [
    filters.radius_km,
    filters.beverage_types,
    filters.price_range,
    filters.q,
    loadNearbyShops,
    queryCenter,
  ]);

  useEffect(() => {
    const hasChanged =
      prevFilters.current.beverage_types !== filters.beverage_types ||
      prevFilters.current.price_range !== filters.price_range ||
      prevFilters.current.radius_km !== filters.radius_km ||
      prevFilters.current.q !== filters.q;

    if (hasChanged) {
      handleDeselectShop();
      clearActiveRoute();
      clearActiveShops();
      
      prevFilters.current = {
        beverage_types: filters.beverage_types,
        price_range: filters.price_range,
        radius_km: filters.radius_km,
        q: filters.q,
      };
    }
  }, [filters.beverage_types, filters.price_range, filters.radius_km, filters.q, handleDeselectShop, clearActiveRoute, clearActiveShops]);

  const visibleShops = useMemo(() => {
    return shops
      .filter((shop) => matchesKeyword(shop, filters.q))
      .filter((shop) => matchesTasteProfile(shop, filters.beverage_types))
      .filter((shop) => matchesPriceRange(shop, filters.price_range));
  }, [
    filters.beverage_types,
    filters.price_range,
    filters.q,
    shops,
  ]);

  const mapCenter = useMemo(() => {
    if (focusCenter) {
      return [focusCenter.lat, focusCenter.lng];
    }

    return [queryCenter.lat, queryCenter.lng];
  }, [focusCenter, queryCenter]);

  const mapShops = useMemo(
    () => visibleShops.filter((shop) => hasValidCoordinates(shop)),
    [visibleShops]
  );

  const openShop = (shop) => {
    handleSelectShop(shop);

    const shopCenter = toMapCenter(shop);
    if (shopCenter) {
      setFocusCenter(shopCenter);
    }
  };

  // Removed obsolete handleSectionChange

  // Removed obsolete handleMapDragEnd

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar ngăn kéo cho Mobile */}
      <div className="lg:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          visibleShopsCount={visibleShops.length}
          isLoading={isLoading}
        />
      </div>

      <div className="relative flex h-full w-full flex-1 flex-col pt-16">

        {/* Topbar Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40 flex items-center shadow-sm">
          {/* Vùng logo & menu cho Sidebar (w-auto/w-72 linh hoạt) */}
          <div className="flex items-center lg:w-72 px-4 gap-4 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center justify-center p-2.5 -ml-2 rounded-xl transition-all border ${isSidebarOpen
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div
              onClick={() => navigate('/filters')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
            >
              <div className="flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl p-1.5 shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <line x1="6" x2="6" y1="2" y2="4" />
                  <line x1="10" x2="10" y1="2" y2="4" />
                  <line x1="14" x2="14" y1="2" y2="4" />
                </svg>
              </div>
              <span className="font-black text-xl tracking-tight text-gray-900 hidden lg:block">DrinkMap</span>
            </div>
          </div>

          {/* Vùng chứa thanh tìm kiếm */}
          <div className="flex-1 max-w-2xl px-2 lg:px-6">
            <SearchBar placeholder="Tìm kiếm quán, đồ uống, hoặc mood..." />
          </div>

          {/* Vùng chứa nút tác vụ nhanh bên phải */}
          <div className="flex items-center ml-auto pr-4 gap-3 shrink-0">
            <div
              onClick={() => navigate('/profile')}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 border border-emerald-200 cursor-pointer hover:bg-emerald-200 transition-colors shadow-sm"
              title="Trang cá nhân"
            >
              {currentUser?.fullName?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Bố cục chính chia cột (Flexbox) bên dưới Header */}
        <div className="relative flex-1 flex w-full h-[calc(100vh-4rem)] overflow-hidden">
          {/* Cột trái: Bộ lọc Sidebar cố định/tùy chọn trên Desktop */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden lg:flex flex-col w-80 shrink-0 border-r border-zinc-200 bg-white z-20 h-full overflow-hidden"
              >
                <div className="p-5 border-b border-zinc-100 shrink-0 bg-white">
                  <h2 className="text-lg font-black text-zinc-900">Bộ lọc quán nước</h2>
                  <p className="text-xs text-zinc-500 mt-1">Tìm kiếm theo 3 tiêu chí của bạn</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <TasteProfileBar />
                </div>
                {/* Tích hợp trực tiếp thẻ trạng thái "Đang xem" ở dưới đáy Sidebar */}
                <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Trạng thái tìm kiếm
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-600 animate-in zoom-in duration-300">
                      {visibleShops.length}
                    </span>
                    <span className="text-sm font-semibold text-zinc-600">
                      địa điểm gần bạn
                    </span>
                  </div>
                  {isLoading && (
                    <p className="mt-2 text-xs text-emerald-600 font-medium animate-pulse">
                      Đang tải danh sách quán...
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vùng bản đồ & Lớp phủ nổi */}
          <div className="relative flex-1 h-full">
            <div className="absolute inset-0 z-0">
              <MapCore
                center={mapCenter}
                zoom={13}
                shops={mapShops}
                userLocation={location}
                onMarkerClick={openShop}
              />
            </div>

            {/* Các lớp phủ (Overlay) bên trong bản đồ */}
            <div className="pointer-events-none absolute inset-0 z-10">
              {/* Thẻ chỉ đường nổi dạng Google Maps */}
              <AnimatePresence>
                {activeRoute && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="pointer-events-auto absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-sm"
                  >
                    <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <MapIcon className="h-5 w-5 animate-pulse" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                            Đường đi đến {activeRoute.shopName}
                          </p>
                          <p className="text-sm font-extrabold text-zinc-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                            <span>
                              {activeRoute.distance >= 1000
                                ? `${(activeRoute.distance / 1000).toFixed(1)} km`
                                : `${Math.round(activeRoute.distance)} m`}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700 font-normal">|</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {Math.ceil(activeRoute.duration / 60)} phút
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={clearActiveRoute}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Thẻ "Đang xem" dạng nổi (Chỉ hiện trên mobile hoặc khi Sidebar desktop bị đóng) */}
              <AnimatePresence mode="wait">
                {!isSidebarOpen && (
                  <motion.div
                    key={`shops-${visibleShops.length}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="pointer-events-auto absolute left-4 top-4"
                  >
                    <div className="rounded-2xl border border-white bg-white/95 px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
                      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                        Đang xem
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-3xl font-bold text-transparent">
                          {visibleShops.length}
                        </span>
                        <span className="text-sm font-medium text-zinc-500 line-clamp-1">
                          Địa điểm gần bạn
                        </span>
                      </div>
                      {!isLoading && mapShops.length !== visibleShops.length && (
                        <p className="mt-2 text-xs text-zinc-500">
                          Một vài quán chưa có tọa độ hợp lệ trên bản đồ.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          <AnimatePresence mode="wait">
            <ShopListPanel
              visibleShops={visibleShops}
              onOpenShop={(shop) => navigate(`/shop/${shop.id}`)}
              isLoading={isLoading}
              error={error}
              locationError={locationError}
              categoryFilter={filters.beverage_types}
            />
          </AnimatePresence>
        </div>

        <ShopBottomSheet
          isOpen={Boolean(selectedShop)}
          onClose={handleDeselectShop}
          shop={normalizeShopForUI(selectedShop)}
          userLocation={location}
        />

        <ChatOverlay />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default HomePage;
