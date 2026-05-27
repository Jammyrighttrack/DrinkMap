import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  User, Settings, Heart, Coffee, Star, MapPin, 
  LogOut, ChevronRight, Award, Edit3, Shield, Bell
} from 'lucide-react';

// Shared & Feature Components
import { ShopInfoCard } from '../features/shops/components/ShopInfoCard';

// MOCK DATA
const MOCK_USER = {
  id: 'u1',
  fullName: 'Nguyễn Văn A',
  email: 'nguyenvana@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  joinDate: 'Tháng 10, 2023',
  points: 1250,
  level: 'Coffee Enthusiast',
  favoritesCount: 12,
  reviewsCount: 8,
};

const MOCK_FAVORITES = [
  {
    id: 's1',
    name: 'The Vintage Roasters',
    rating: 4.8,
    reviewCount: 324,
    category: 'Specialty Coffee',
    distance: '1.2 km',
    isOpen: true,
    closingTime: '22:00',
    address: '123 Artisan St, District 1',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400',
    isFavorite: true,
  },
  {
    id: 's2',
    name: 'Zen Tea House',
    rating: 4.6,
    reviewCount: 156,
    category: 'Tea House',
    distance: '2.5 km',
    isOpen: true,
    closingTime: '23:00',
    address: '45 Tranquil Ln, District 3',
    image: 'https://images.unsplash.com/photo-1576092762791-dd9e2220afa1?auto=format&fit=crop&q=80&w=400',
    isFavorite: true,
  }
];

const TABS = [
  { id: 'favorites', label: 'Quán Yêu Thích', icon: Heart },
  { id: 'taste', label: 'Khẩu Vị (Taste Profile)', icon: Coffee },
  { id: 'reviews', label: 'Lịch sử đánh giá', icon: Star },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('favorites');
  const { currentUser } = useSelector((state) => state.auth);
  
  // Trộn dữ liệu user thật từ Redux với các trường giả (MOCK) cho đủ UI
  const user = {
    ...MOCK_USER,
    ...currentUser,  
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-24 lg:pb-0">
      
      {/* 1. Header / Top Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">Profile</h1>
        <button className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors">
          <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
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
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 dark:opacity-20 pointer-events-none" />
            
            {/* Avatar */}
            <div className="relative mb-4 mt-2">
              <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-zinc-900 shadow-xl shadow-blue-900/10 z-10 relative">
                <img src={user.avatar} alt={user.fullName} className="w-full h-full rounded-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900 hover:scale-110 active:scale-95 transition-transform z-20">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-1">{user.fullName}</h2>
            <p className="text-[13px] text-zinc-500 font-medium mb-4">{user.email}</p>

            {/* Level Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 rounded-full text-xs font-bold border border-amber-100 dark:border-amber-900/30 mb-6 shadow-sm">
              <Award className="w-4 h-4" />
              <span>{user.level}</span>
            </div>

            {/* Quick Stats */}
            <div className="flex w-full justify-between items-center px-4 py-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col items-center flex-1 border-r border-zinc-200 dark:border-zinc-800">
                <span className="text-xl font-black text-zinc-900 dark:text-white mb-0.5">{user.points}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Điểm thưởng</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-black text-blue-600 dark:text-blue-400 mb-0.5">{user.reviewsCount}</span>
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
              { label: 'Thông tin cá nhân', icon: User },
              { label: 'Cài đặt thông báo', icon: Bell },
              { label: 'Quyền riêng tư', icon: Shield },
            ].map((item, idx) => (
              <button key={idx} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors border border-zinc-100 dark:border-zinc-800/50">
                    <item.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                  <span className="text-[15px] font-bold text-zinc-700 dark:text-zinc-200">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
              </button>
            ))}
            
            <hr className="my-2 border-zinc-100 dark:border-zinc-800" />
            
            <button className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors text-red-600 dark:text-red-400 group">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                <LogOut className="w-5 h-5" />
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
                  className={`relative flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${
                    isActive ? 'text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
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
                  <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">Đã lưu ({MOCK_FAVORITES.length})</h3>
                  <button className="text-sm font-bold text-blue-600 hover:underline">Xem trên bản đồ</button>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {MOCK_FAVORITES.map((shop) => (
                    <ShopInfoCard 
                      key={shop.id} 
                      shop={shop} 
                      onClick={() => navigate(`/shop/${shop.id}`)}
                    />
                  ))}
                </div>
                
                {/* Empty State example (commented out) 
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4"><Heart className="w-8 h-8 text-rose-300" /></div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">Chưa có quán yêu thích nào</h3>
                  <p className="text-sm text-zinc-500 max-w-xs">Hãy khám phá bản đồ và thả tim cho những quán bạn muốn lưu lại nhé.</p>
                </div>
                */}
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
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <Coffee className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Option 1 */}
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-[15px]">Độ ngọt lý tưởng</h4>
                    <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      {['0%', '30%', '50%', '100%'].map((level, i) => (
                        <button key={level} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${i === 1 ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-700' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 2 */}
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-[15px]">Bạn thường uống gì?</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Cà phê đen', 'Cà phê sữa', 'Cold Brew', 'Trà trái cây', 'Trà sữa', 'Latte/Sữa tươi'].map((type, i) => (
                        <button key={type} className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${i === 2 || i === 3 ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="w-full py-4 mt-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-black/10">
                    Lưu hồ sơ khẩu vị
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div 
                key="reviews"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-100 dark:border-zinc-800"
              >
                <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 rounded-[24px] flex items-center justify-center mb-5 rotate-6">
                  <Star className="w-10 h-10 text-yellow-500 fill-yellow-500 -rotate-6" />
                </div>
                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mb-2">Chưa có đánh giá nào</h3>
                <p className="text-[15px] text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
                  Trải nghiệm các quán cà phê và chia sẻ nhận xét của bạn để nhận thêm điểm thưởng nhé!
                </p>
                <button className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors">
                  Khám phá quán mới ngay
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
