import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import MapCore from '../features/map/components/MapCore';
import ShopBottomSheet from '../features/shops/components/ShopBottomSheet';
import SearchBar from '../features/search/components/SearchBar';
import FilterDrawer from '../features/search/components/FilterDrawer';
import AuthModal from '../features/auth/components/AuthModal';
import useNearbyShops from '../features/map/hooks/useNearbyShops';
import useGeolocation from '../features/map/hooks/useGeolocation';

const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 }; // Hồ Hoàn Kiếm, Hà Nội

const SECTION_CONTENT = {
  explore: {
    title: 'Bản đồ quán',
    subtitle: 'Danh sách quán gần vị trí hiện tại của bạn.',
  },
  trending: {
    title: 'Thịnh hành',
    subtitle: 'Sắp xếp ưu tiên các quán có đánh giá và mức độ quan tâm cao.',
  },
  saved: {
    title: 'Quán đã lưu',
    subtitle: 'Tính năng này sẽ được kích hoạt sau khi đăng nhập.',
  },
  favourite: {
    title: 'Quán yêu thích',
    subtitle: 'Những quán bạn thả tim sẽ xuất hiện tại đây.',
  },
};

const TASTE_PROFILE_KEYWORDS = {
  coffee: ['coffee', 'cafe', 'espresso', 'brew', 'ca phe'],
  milktea: ['milk tea', 'bubble tea', 'tra sua', 'boba'],
  tea: ['tea', 'tra', 'fruit tea'], 
  matcha: ['matcha', 'green tea'],
  sweet: ['dessert', 'cake', 'sweet', 'banh'],
  work: ['wifi', 'study', 'quiet', 'work', 'deadline'],
  chill: ['chill', 'view', 'cozy', 'song ao', 'instagram'],
  date: ['date', 'romantic', 'view', 'cozy'],
};

const PRICE_RANGE_COMPAT = {
  cheap: 'low',
  mid: 'medium',   
  low: 'low',
  medium: 'medium',
  high: 'high',
};

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
  if (!priceRange || priceRange === 'all') {
    return true;
  }

  const normalizedTarget = PRICE_RANGE_COMPAT[priceRange] || priceRange;
  return (shop?.price_range || shop?.priceRange || '') === normalizedTarget;
};

const getCoordinatesFromLocation = (shop) => {
  const loc = shop?.location;
  if (!loc) return null;

  const { type, coordinates } = loc;

  // Point: coordinates = [lng, lat]
  if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
    const [lng, lat] = coordinates;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  // Polygon: coordinates = [[[lng, lat], ...]] — lấy centroid của ring đầu tiên
  if ((type === 'Polygon' || type === 'MultiPolygon') && Array.isArray(coordinates)) {
    const ring = type === 'Polygon' ? coordinates[0] : coordinates[0]?.[0];
    if (Array.isArray(ring) && ring.length > 0) {
      const avgLng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
      const avgLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
      if (Number.isFinite(avgLat) && Number.isFinite(avgLng)) return { lat: avgLat, lng: avgLng };
    }
  }

  return null;
};

const hasValidCoordinates = (shop) => getCoordinatesFromLocation(shop) !== null;

const toMapCenter = (shop) => getCoordinatesFromLocation(shop);

const normalizeShopForUI = (shop) => {
  if (!shop) {
    return null;
  }

  const priceRangeLabel = {
    low: '$',
    medium: '$$',
    high: '$$$',
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
   
const getSectionShops = (shops, activeSection) => {
  if (activeSection === 'trending') {  
    return [...shops]
      .filter((shop) => getShopRating(shop) >= 4)
      .sort((a, b) => getShopRating(b) - getShopRating(a));
  }
 
  if (activeSection === 'saved' || activeSection === 'favourite') {
    return [];
  }

  return shops;
};

const CATEGORY_LABELS = {
  coffee: 'Cà phê',  
  milktea: 'Trà sữa',
  tea: 'Trà & Trà trái cây',
  matcha: 'Matcha',
  sweet: 'Đồ ngọt',
  work: 'Làm việc',
  chill: 'Chill',
  date: 'Hẹn hò',
};

const SectionPanel = ({
  activeSection,
  visibleShops,
  onOpenShop,
  isLoading,
  error,
  locationError,
  categoryFilter,
}) => {
  const content = SECTION_CONTENT[activeSection] || SECTION_CONTENT.explore;
         
  // Nếu đang ở Explore và có chọn filter (ví dụ: coffee), hiển thị làm Curation
  const displayTitle = activeSection === 'explore' && categoryFilter
    ? `Bộ sưu tập: ${CATEGORY_LABELS[categoryFilter] || categoryFilter}`
    : content.title;    

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}  
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="pointer-events-auto absolute right-0 top-16 bottom-0 w-[380px] border-l border-zinc-200 bg-white/95 shadow-[-20px_0_40px_rgba(0,0,0,0.05)] backdrop-blur-2xl lg:flex flex-col hidden z-30"
    >
      <div className="p-6 shrink-0 border-b border-zinc-100 bg-white/50">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-600">
          {displayTitle}
        </p>
        <h3 className="mt-2 text-2xl font-black text-zinc-900">{visibleShops.length} địa điểm</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{content.subtitle}</p>

        {locationError && (
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium leading-6 text-amber-800 border border-amber-100">
            Đang dùng vị trí mặc định vì trình duyệt chưa cấp quyền vị trí.
          </div>
        )}

        {isLoading && (
          <div className="mt-5 rounded-xl bg-zinc-50 px-4 py-4 text-sm font-medium text-zinc-600 border border-zinc-100">
            Đang tải danh sách quán gần bạn...
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-5 rounded-xl bg-rose-50 px-4 py-4 text-sm font-medium leading-6 text-rose-700 border border-rose-100">
            Không tải được dữ liệu quán. Kiểm tra backend hoặc API URL rồi thử lại.
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {!isLoading && !error && (activeSection === 'saved' || activeSection === 'favourite') && (
          <div className="rounded-2xl bg-zinc-50 p-5 text-sm font-medium leading-6 text-zinc-600 border border-zinc-100 text-center">
            Tính năng dành cho người dùng đã đăng nhập. Tạm thời chờ đợi ở phiên bản sau nhé.
          </div>
        )}

        {!isLoading && !error && activeSection !== 'saved' && activeSection !== 'favourite' && visibleShops.length === 0 && (
          <div className="rounded-2xl bg-orange-50 p-5 text-sm font-medium leading-6 text-orange-800 border border-orange-100 text-center">
            Không có quán phù hợp với bộ lọc hiện tại. Thử giảm bán kính, bỏ taste profile, hoặc tìm bằng từ khóa khác.
          </div>
        )}

        {!isLoading && !error && activeSection !== 'saved' && activeSection !== 'favourite' && visibleShops.length > 0 && (
          visibleShops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => onOpenShop(shop)}
              className="block w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left transition hover:border-orange-300 hover:shadow-md hover:bg-orange-50/50 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-zinc-900 truncate group-hover:text-orange-700 transition-colors">{shop.name}</p>
                  <p className="mt-1 text-[13px] font-medium text-zinc-500 truncate">{getShopCategoryText(shop)}</p>
                </div>
                <span className="shrink-0 flex items-center justify-center min-w-[36px] rounded-full bg-orange-100 px-2 py-1 text-[13px] font-black text-orange-600 border border-orange-200">
                  {getShopRating(shop).toFixed(1)}
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-zinc-600 line-clamp-2">{shop.address}</p>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);

  const [showFilters, setShowFilters] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('explore');
  const [queryCenter, setQueryCenter] = useState(DEFAULT_CENTER);
  const [focusCenter, setFocusCenter] = useState(null);

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

  const {
    location,
    error: locationError,
    requestLocation,
  } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!location) {
      return;
    }  

    setFocusCenter(null);
    setQueryCenter((currentCenter) => {
      if (
        Math.abs(currentCenter.lat - location.lat) < 0.0001 &&
        Math.abs(currentCenter.lng - location.lng) < 0.0001
      ) {
        return currentCenter;
      }

      return { lat: location.lat, lng: location.lng };
    });
  }, [location]);
    
  useEffect(() => {
    loadNearbyShops({
      lng: queryCenter.lng,
      lat: queryCenter.lat,
      max_distance: filters.max_distance,
    });
  }, [filters.max_distance, loadNearbyShops, queryCenter]);

  useEffect(() => {
    handleDeselectShop();
  }, [activeSection, handleDeselectShop]);

  const visibleShops = useMemo(() => {
    const filtered = shops
      .filter((shop) => matchesKeyword(shop, filters.q))
      .filter((shop) => matchesTasteProfile(shop, filters.category))
      .filter((shop) => getShopRating(shop) >= (filters.minRating || 0))
      .filter((shop) => matchesPriceRange(shop, filters.priceRange));

    return getSectionShops(filtered, activeSection);
  }, [  
    activeSection,
    filters.category,  
    filters.minRating,
    filters.priceRange,
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

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  }; 
    
  const handleMapDragEnd = ({ lat, lng }) => {
    setFocusCenter(null);
    setQueryCenter((currentCenter) => {
      if (
        Math.abs(currentCenter.lat - lat) < 0.0001 &&
        Math.abs(currentCenter.lng - lng) < 0.0001
      ) {
        return currentCenter;
      }

      return { lat, lng };
    });
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeItem={activeSection}
        onNavigate={handleSectionChange}
      />

      <div className="relative flex h-full w-full flex-1 flex-col pt-16">

        {/* Topbar Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40 flex items-center shadow-sm">
          {/* Vùng logo & menu cho Sidebar (w-auto/w-72 linh hoạt) */}
          <div className="flex items-center lg:w-72 px-4 gap-4 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}     
              className={`flex items-center justify-center p-2.5 -ml-2 rounded-xl transition-all border ${isSidebarOpen
                ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg p-1.5 leading-none shadow-sm cursor-pointer">🍹</span>
              <span className="font-black text-xl tracking-tight text-gray-900 hidden lg:block cursor-pointer">DrinkMap</span>
            </div>
          </div>

          {/* Vùng chứa thanh tìm kiếm */}
          <div className="flex-1 max-w-2xl px-2 lg:px-6">
            <SearchBar placeholder="Tìm kiếm quán, đồ uống, hoặc mood..." />
          </div>

          {/* Vùng chứa nút tác vụ nhanh bên phải */}
          <div className="flex items-center ml-auto pr-4 gap-3 shrink-0">
            <button
              onClick={() => setShowFilters(true)}
              className="p-2.5 text-orange-600 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors shadow-sm"
              title="Bộ lọc nâng cao"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
            <div   
              onClick={() => navigate('/profile')}  
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors shadow-sm"
              title="Trang cá nhân"
            >
              {currentUser?.fullName?.charAt(0)?.toUpperCase() || currentUser?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Navbar for Mobile */}
        <Navbar   
          activeTab={activeSection === 'saved' ? 'saved' : activeSection === 'favourite' ? 'favourite' : 'explore'}
          onTabChange={handleSectionChange}  
        />

        <div className="absolute inset-0 z-0 top-16">
          <MapCore  
            center={mapCenter}  
            zoom={13}
            shops={mapShops}
            userLocation={location}  
            onMarkerClick={openShop}
            onMapDragEnd={handleMapDragEnd}  
          />  
        </div>  

        <div className="pointer-events-none absolute inset-0 z-10 pt-16">
          <AnimatePresence mode="wait">  
            <motion.div   
              key={`${activeSection}-${visibleShops.length}`}  
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}   
              exit={{ opacity: 0, x: -20 }}  
              className="pointer-events-auto absolute left-4 top-48"
            >
              <div className="rounded-2xl border border-white bg-white/95 px-5 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Đang xem
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-3xl font-bold text-transparent">
                    {visibleShops.length}
                  </span>
                  <span className="text-sm font-medium text-text-secondary line-clamp-1">
                    {SECTION_CONTENT[activeSection]?.title}
                  </span>
                </div>
                {!isLoading && mapShops.length !== visibleShops.length && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Một vài quán chưa có tọa độ hợp lệ trên bản đồ.
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>  
   
          <AnimatePresence mode="wait">  
            {(activeSection === 'explore' && filters.category) && (
              <SectionPanel             
                key={`${activeSection}-${filters.category}`}
                activeSection={activeSection}
                visibleShops={visibleShops}
                onOpenShop={openShop}      
                isLoading={isLoading}    
                error={error}    
                locationError={locationError}  
                categoryFilter={filters.category}  
              />  
            )}
          </AnimatePresence>  
        </div>

        <FilterDrawer
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />
   
        <ShopBottomSheet
          isOpen={Boolean(selectedShop)}    
          onClose={handleDeselectShop}
          shop={normalizeShopForUI(selectedShop)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default HomePage;
