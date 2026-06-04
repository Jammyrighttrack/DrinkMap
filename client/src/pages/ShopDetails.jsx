import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, GlobeAltIcon, HeartIcon, InformationCircleIcon, MapPinIcon, ChatBubbleLeftIcon, MapIcon, PhoneIcon, ShareIcon, StarIcon, BuildingStorefrontIcon, LockClosedIcon } from '@heroicons/react/24/outline';

import { RatingStars } from '../components/ui/RatingStars';
import { ShopMenuList } from '../features/shops/components/ShopMenuList';
import {
  clearSelectedShop,
  fetchShopDetail,
  selectDetailStatus,
  selectSelectedShop,
  selectShopsError,
} from '../features/shops/shopsSlice';
import {
  fetchShopReviews,
  selectShopReviews,
  selectShopReviewsLoading,
} from '../features/review/reviewsSlice';
import { WriteReviewModal } from '../features/review/components/WriteReviewModal';
import { favouritesApi } from '../features/review/reviewsApi';
import { useMapStore } from '../store/useMapStore';
import useGeolocation from '../features/map/hooks/useGeolocation';

const TAB_CONFIG = [
  { id: 'menu', label: 'Menu', icon: BuildingStorefrontIcon },
  { id: 'about', label: 'Thông tin', icon: InformationCircleIcon },
  { id: 'reviews', label: 'Đánh giá', icon: ChatBubbleLeftIcon },
];

const getCategoryText = (shop) => {
  if (Array.isArray(shop?.category) && shop.category.length > 0) {
    return shop.category.join(', ');
  }

  if (typeof shop?.category === 'string' && shop.category.trim() !== '') {
    return shop.category;
  }

  return 'Quán nước';
};

const normalizeMenuItems = (menu) => {
  if (!Array.isArray(menu)) {
    return [];
  }

  return menu.map((item, index) => ({
    id: item.id || item._id || `${item.name || 'menu'}-${index}`,
    name: item.name || 'Món không tên',
    category: item.category || 'Thực đơn',
    price: item.price || item.formattedPrice || 'Đang cập nhật',
    desc: item.desc || item.description || '',
    image: item.image || item.thumbnail || undefined,
    recommended: Boolean(item.recommended),
  }));
};

const normalizeShopDetails = (shop) => {
  if (!shop) {
    return null;
  }

  const images = Array.isArray(shop.images) ? shop.images.filter(Boolean) : [];
  const heroImages = images.length > 0 ? images : (shop.thumbnail ? [shop.thumbnail] : []);
  const priceLabel = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
  };

  return {
    ...shop,
    rating: shop.average_rating ?? shop.rating ?? 0,
    reviewCount: shop.total_reviews ?? shop.reviewCount ?? 0,
    categoryText: getCategoryText(shop),
    isOpen: shop.is_active !== false,
    closingTime: shop.opening_hours || '22:00',
    priceRange: priceLabel[shop.price_range || shop.priceRange] || '$$',
    description: shop.description || 'Thông tin quán đang được cập nhật.',
    address: shop.address || 'Đang cập nhật địa chỉ.',
    website: shop.website || '',
    phone: shop.phone || '',
    images: heroImages,
    menu: normalizeMenuItems(shop.menu),
  };
};

const formatErrorText = (error) => {
  if (!error) {
    return 'Không tải được chi tiết quán.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error?.detail === 'string') {
    return error.detail;
  }

  return 'Không tải được chi tiết quán.';
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Mới đây';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Mới đây';
  }
};

export default function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const selectedShop = useSelector(selectSelectedShop);
  const detailStatus = useSelector(selectDetailStatus);
  const error = useSelector(selectShopsError);
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  const shopReviews = useSelector(selectShopReviews(id));
  const reviewsLoading = useSelector(selectShopReviewsLoading);

  const [activeTab, setActiveTab] = useState('menu');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  // Track review count locally so it updates after submission without waiting for full shop refetch
  const [localReviewCount, setLocalReviewCount] = useState(null);

  const storeUserLocation = useMapStore((state) => state.userLocation);
  const setUserLocation = useMapStore((state) => state.setUserLocation);

  const {
    location: localLocation,
    requestLocation,
  } = useGeolocation();

  useEffect(() => {
    if (!storeUserLocation) {
      requestLocation();
    }
  }, [requestLocation, storeUserLocation]);

  useEffect(() => {
    if (localLocation) {
      setUserLocation(localLocation);
    }
  }, [localLocation, setUserLocation]);

  const userLocation = storeUserLocation || localLocation;

  const setActiveRoute = useMapStore((state) => state.setActiveRoute);
  const setFocusedShop = useMapStore((state) => state.setFocusedShop);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  const getShopPosition = (shop) => {
    const loc = shop?.location;
    if (loc) {
      const { type, coordinates } = loc;
      if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        const [lng, lat] = coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
      }
      if ((type === 'Polygon' || type === 'MultiPolygon') && Array.isArray(coordinates)) {
        const ring = type === 'Polygon' ? coordinates[0] : coordinates[0]?.[0];
        if (Array.isArray(ring) && ring.length > 0) {
          const avgLng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
          const avgLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
          if (Number.isFinite(avgLat) && Number.isFinite(avgLng)) return [avgLat, avgLng];
        }
      }
    }
    if (shop?.lat && shop?.lng) return [shop.lat, shop.lng];
    return null;
  };

  const handleGetDirections = async () => {
    if (!userLocation || !Number.isFinite(userLocation.lat) || !Number.isFinite(userLocation.lng)) {
      alert('Vui lòng bật định vị GPS trên trình duyệt để sử dụng chức năng chỉ đường.');
      requestLocation();
      return;
    }

    const shopPos = getShopPosition(shop);
    if (!shopPos) {
      alert('Không tìm thấy tọa độ của quán nước này trên bản đồ.');
      return;
    }

    const [shopLat, shopLng] = shopPos;
    setIsFetchingRoute(true);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${shopLng},${shopLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const resData = await response.json();

      if (resData.code === 'Ok' && resData.routes && resData.routes.length > 0) {
        const route = resData.routes[0];
        const coordinates = route.geometry.coordinates;
        const leafletCoords = coordinates.map((coord) => [coord[1], coord[0]]);

        setActiveRoute({
          coordinates: leafletCoords,
          distance: route.distance,
          duration: route.duration,
          shopName: shop.name,
        });

        // Clear focusedShop so HomePage does not automatically open ShopBottomSheet
        setFocusedShop(null);
        navigate('/map');
      } else {
        alert('Không tìm thấy tuyến đường đi phù hợp đến quán nước này.');
      }
    } catch (err) {
      console.error('Error fetching route from OSRM:', err);
      alert('Đã xảy ra lỗi khi kết nối với máy chủ tìm đường. Vui lòng thử lại sau.');
    } finally {
      setIsFetchingRoute(false);
    }
  };

  const handleGoBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/map');
    }
  };

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    dispatch(fetchShopDetail(id));

    return () => {
      dispatch(clearSelectedShop());
    };
  }, [dispatch, id]);

  // Load favourite status when authenticated
  useEffect(() => {
    if (!id || !isAuthenticated) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await favouritesApi.checkFavourite(id);
        if (!cancelled) {
          setIsFavorite(data.is_favourite ?? data.isFavourite ?? false);
        }
      } catch {
        // Silent fail – favourite status is non-critical
      }
    })();

    return () => { cancelled = true; };
  }, [id, isAuthenticated]);

  // Load reviews when switching to the reviews tab
  useEffect(() => {
    if (activeTab === 'reviews' && id) {
      dispatch(fetchShopReviews(id));
    }
  }, [activeTab, id, dispatch]);

  const shop = useMemo(() => {
    if (!selectedShop) return null;
    const isMatchById = selectedShop.id === id;
    const isMatchBySlug = selectedShop.slug != null && selectedShop.slug === id;
    if (!isMatchById && !isMatchBySlug) return null;
    return normalizeShopDetails(selectedShop);
  }, [id, selectedShop]);

  // Initialise localReviewCount once shop data arrives
  useEffect(() => {
    if (shop && localReviewCount === null) {
      setLocalReviewCount(shop.reviewCount);
    }
  }, [shop, localReviewCount]);

  const handleToggleFavourite = useCallback(async () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để lưu quán yêu thích.');
      return;
    }
    if (favouriteLoading) return;

    setFavouriteLoading(true);
    try {
      if (isFavorite) {
        await favouritesApi.removeFavourite(id);
        setIsFavorite(false);
      } else {
        await favouritesApi.addFavourite(id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Failed to toggle favourite:', err);
    } finally {
      setFavouriteLoading(false);
    }
  }, [id, isFavorite, isAuthenticated, favouriteLoading]);

  const handleReviewSuccess = useCallback(() => {
    // Refresh reviews list & bump count
    dispatch(fetchShopReviews(id));
    dispatch(fetchShopDetail(id));
    setLocalReviewCount((prev) => (prev !== null ? prev + 1 : null));
  }, [dispatch, id]);

  const isLoading = detailStatus === 'loading' && !shop;
  const hasError = detailStatus === 'failed' && !shop;
  const heroImage = shop?.images?.[0];

  const displayReviewCount = localReviewCount !== null ? localReviewCount : (shop?.reviewCount ?? 0);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 font-sans">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-600" />
          <h2 className="mt-5 text-lg font-bold text-zinc-900">Đang tải chi tiết quán</h2>
          <p className="mt-2 text-sm text-zinc-500">DrinkMap đang lấy dữ liệu thực từ backend.</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 font-sans">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-500">Lỗi tải chi tiết quán</p>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900">Không mở được trang chi tiết quán</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{formatErrorText(error)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleGoBack}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Quay lại bản đồ
            </button>
            <button
              onClick={() => dispatch(fetchShopDetail(id))}
              className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Thử tải lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24 lg:pb-0 font-sans">
      {/* Hero image */}
      <div className="relative min-h-[250px] h-[35vh] w-full overflow-hidden bg-zinc-900 sm:h-[40vh]">
        {heroImage ? (
          <motion.img
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            src={heroImage}
            alt={shop.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_40%),linear-gradient(135deg,_#18181b,_#27272a)]" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-900/40 to-black/30" />

        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between p-4">
          <button
            onClick={handleGoBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30">
              <ShareIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleToggleFavourite}
              disabled={favouriteLoading}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30 disabled:opacity-60"
            >
              <HeartIcon
                className={`h-5 w-5 transition-all ${
                  isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : ''
                } ${favouriteLoading ? 'animate-pulse' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-0 sm:px-6">
        <div className="overflow-hidden rounded-t-[32px] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:rounded-b-2xl sm:rounded-t-3xl sm:shadow-xl">
          {/* Shop header info */}
          <div className="border-b border-zinc-100 p-5 sm:p-8">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <span className="mb-2.5 inline-block rounded-md bg-zinc-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-700">
                  {shop.categoryText}
                </span>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-extrabold leading-tight text-zinc-900 sm:text-3xl"
                >
                  {shop.name}
                </motion.h1>
              </div>

              <div className={`mt-1 shrink-0 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${shop.isOpen ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {shop.isOpen ? 'Đang mở cửa' : 'Đã đóng cửa'}
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-2.5 py-1">
                <span className="text-sm font-bold text-yellow-700">{shop.rating.toFixed(1)}</span>
                <RatingStars rating={shop.rating} size="sm" readOnly />
                <span className="cursor-pointer text-xs font-semibold text-yellow-700/80">
                  ({displayReviewCount})
                </span>
              </div>

              <div className="h-1 w-1 rounded-full bg-zinc-300" />

              <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-600">
                <ClockIcon className="h-4 w-4 text-zinc-400" />
                <span>{shop.isOpen ? `Đóng cửa lúc ${shop.closingTime}` : 'Đang cập nhật giờ mở cửa'}</span>
              </div>

              <div className="h-1 w-1 rounded-full bg-zinc-300" />
              <div className="text-sm font-medium text-zinc-600">{shop.priceRange}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGetDirections}
                disabled={isFetchingRoute}
                className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                <MapIcon className={`h-5 w-5 ${isFetchingRoute ? 'animate-spin' : ''}`} />
                {isFetchingRoute ? 'Đang tìm đường...' : 'Chỉ đường'}
              </button>
              {shop.phone ? (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex w-14 items-center justify-center rounded-[14px] border border-zinc-200 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 active:scale-95"
                >
                  <PhoneIcon className="h-5 w-5" />
                </a>
              ) : (
                <button className="flex w-14 items-center justify-center rounded-[14px] border border-zinc-200 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 active:scale-95">
                  <PhoneIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="sticky top-0 z-20 border-b border-zinc-100 bg-white/95 backdrop-blur-xl">
            <div className="flex px-2 sm:px-6">
              {TAB_CONFIG.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-1 items-center justify-center gap-2 py-4 text-[13px] font-bold transition-colors sm:text-sm ${isActive ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-800'}`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                    {tab.label}
                    {tab.id === 'reviews' && displayReviewCount > 0 && (
                      <span className="ml-0.5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
                        {displayReviewCount}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="bg-zinc-50/50">
            {activeTab === 'menu' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[600px] bg-white"
              >
                <ShopMenuList items={shop.menu} />
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-7 p-5 sm:p-8"
              >
                <div>
                  <h3 className="mb-2.5 text-lg font-extrabold text-zinc-900">Về {shop.name}</h3>
                  <p className="text-[15px] leading-relaxed text-zinc-600">{shop.description}</p>
                </div>

                <hr className="border-zinc-200" />

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
                      <MapPinIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-sm font-bold text-zinc-900">Địa chỉ</h4>
                      <p className="mt-0.5 text-[15px] font-medium text-zinc-600">{shop.address}</p>
                    </div>
                  </div>

                  {shop.website && (
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100">
                        <GlobeAltIcon className="h-5 w-5 text-zinc-600" />
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-sm font-bold text-zinc-900">Website</h4>
                        <a
                          href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-block text-[15px] font-bold text-emerald-600 hover:underline"
                        >
                          {shop.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {shop.images.length > 1 && (
                  <>
                    <hr className="border-zinc-200" />
                    <div className="pb-6 pt-2">
                      <div className="mb-4 flex items-end justify-between">
                        <h3 className="text-lg font-extrabold text-zinc-900">Ảnh quán</h3>
                        <span className="text-[13px] font-bold text-zinc-500">
                          {shop.images.length} ảnh
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {shop.images.slice(1).map((image, index) => (
                          <div key={`${image}-${index}`} className="aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100">
                            <img
                              src={image}
                              alt={`${shop.name} ${index + 2}`}
                              className="h-full w-full object-cover transition duration-700 ease-out hover:scale-110"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 sm:p-8"
              >
                {/* Reviews header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-black text-zinc-900">{shop.rating.toFixed(1)}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <RatingStars rating={shop.rating} size="sm" readOnly />
                      <span className="text-xs text-zinc-500">({displayReviewCount} đánh giá)</span>
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:scale-105 active:scale-95"
                    >
                      Viết đánh giá
                    </button>
                  ) : (
                    <button
                      onClick={() => alert('Vui lòng đăng nhập để viết đánh giá.')}
                      className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100"
                    >
                      <LockClosedIcon className="h-3.5 w-3.5" />
                      Đăng nhập để đánh giá
                    </button>
                  )}
                </div>

                {/* Reviews loading */}
                {reviewsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-emerald-600" />
                  </div>
                )}

                {/* Reviews list */}
                {!reviewsLoading && shopReviews.length > 0 && (
                  <div className="space-y-4">
                    {shopReviews.map((review, index) => (
                      <div key={review.id || `${review.user_id}-${index}`} className="rounded-2xl bg-white p-4 shadow-sm">
                        {/* Reviewer header */}
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {review.user_avatar ? (
                                <img src={review.user_avatar} alt={review.user_name} className="h-full w-full object-cover" />
                              ) : (
                                (review.user_name || 'A').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{review.user_name || 'Người dùng ẩn danh'}</p>
                              <p className="text-xs text-zinc-400">{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                          {/* Star rating */}
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, starIndex) => (
                              <StarIcon
                                key={starIndex}
                                className={`h-3.5 w-3.5 ${starIndex < (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 fill-zinc-200'}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        {review.comment && (
                          <p className="text-sm leading-relaxed text-zinc-700">{review.comment}</p>
                        )}

                        {/* Taste tags */}
                        {review.taste_tags && review.taste_tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {review.taste_tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!reviewsLoading && shopReviews.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl" />
                      <div className="relative flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-emerald-50 shadow-sm">
                        <StarIcon className="h-8 w-8 rotate-6 fill-yellow-500 text-yellow-500" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-extrabold text-zinc-900">Chưa có đánh giá</h3>
                    <p className="mb-8 max-w-sm text-[15px] leading-relaxed text-zinc-500">
                      Hãy là người đầu tiên chia sẻ trải nghiệm về quán này!
                    </p>
                    {isAuthenticated ? (
                      <button
                        onClick={() => setIsReviewModalOpen(true)}
                        className="rounded-2xl bg-zinc-900 px-8 py-3.5 font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition hover:scale-105 active:scale-95"
                      >
                        Viết đánh giá ngay
                      </button>
                    ) : (
                      <button
                        onClick={() => alert('Vui lòng đăng nhập để viết đánh giá.')}
                        className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-8 py-3.5 font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                      >
                        <LockClosedIcon className="h-4 w-4" />
                        Đăng nhập để đánh giá
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        shopId={id}
        shopName={shop.name}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}
