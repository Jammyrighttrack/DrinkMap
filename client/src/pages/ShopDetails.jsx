import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Globe,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Share2,
  Star,
  Coffee,
} from 'lucide-react';

import { RatingStars } from '../components/ui/RatingStars';
import { ShopMenuList } from '../features/shops/components/ShopMenuList';
import {
  clearSelectedShop,
  fetchShopDetail,
  selectDetailStatus,
  selectSelectedShop,
  selectShopsError,
} from '../features/shops/shopsSlice';

const TAB_CONFIG = [
  { id: 'menu', label: 'Menu', icon: Coffee },
  { id: 'about', label: 'Thong tin', icon: Info },
  { id: 'reviews', label: 'Danh gia', icon: MessageSquare },
];

const getCategoryText = (shop) => {
  if (Array.isArray(shop?.category) && shop.category.length > 0) {
    return shop.category.join(', ');
  }

  if (typeof shop?.category === 'string' && shop.category.trim() !== '') {
    return shop.category;
  }

  return 'Beverage Shop';
};

const normalizeMenuItems = (menu) => {
  if (!Array.isArray(menu)) {
    return [];
  }

  return menu.map((item, index) => ({
    id: item.id || item._id || `${item.name || 'menu'}-${index}`,
    name: item.name || 'Unnamed item',
    category: item.category || 'Menu',
    price: item.price || item.formattedPrice || 'Dang cap nhat',
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
    low: '$',
    medium: '$$',
    high: '$$$',
  };

  return {
    ...shop,
    rating: shop.average_rating ?? shop.rating ?? 0,
    reviewCount: shop.total_reviews ?? shop.reviewCount ?? 0,
    categoryText: getCategoryText(shop),
    isOpen: shop.is_active !== false,
    closingTime: shop.opening_hours || '22:00',
    priceRange: priceLabel[shop.price_range || shop.priceRange] || '$$',
    description: shop.description || 'Thong tin quan dang duoc cap nhat.',
    address: shop.address || 'Dang cap nhat dia chi.',
    website: shop.website || '',
    phone: shop.phone || '',
    images: heroImages,
    menu: normalizeMenuItems(shop.menu),
    reviews: Array.isArray(shop.reviews) ? shop.reviews : [],
  };
};

const formatErrorText = (error) => {
  if (!error) {
    return 'Khong tai duoc chi tiet quan.';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error?.detail === 'string') {
    return error.detail;
  }

  return 'Khong tai duoc chi tiet quan.';
};

export default function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedShop = useSelector(selectSelectedShop);
  const detailStatus = useSelector(selectDetailStatus);
  const error = useSelector(selectShopsError);

  const [activeTab, setActiveTab] = useState('menu');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    dispatch(fetchShopDetail(id));

    return () => {
      dispatch(clearSelectedShop());
    };
  }, [dispatch, id]);

  const shop = useMemo(() => {
    if (!selectedShop || selectedShop.id !== id) {
      return null;
    }

    return normalizeShopDetails(selectedShop);
  }, [id, selectedShop]);

  const isLoading = detailStatus === 'loading' && !shop;
  const hasError = detailStatus === 'failed' && !shop;
  const heroImage = shop?.images?.[0];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
          <h2 className="mt-5 text-lg font-bold text-zinc-900">Dang tai chi tiet quan</h2>
          <p className="mt-2 text-sm text-zinc-500">DrinkMap AI dang lay du lieu thuc tu backend.</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-500">Shop detail error</p>
          <h1 className="mt-3 text-2xl font-bold text-zinc-900">Khong mo duoc trang chi tiet quan</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{formatErrorText(error)}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Quay lai ban do
            </button>
            <button
              onClick={() => dispatch(fetchShopDetail(id))}
              className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Thu tai lai
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
    <div className="min-h-screen bg-zinc-50 pb-24 lg:pb-0">
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
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30">
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFavorite((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-0 sm:px-6">
        <div className="overflow-hidden rounded-t-[32px] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:rounded-b-2xl sm:rounded-t-3xl sm:shadow-xl">
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
                {shop.isOpen ? 'Dang mo cua' : 'Da dong cua'}
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-lg bg-yellow-50 px-2.5 py-1">
                <span className="text-sm font-bold text-yellow-700">{shop.rating.toFixed(1)}</span>
                <RatingStars rating={shop.rating} size="sm" readOnly />
                <span className="cursor-pointer text-xs font-semibold text-yellow-700/80">
                  ({shop.reviewCount})
                </span>
              </div>

              <div className="h-1 w-1 rounded-full bg-zinc-300" />

              <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-600">
                <Clock className="h-4 w-4 text-zinc-400" />
                <span>{shop.isOpen ? `Dong cua luc ${shop.closingTime}` : 'Dang cap nhat gio mo cua'}</span>
              </div>

              <div className="h-1 w-1 rounded-full bg-zinc-300" />
              <div className="text-sm font-medium text-zinc-600">{shop.priceRange}</div>
            </div>

            <div className="flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95">
                <Navigation className="h-5 w-5" />
                Chi duong
              </button>
              <button className="flex w-14 items-center justify-center rounded-[14px] border border-zinc-200 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 active:scale-95">
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="sticky top-0 z-20 border-b border-zinc-100 bg-white/95 backdrop-blur-xl">
            <div className="flex px-2 sm:px-6">
              {TAB_CONFIG.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex flex-1 items-center justify-center gap-2 py-4 text-[13px] font-bold transition-colors sm:text-sm ${isActive ? 'text-blue-600' : 'text-zinc-500 hover:text-zinc-800'}`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

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
                  <h3 className="mb-2.5 text-lg font-extrabold text-zinc-900">Ve {shop.name}</h3>
                  <p className="text-[15px] leading-relaxed text-zinc-600">{shop.description}</p>
                </div>

                <hr className="border-zinc-200" />

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="pt-0.5">
                      <h4 className="text-sm font-bold text-zinc-900">Dia chi</h4>
                      <p className="mt-0.5 text-[15px] font-medium text-zinc-600">{shop.address}</p>
                    </div>
                  </div>

                  {shop.website && (
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100">
                        <Globe className="h-5 w-5 text-zinc-600" />
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-sm font-bold text-zinc-900">Website</h4>
                        <a
                          href={shop.website.startsWith('http') ? shop.website : `https://${shop.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-block text-[15px] font-bold text-blue-600 hover:underline"
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
                        <h3 className="text-lg font-extrabold text-zinc-900">Anh quan</h3>
                        <span className="text-[13px] font-bold text-zinc-500">
                          {shop.images.length} anh
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
                {shop.reviews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-zinc-900">{shop.rating.toFixed(1)}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Dua tren {shop.reviewCount} danh gia
                        </div>
                      </div>
                      <button className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                        Viet danh gia
                      </button>
                    </div>

                    {shop.reviews.map((review, index) => (
                      <div key={review.id || `${review.user}-${index}`} className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-zinc-900">{review.user || 'Anonymous'}</span>
                          <span className="text-xs text-zinc-400">{review.date || 'Moi day'}</span>
                        </div>
                        <div className="flex text-yellow-500">
                          {[...Array(5)].map((_, starIndex) => (
                            <Star
                              key={starIndex}
                              className={`h-3.5 w-3.5 ${starIndex < (review.rating || 0) ? 'fill-current' : 'text-zinc-300'}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm leading-relaxed text-zinc-700">{review.text || review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl" />
                      <div className="relative flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-sm">
                        <Star className="h-8 w-8 rotate-6 fill-yellow-500 text-yellow-500" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-xl font-extrabold text-zinc-900">Chua co danh gia</h3>
                    <p className="mb-8 max-w-sm text-[15px] leading-relaxed text-zinc-500">
                      Luong reviews se duoc noi tiep o phase tiep theo. Trang nay da san sang de nhan review that tu backend.
                    </p>
                    <button className="rounded-2xl bg-zinc-900 px-8 py-3.5 font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition hover:scale-105 active:scale-95">
                      Viet danh gia
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
