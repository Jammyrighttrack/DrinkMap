import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation, useDragControls } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { XMarkIcon, MapPinIcon, ClockIcon, PhoneIcon, PaperAirplaneIcon, BookmarkIcon, ShareIcon, StarIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, GlobeAltIcon, BuildingStorefrontIcon, InformationCircleIcon, LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import * as Tabs from '@radix-ui/react-tabs';
import { RatingStars } from '@/components/ui/RatingStars';
import { useMapStore } from '../../../store/useMapStore';
import { favouritesApi } from '../../review/reviewsApi';
import {
  fetchShopReviews,
  selectShopReviews,
  selectShopReviewsLoading,
} from '../../review/reviewsSlice';
import { WriteReviewModal } from '../../review/components/WriteReviewModal';
import {
  fetchShopDetail,
  selectDetailStatus,
} from '../shopsSlice';
import { ShopMenuList } from './ShopMenuList';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return 'Mới đây';
  try {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return 'Mới đây';
  }
};

/** Chuẩn hoá mảng menu từ backend về format hiển thị */
const normalizeMenu = (rawMenu) => {
  if (!Array.isArray(rawMenu)) return [];
  return rawMenu.map((item, i) => ({
    id: item.id || item._id || `menu-${i}`,
    name: item.name || 'Món không tên',
    category: item.category || 'Thực đơn',
    price: item.price || item.formattedPrice || 'Đang cập nhật',
    desc: item.desc || item.description || '',
    image: item.image || item.thumbnail || null,
    recommended: Boolean(item.recommended),
  }));
};

/** Nhóm menu items theo category */
const groupByCategory = (items) => {
  const map = {};
  items.forEach((item) => {
    const cat = item.category || 'Thực đơn';
    if (!map[cat]) map[cat] = [];
    map[cat].push(item);
  });
  return map;
};

// ─── component ──────────────────────────────────────────────────────────────

export function ShopBottomSheet({
  isOpen,
  onClose,
  shop = null,
  isModal = false,
  userLocation = null,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const data = shop;
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Drag & animation
  const controls = useAnimation();
  const dragControls = useDragControls();
  const scrollContainerRef = useRef(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Favourite
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [localReviewCount, setLocalReviewCount] = useState(null);

  // Reviews from Redux
  const shopReviews = useSelector(selectShopReviews(data?.id || ''));
  const reviewsLoading = useSelector(selectShopReviewsLoading);
  const detailStatus = useSelector(selectDetailStatus);

  // Map routing
  const setActiveRoute = useMapStore((state) => state.setActiveRoute);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  // ── normalised menu ─────────────────────────────────────────────────────
  const menuItems = normalizeMenu(data?.menu);
  const menuByCategory = groupByCategory(menuItems);

  // rating & review count
  const rating = data?.average_rating ?? data?.rating ?? 0;
  const reviewCount = localReviewCount !== null
    ? localReviewCount
    : (data?.total_reviews ?? data?.reviewCount ?? 0);

  // ── effects ─────────────────────────────────────────────────────────────

  // Reset tabs when sheet opens for a new shop
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
      setLocalReviewCount(null);
    }
  }, [isOpen, data?.id]);

  // Fetch full shop detail when open
  useEffect(() => {
    if (isOpen && data?.id) {
      dispatch(fetchShopDetail(data.id));
    }
  }, [isOpen, data?.id, dispatch]);

  // Load favourite status
  useEffect(() => {
    if (!isOpen || !data?.id || !isAuthenticated) {
      setIsFavourite(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await favouritesApi.checkFavourite(data.id);
        if (!cancelled) setIsFavourite(result.is_favourite ?? false);
      } catch { /* non-critical */ }
    })();
    return () => { cancelled = true; };
  }, [isOpen, data?.id, isAuthenticated]);

  // Load reviews when tab is switched
  useEffect(() => {
    if (activeTab === 'reviews' && data?.id) {
      dispatch(fetchShopReviews(data.id));
    }
  }, [activeTab, data?.id, dispatch]);

  // Scroll lock
  useEffect(() => {
    if (isModal && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, isModal]);

  // ── handlers ────────────────────────────────────────────────────────────

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
      return;
    }
    const shopPos = getShopPosition(data);
    if (!shopPos) { alert('Không tìm thấy tọa độ của quán nước này trên bản đồ.'); return; }

    const [shopLat, shopLng] = shopPos;
    setIsFetchingRoute(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${shopLng},${shopLat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const resData = await res.json();
      if (resData.code === 'Ok' && resData.routes?.length > 0) {
        const route = resData.routes[0];
        setActiveRoute({
          coordinates: route.geometry.coordinates.map((c) => [c[1], c[0]]),
          distance: route.distance,
          duration: route.duration,
          shopName: data.name,
        });
        onClose();
      } else {
        alert('Không tìm thấy tuyến đường phù hợp.');
      }
    } catch {
      alert('Lỗi kết nối máy chủ tìm đường. Vui lòng thử lại.');
    } finally {
      setIsFetchingRoute(false);
    }
  };

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    } else {
      controls.start({ y: 0, transition: { type: 'spring', bounce: 0.1, duration: 0.4 } });
    }
  };

  const handleOpenDetails = () => {
    if (!data?.id) return;
    onClose();
    navigate(`/shop/${data.id}`);
  };

  const handleToggleFavourite = useCallback(async () => {
    if (!isAuthenticated) { alert('Vui lòng đăng nhập để lưu quán yêu thích.'); return; }
    if (favouriteLoading || !data?.id) return;
    setFavouriteLoading(true);
    try {
      if (isFavourite) {
        await favouritesApi.removeFavourite(data.id);
        setIsFavourite(false);
      } else {
        await favouritesApi.addFavourite(data.id);
        setIsFavourite(true);
      }
    } catch (err) {
      console.error('Favourite toggle failed:', err);
    } finally {
      setFavouriteLoading(false);
    }
  }, [data?.id, isFavourite, isAuthenticated, favouriteLoading]);

  const handleReviewSuccess = useCallback(() => {
    dispatch(fetchShopReviews(data?.id));
    dispatch(fetchShopDetail(data?.id));
    setLocalReviewCount((prev) => (prev !== null ? prev + 1 : reviewCount + 1));
  }, [dispatch, data?.id, reviewCount]);

  const scrollLeft = () => scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  const scrollRight = () => scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });

  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />
          )}

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
              ${isModal
                ? 'h-[88vh] md:h-[80vh] md:max-w-2xl md:left-1/2 md:-translate-x-1/2 md:bottom-8'
                : 'h-[85vh] md:w-[400px] md:h-[calc(100vh-32px)] md:right-4 md:left-auto md:bottom-4 md:rounded-[24px]'}
              overflow-hidden
            `}
          >
            {/* Drag handle */}
            <div className="w-full h-8 flex justify-center items-center cursor-grab active:cursor-grabbing shrink-0 mt-2">
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors z-20"
            >
              <XMarkIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </button>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide">

              {/* Image Carousel */}
              {data.images && data.images.length > 0 && (
                <div className="relative group">
                  <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                    {data.images.map((img, idx) => (
                      <div key={idx} className="w-full shrink-0 h-56 sm:h-64 relative snap-center">
                        <img src={img} alt={`${data.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ))}
                  </div>
                  {data.images.length > 1 && (
                    <>
                      <button onClick={scrollLeft} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <button onClick={scrollRight} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/30 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRightIcon className="w-5 h-5" />
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
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">{data.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-bold text-zinc-900 dark:text-zinc-200">{Number(rating).toFixed(1)}</span>
                      <RatingStars rating={rating} size="sm" readOnly />
                      <span>({reviewCount})</span>
                      <span>•</span>
                      <span>{data.priceRange || data.price_range || '$$'}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Category */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                  <div className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-full ${data.isOpen || data.is_active !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    <ClockIcon className="w-3.5 h-3.5" />
                    {data.isOpen || data.is_active !== false ? `Đang mở cửa${data.closingTime ? ` · Đóng ${data.closingTime}` : ''}` : 'Hiện đã đóng cửa'}
                  </div>
                  {data.category && (
                    <div className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full font-medium">
                      {Array.isArray(data.category) ? data.category.join(', ') : data.category}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2 mt-5">
                  <button
                    onClick={handleGetDirections}
                    disabled={isFetchingRoute}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className={`w-5 h-5 shrink-0 ${isFetchingRoute ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-semibold">{isFetchingRoute ? 'Đang tìm...' : 'Chỉ đường'}</span>
                  </button>

                  <button
                    onClick={handleToggleFavourite}
                    disabled={favouriteLoading}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] transition-colors disabled:opacity-60 ${
                      isFavourite
                        ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <BookmarkIcon className={`w-5 h-5 shrink-0 transition-all ${isFavourite ? 'fill-rose-500 scale-110' : ''} ${favouriteLoading ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-semibold">{isFavourite ? 'Đã lưu' : 'Lưu quán'}</span>
                  </button>

                  {data.phone ? (
                    <a
                      href={`tel:${data.phone}`}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <PhoneIcon className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-semibold">Gọi điện</span>
                    </a>
                  ) : (
                    <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 opacity-40 cursor-not-allowed">
                      <PhoneIcon className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-semibold">Gọi điện</span>
                    </button>
                  )}

                  <button className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-[16px] bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <ShareIcon className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-semibold">Chia sẻ</span>
                  </button>
                </div>

                {data.id && (
                  <button
                    onClick={handleOpenDetails}
                    className="mt-3 w-full rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                  >
                    Xem chi tiết đầy đủ →
                  </button>
                )}
              </div>

              {/* ── Tabs ── */}
              <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mt-5 flex flex-col">
                <Tabs.List className="flex w-full border-b border-zinc-200 dark:border-zinc-800 px-5 relative">
                  {[
                    { id: 'overview', label: 'Tổng quan' },
                    { id: 'menu', label: 'Thực đơn' },
                    { id: 'reviews', label: `Đánh giá${reviewCount > 0 ? ` (${reviewCount})` : ''}` },
                  ].map((tab) => (
                    <Tabs.Trigger
                      key={tab.id}
                      value={tab.id}
                      className={`relative px-4 py-3 text-sm font-semibold outline-none whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="sheetTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <div className="px-5 py-5 pb-24 md:pb-8 space-y-0">

                  {/* ── Overview ── */}
                  <Tabs.Content value="overview" className="outline-none space-y-5">
                    <div>
                      <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-2">Giới thiệu</h3>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {data.description || 'Chưa có thông tin giới thiệu.'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-1">Thông tin</h3>
                      <div className="flex gap-3 items-start p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                        <MapPinIcon className="w-5 h-5 mt-0.5 text-zinc-400 shrink-0" />
                        <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{data.address || 'Đang cập nhật'}</p>
                      </div>
                      {data.website && (
                        <div className="flex gap-3 items-center p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50">
                          <GlobeAltIcon className="w-5 h-5 text-zinc-400 shrink-0" />
                          <a
                            href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                            target="_blank" rel="noreferrer"
                            className="text-sm text-emerald-600 dark:text-emerald-400 font-medium truncate hover:underline"
                          >
                            {data.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {Array.isArray(data.features) && data.features.length > 0 && (
                      <div>
                        <h3 className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest mb-3">Tiện ích & Dịch vụ</h3>
                        <div className="flex flex-wrap gap-2">
                          {data.features.map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              <CheckCircleIcon className="w-3.5 h-3.5 text-zinc-400" /> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Tabs.Content>

                  {/* ── Menu ── */}
                  <Tabs.Content value="menu" className="outline-none">
                    {detailStatus === 'loading' && (!data?.menu || data.menu.length === 0) ? (
                      <div className="flex justify-center py-12">
                        <ArrowPathIcon className="w-7 h-7 text-emerald-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="h-[450px] bg-white dark:bg-zinc-950 overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <ShopMenuList items={normalizeMenu(data?.menu)} />
                      </div>
                    )}
                  </Tabs.Content>

                  {/* ── Reviews ── */}
                  <Tabs.Content value="reviews" className="outline-none">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-3xl font-black text-zinc-900 dark:text-white">{Number(rating).toFixed(1)}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <RatingStars rating={rating} size="sm" readOnly />
                          <span className="text-xs text-zinc-500">({reviewCount})</span>
                        </div>
                      </div>
                      {isAuthenticated ? (
                        <button
                          onClick={() => setIsReviewModalOpen(true)}
                          className="rounded-full bg-zinc-900 dark:bg-white px-4 py-2.5 text-sm font-bold text-white dark:text-zinc-900 shadow-md transition hover:scale-105 active:scale-95"
                        >
                          Viết đánh giá
                        </button>
                      ) : (
                        <button
                          onClick={() => alert('Vui lòng đăng nhập để viết đánh giá.')}
                          className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-100 transition"
                        >
                          <LockClosedIcon className="w-3.5 h-3.5" /> Đăng nhập
                        </button>
                      )}
                    </div>

                    {/* Loading */}
                    {reviewsLoading && (
                      <div className="flex justify-center py-10">
                        <ArrowPathIcon className="w-7 h-7 text-emerald-500 animate-spin" />
                      </div>
                    )}

                    {/* Review list */}
                    {!reviewsLoading && shopReviews.length > 0 && (
                      <div className="space-y-3">
                        {shopReviews.map((review, idx) => (
                          <div key={review.id || idx} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                  {review.user_avatar
                                    ? <img src={review.user_avatar} alt="" className="w-full h-full object-cover" />
                                    : (review.user_name || 'A').charAt(0).toUpperCase()
                                  }
                                </div>
                                <div>
                                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{review.user_name || 'Người dùng'}</span>
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    {[...Array(5)].map((_, i) => (
                                      <StarIcon key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 fill-zinc-200'}`} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-zinc-400">{formatDate(review.created_at)}</span>
                            </div>

                            {review.comment && (
                              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{review.comment}</p>
                            )}

                            {review.taste_tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {review.taste_tags.map((tag) => (
                                  <span key={tag} className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
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
                      <div className="py-16 text-center flex flex-col items-center">
                        <div className="w-14 h-14 bg-yellow-50 dark:bg-yellow-900/20 rounded-[18px] flex items-center justify-center mb-4 rotate-6">
                          <StarIcon className="w-7 h-7 fill-yellow-500 text-yellow-500 -rotate-6" />
                        </div>
                        <p className="font-bold text-zinc-900 dark:text-white mb-1">Chưa có đánh giá</p>
                        <p className="text-sm text-zinc-500 mb-5">Hãy là người đầu tiên chia sẻ!</p>
                        {isAuthenticated && (
                          <button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="rounded-xl bg-zinc-900 dark:bg-white px-6 py-2.5 text-sm font-bold text-white dark:text-zinc-900 transition hover:scale-105 active:scale-95"
                          >
                            Viết đánh giá ngay
                          </button>
                        )}
                      </div>
                    )}
                  </Tabs.Content>

                </div>
              </Tabs.Root>
            </div>
          </motion.div>

          {/* Write Review Modal */}
          <WriteReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            shopId={data?.id}
            shopName={data?.name}
            onSuccess={handleReviewSuccess}
          />
        </>
      )}
    </AnimatePresence>
  );
}

export default ShopBottomSheet;
