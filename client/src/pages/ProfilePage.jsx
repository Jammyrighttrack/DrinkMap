import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { UserIcon, Cog6ToothIcon, HeartIcon, BuildingStorefrontIcon, StarIcon, MapPinIcon, ArrowRightOnRectangleIcon, ChevronRightIcon, TrophyIcon, PencilSquareIcon, ShieldExclamationIcon, BellIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

// Shared & Feature Components
import { ShopInfoCard } from '../features/shops/components/ShopInfoCard';
import { userApi } from '../features/auth/authApi';
import {
  updatePreferencesApi,
  toggleFavoriteApi,
  logoutApi,
  updateProfileApi,
  updateSettingsApi,
  deleteAccountApi
} from '../features/auth/authSlice';
import {
  fetchMyReviews,
  deleteReview,
  selectMyReviews,
  selectMyReviewsLoading,
} from '../features/review/reviewsSlice';

const TABS = [
  { id: 'favorites', label: 'Quán Yêu Thích', icon: HeartIcon },
  { id: 'taste', label: 'Khẩu Vị (Taste Profile)', icon: BuildingStorefrontIcon },
  { id: 'reviews', label: 'Lịch sử đánh giá', icon: StarIcon },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('favorites');
  const { currentUser } = useSelector((state) => state.auth);

  // Real data state
  const [favorites, setFavorites] = useState([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [isTasteSaving, setIsTasteSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Real reviews data from Redux
  const myReviews = useSelector(selectMyReviews);
  const myReviewsLoading = useSelector(selectMyReviewsLoading);

  // Settings & Profile local states
  const [editedName, setEditedName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [notifyNewShops, setNotifyNewShops] = useState(true);
  const [notifyAiMessages, setNotifyAiMessages] = useState(true);
  const [notifyPromotions, setNotifyPromotions] = useState(true);
  const [isAnonymousReviews, setIsAnonymousReviews] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchSavedShops = async () => {
    setIsFavoritesLoading(true);
    try {
      const data = await userApi.getSavedShops();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to get saved shops:', err);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'favorites') {
      fetchSavedShops();
    }
    if (activeTab === 'reviews') {
      dispatch(fetchMyReviews());
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.taste_preferences) {
        setSelectedPreferences(currentUser.taste_preferences);
      }
      setEditedName(currentUser.full_name || currentUser.fullName || '');
      setNotifyNewShops(currentUser.notify_new_shops !== false);
      setNotifyAiMessages(currentUser.notify_ai_messages !== false);
      setNotifyPromotions(currentUser.notify_promotions !== false);
      setIsAnonymousReviews(!!currentUser.is_anonymous_reviews);
    }
  }, [currentUser]);

  const handleToggleFavorite = async (shopId) => {
    try {
      await dispatch(toggleFavoriteApi(shopId)).unwrap();
      fetchSavedShops();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const SWEETNESS_LEVELS = ['0% ngọt', '30% ngọt', '50% ngọt', '100% ngọt'];
  const BEVERAGE_TYPES = ['Cà phê đen', 'Cà phê sữa', 'Cold Brew', 'Trà trái cây', 'Trà sữa', 'Latte/Sữa tươi'];

  const currentSweetness = selectedPreferences.find(p => SWEETNESS_LEVELS.includes(p)) || '50% ngọt';

  const handleSweetnessClick = (level) => {
    const filtered = selectedPreferences.filter(p => !SWEETNESS_LEVELS.includes(p));
    setSelectedPreferences([...filtered, level]);
  };

  const handleBeverageTypeClick = (type) => {
    if (selectedPreferences.includes(type)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== type));
    } else {
      setSelectedPreferences([...selectedPreferences, type]);
    }
  };

  const handleSaveTasteProfile = async () => {
    setIsTasteSaving(true);
    try {
      await dispatch(updatePreferencesApi(selectedPreferences)).unwrap();
      setSaveMessage('Đã cập nhật hồ sơ khẩu vị thành công!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update taste preferences:', err);
      setSaveMessage('Lỗi khi cập nhật sở thích!');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsTasteSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editedName.trim()) {
      setProfileMessage('Họ và tên không được để trống.');
      return;
    }
    setIsProfileSaving(true);
    setProfileMessage('');
    try {
      await dispatch(updateProfileApi({ full_name: editedName })).unwrap();
      setProfileMessage('Đã cập nhật thông tin thành công!');
      setIsEditingName(false);
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setProfileMessage(err || 'Lỗi khi cập nhật thông tin.');
      setTimeout(() => setProfileMessage(''), 3000);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSettingsSaving(true);
    setSettingsMessage('');
    try {
      await dispatch(updateSettingsApi({
        notify_new_shops: notifyNewShops,
        notify_ai_messages: notifyAiMessages,
        notify_promotions: notifyPromotions,
        is_anonymous_reviews: isAnonymousReviews
      })).unwrap();
      setSettingsMessage('Đã cập nhật thiết lập thành công!');
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setSettingsMessage(err || 'Lỗi khi cập nhật thiết lập.');
      setTimeout(() => setSettingsMessage(''), 3000);
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await dispatch(deleteAccountApi()).unwrap();
      setShowDeleteConfirm(false);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err || 'Không thể xóa tài khoản, vui lòng thử lại.');
    }
  };

  const user = {
    ...currentUser,
    fullName: currentUser?.full_name || currentUser?.fullName || 'Người dùng DrinkMap',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || null,
    points: currentUser?.points || 0,
    reviewsCount: myReviews.length || currentUser?.reviews_count || currentUser?.reviewsCount || 0,
    level: currentUser?.level || 'Thành viên mới',
    favoritesCount: favorites.length
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-24 lg:pb-0">

      {/* 1. Header / Top Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">Profile</h1>
        <button className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors">
          <Cog6ToothIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-0 sm:px-6 pt-6 sm:pt-8 w-full flex flex-col md:flex-row gap-8">

        {/* =========================================
            LEFT COLUMN: User Card & Global Actions
            ========================================= */}
        <div className="w-full md:w-80 shrink-0 px-4 sm:px-0">

          {/* Main User Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-black/20 border border-zinc-100 dark:border-zinc-800 relative overflow-hidden text-center flex flex-col items-center"
          >
            {/* Background embellishment */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-emerald-500 to-indigo-600 opacity-10 dark:opacity-20 pointer-events-none" />

            {/* Avatar */}
            <div className="relative mb-4 mt-2">
              <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-zinc-900 shadow-xl shadow-emerald-900/10 z-10 relative overflow-hidden flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-inner">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 hover:scale-110 active:scale-95 transition-transform z-20">
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-1">{user.fullName}</h2>
            <p className="text-[13px] text-zinc-500 font-medium mb-4">{user.email}</p>

            {/* Level Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-900/30 mb-6 shadow-sm">
              <TrophyIcon className="w-4 h-4" />
              <span>{user.level}</span>
            </div>

            {/* Quick Stats */}
            <div className="flex w-full justify-between items-center px-4 py-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col items-center flex-1 border-r border-zinc-200 dark:border-zinc-800">
                <span className="text-xl font-black text-zinc-900 dark:text-white mb-0.5">{user.points}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Điểm thưởng</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-0.5">{user.reviewsCount}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Đánh giá</span>
              </div>
            </div>
          </motion.div>

          {/* Quick Menu Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-6 bg-white dark:bg-zinc-900 rounded-[28px] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-black/20 border border-zinc-100 dark:border-zinc-800"
          >
            {[
              { id: 'personal_info', label: 'Thông tin cá nhân', icon: UserIcon },
              { id: 'notifications', label: 'Cài đặt thông báo', icon: BellIcon },
              { id: 'privacy', label: 'Quyền riêng tư', icon: ShieldExclamationIcon },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors group ${activeTab === item.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border ${activeTab === item.id ? 'bg-white dark:bg-zinc-800 border-emerald-200 dark:border-emerald-900/50' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800/50 group-hover:bg-white dark:group-hover:bg-zinc-800'}`}>
                    <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}`} />
                  </div>
                  <span className={`text-[15px] font-bold transition-colors ${activeTab === item.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{item.label}</span>
                </div>
                <ChevronRightIcon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-600'}`} />
              </button>
            ))}

            <hr className="my-2 border-zinc-100 dark:border-zinc-800" />

            <button
              onClick={() => {
                dispatch(logoutApi());
                navigate('/');
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors text-red-600 dark:text-red-400 group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-bold">Đăng xuất</span>
            </button>
          </motion.div>
        </div>

        {/* =========================================
            RIGHT COLUMN: Tabulated Content Area
            ========================================= */}
        <div className="flex-1 px-4 sm:px-0 mt-4 md:mt-0 pb-10">

          {/* Tab Navigation */}
          <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 mb-6 overflow-x-auto scrollbar-hide shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${isActive ? 'text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="profileTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Rendering */}
          <AnimatePresence mode="wait">
            {activeTab === 'favorites' && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">Đã lưu ({favorites.length})</h3>
                  <button onClick={() => navigate('/map')} className="text-sm font-bold text-emerald-600 hover:underline">Xem trên bản đồ</button>
                </div>

                {isFavoritesLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <ArrowPathIcon className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                    <span className="text-sm text-zinc-500 font-medium">Đang tải danh sách quán...</span>
                  </div>
                ) : favorites.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {favorites.map((shop) => (
                      <ShopInfoCard
                        key={shop.id}
                        shop={{
                          ...shop,
                          isFavorite: true
                        }}
                        onClick={() => navigate(`/shop/${shop.id}`)}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mb-4"><HeartIcon className="w-8 h-8 text-rose-500 fill-rose-500" /></div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Chưa có quán yêu thích nào</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs px-4">Hãy khám phá bản đồ và thả tim cho những quán bạn muốn lưu lại nhé.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'taste' && (
              <motion.div
                key="taste"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white mb-1">Hồ sơ khẩu vị</h3>
                    <p className="text-[14px] text-zinc-500">Giúp DrinkMap gợi ý quán chuẩn gu bạn nhất</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <BuildingStorefrontIcon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Option 1 */}
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-[15px]">Độ ngọt lý tưởng</h4>
                    <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      {SWEETNESS_LEVELS.map((level) => {
                        const isActive = currentSweetness === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleSweetnessClick(level)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-[15px]">Bạn thường uống gì?</h4>
                    <div className="flex flex-wrap gap-2">
                      {BEVERAGE_TYPES.map((type) => {
                        const isActive = selectedPreferences.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleBeverageTypeClick(type)}
                            className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {saveMessage && (
                    <div className={`p-3 rounded-xl text-xs font-semibold text-center ${saveMessage.includes('Lỗi') ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200' : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 border border-green-200'}`}>
                      {saveMessage}
                    </div>
                  )}

                  <button
                    onClick={handleSaveTasteProfile}
                    disabled={isTasteSaving}
                    className="w-full py-4 mt-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTasteSaving ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : 'Lưu hồ sơ khẩu vị'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">
                    Lịch sử đánh giá ({myReviews.length})
                  </h3>
                  <button onClick={() => navigate('/map')} className="text-sm font-bold text-emerald-600 hover:underline">
                    Khám phá thêm
                  </button>
                </div>

                {myReviewsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <ArrowPathIcon className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                    <span className="text-sm text-zinc-500 font-medium">Đang tải lịch sử đánh giá...</span>
                  </div>
                ) : myReviews.length > 0 ? (
                  <div className="space-y-3">
                    {myReviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-white dark:bg-zinc-900 rounded-[20px] p-5 border border-zinc-100 dark:border-zinc-800 shadow-sm"
                      >
                        {/* Review header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => navigate(`/shop/${review.shop_id}`)}
                              className="text-sm font-bold text-emerald-600 hover:underline truncate block"
                            >
                              Xem quán →
                            </button>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < Math.round(review.rating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'fill-zinc-200 text-zinc-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-bold text-zinc-500 ml-1">{review.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-zinc-400">
                              {review.created_at
                                ? new Date(review.created_at).toLocaleDateString('vi-VN')
                                : 'Mới đây'}
                            </span>
                            <button
                              onClick={async () => {
                                if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) {
                                  dispatch(deleteReview(review.id));
                                }
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Comment */}
                        {review.comment && (
                          <p className="text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {review.comment}
                          </p>
                        )}

                        {/* Taste tags */}
                        {review.taste_tags && review.taste_tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {review.taste_tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800">
                    <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-[24px] flex items-center justify-center mb-5 rotate-6">
                      <StarIcon className="w-10 h-10 text-yellow-500 fill-yellow-500 -rotate-6" />
                    </div>
                    <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-2">Chưa có đánh giá nào</h3>
                    <p className="text-[15px] text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
                      Trải nghiệm các quán và chia sẻ nhận xét của bạn để nhận thêm điểm thưởng nhé!
                    </p>
                    <button
                      onClick={() => navigate('/map')}
                      className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors"
                    >
                      Khám phá quán mới ngay
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'personal_info' && (
              <motion.div
                key="personal_info"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-zinc-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white mb-1">Thông tin cá nhân</h3>
                    <p className="text-[14px] text-zinc-500">Xem và cập nhật thông tin chi tiết tài khoản của bạn</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6" />
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Họ và tên</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={!isEditingName}
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border rounded-2xl text-[15px] font-medium transition-all ${isEditingName
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 text-zinc-900 dark:text-white focus:outline-none'
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-not-allowed'
                          }`}
                      />
                      {!isEditingName ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-2xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <PencilSquareIcon className="w-4 h-4" /> Sửa
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingName(false);
                            setEditedName(currentUser?.full_name || currentUser?.fullName || '');
                          }}
                          className="px-4 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl transition-colors whitespace-nowrap shrink-0"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Địa chỉ Email</label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Ngày tham gia</label>
                      <input
                        type="text"
                        disabled
                        value={user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : user.joinDate}
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Nguồn tài khoản</label>
                      <span className="inline-flex px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] font-bold text-zinc-600 dark:text-zinc-400 w-full capitalize">
                        {user.auth_provider === 'google' ? 'Đăng nhập Google' : 'Đăng nhập Email'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Cấp bậc tài khoản</label>
                      <span className="inline-flex px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[15px] font-bold text-zinc-600 dark:text-zinc-400 w-full capitalize">
                        {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                      </span>
                    </div>
                  </div>

                  {profileMessage && (
                    <div className={`p-3 rounded-xl text-xs font-semibold text-center border ${profileMessage.includes('Lỗi') ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-200/50' : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 border-green-200/50'}`}>
                      {profileMessage}
                    </div>
                  )}

                  {isEditingName && (
                    <button
                      type="submit"
                      disabled={isProfileSaving}
                      className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isProfileSaving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Lưu thay đổi'}
                    </button>
                  )}
                </form>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-zinc-100 dark:border-zinc-800 space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white mb-1">Cài đặt thông báo</h3>
                    <p className="text-[14px] text-zinc-500">Tùy chọn cách thức nhận thông báo từ DrinkMap</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <BellIcon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Thông báo quán mới gần đây</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Nhận thông báo khi phát hiện quán nước mới chất lượng gần bạn</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyNewShops(!notifyNewShops)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${notifyNewShops ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${notifyNewShops ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Gợi ý từ trợ lý ảo AI</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Nhận thông báo khi Gemini AI có đề xuất quán nước phù hợp với khẩu vị của bạn</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyAiMessages(!notifyAiMessages)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${notifyAiMessages ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${notifyAiMessages ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Tin tức và Ưu đãi đặc biệt</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Cập nhật các chương trình ưu đãi, giảm giá đặc quyền qua email</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotifyPromotions(!notifyPromotions)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${notifyPromotions ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${notifyPromotions ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {settingsMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold text-center border ${settingsMessage.includes('Lỗi') ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-200/50' : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 border-green-200/50'}`}>
                    {settingsMessage}
                  </div>
                )}

                <button
                  onClick={handleSaveSettings}
                  disabled={isSettingsSaving}
                  className="w-full py-4 mt-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSettingsSaving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Lưu cài đặt thông báo'}
                </button>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-zinc-100 dark:border-zinc-800 space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white mb-1">Quyền riêng tư</h3>
                    <p className="text-[14px] text-zinc-500">Quản lý bảo mật thông tin và chế độ riêng tư của tài khoản</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                    <ShieldExclamationIcon className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex-1 pr-4">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Viết đánh giá ẩn danh</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Khi bật, tất cả các review mới của bạn sẽ được hiển thị dưới tên "Người dùng ẩn danh"</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAnonymousReviews(!isAnonymousReviews)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isAnonymousReviews ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isAnonymousReviews ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {settingsMessage && (
                  <div className={`p-3 rounded-xl text-xs font-semibold text-center border ${settingsMessage.includes('Lỗi') ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border-red-200/50' : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 border-green-200/50'}`}>
                    {settingsMessage}
                  </div>
                )}

                <button
                  onClick={handleSaveSettings}
                  disabled={isSettingsSaving}
                  className="w-full py-4 mt-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSettingsSaving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 'Lưu thiết lập quyền riêng tư'}
                </button>

                {/* Danger Zone */}
                <div className="mt-8 border border-red-200 dark:border-red-900/30 rounded-2xl p-5 bg-red-50/10 dark:bg-red-950/5">
                  <h4 className="font-extrabold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2 text-sm">
                    ⚠️ Vùng nguy hiểm
                  </h4>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                    Xóa tài khoản cá nhân là hành động vĩnh viễn và không thể khôi phục lại. Toàn bộ thông tin hồ sơ, các quán đã lưu và lịch sử đánh giá sẽ biến mất hoàn toàn.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-red-600/10 active:scale-95"
                  >
                    Xóa tài khoản vĩnh viễn
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Account Deletion Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="relative bg-white dark:bg-zinc-900 rounded-[28px] p-6 max-w-md w-full border border-zinc-100 dark:border-zinc-800 shadow-2xl z-10 space-y-6"
                >
                  <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white">Xác nhận xóa tài khoản</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Bạn có chắc chắn muốn xóa tài khoản của mình? Hành động này sẽ xóa vĩnh viễn mọi dữ liệu cá nhân của bạn trên DrinkMap và không thể khôi phục lại.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-600/10"
                    >
                      Đồng ý xóa
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
