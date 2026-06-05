import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { MapIcon, SparklesIcon, CurrencyDollarIcon, ViewfinderCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { updateFilters, selectShopsFilters } from '../features/shops/shopsSlice';
import useGeolocation from '../features/map/hooks/useGeolocation';

const BEVERAGE_TYPES = [
    { id: 'date', label: 'Date lãng mạn', icon: '💕', desc: 'Ấm cúng, riêng tư & lãng mạn', color: 'from-rose-500 to-pink-600 shadow-rose-500/20' },
    { id: 'work', label: 'Working space', icon: '💻', desc: 'Yên tĩnh, wifi mạnh & tập trung', color: 'from-emerald-500 to-indigo-600 shadow-emerald-500/20' },
    { id: 'delicious', label: 'Đồ uống ngon', icon: '🍹', desc: 'Signature đỉnh cao & đậm vị', color: 'from-amber-500 to-emerald-600 shadow-amber-500/20' },
    { id: 'chill', label: 'View đẹp & chill', icon: '🌅', desc: 'Góc chụp ảnh đẹp & hoàng hôn', color: 'from-violet-500 to-purple-600 shadow-purple-500/20' },
    { id: 'classic', label: 'Cổ điển', icon: '🏮', desc: 'Nhạc nhẹ, hoài niệm & ấm cúng', color: 'from-red-500 to-emerald-600 shadow-red-500/20' },
    { id: 'modern', label: 'Hiện đại', icon: '⚡', desc: 'Tối giản, năng động & trẻ trung', color: 'from-cyan-500 to-emerald-600 shadow-cyan-500/20' },
];

const PRICE_RANGES = [
    { id: null, label: 'Tất cả', desc: 'Mọi phân khúc' },
    { id: 1, label: '$ Thấp', desc: 'Tiết kiệm' },
    { id: 2, label: '$$ Vừa', desc: 'Hợp lý' },
    { id: 3, label: '$$$ Cao', desc: 'Sang chảnh' }
];

const FilterSelectionPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const filters = useSelector(selectShopsFilters);
    const { location, error: locationError, requestLocation } = useGeolocation();
   
    // Local state initialized from Redux state
    const [beverageTypes, setBeverageTypes] = useState(filters.beverage_types || '');
    const [priceRange, setPriceRange] = useState(filters.price_range || null);
    const [radiusKm, setRadiusKm] = useState(filters.radius_km || 5.0);

    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    const handleSearch = () => {
        // Lưu các lựa chọn vào Redux store
        dispatch(updateFilters({
            beverage_types: beverageTypes,
            price_range: priceRange,
            radius_km: radiusKm,
            lat: location?.lat || 21.0285, // Mặc định Hà Nội nếu GPS lỗi
            lng: location?.lng || 105.8542
        }));

        // Chuyển hướng sang trang bản đồ hiển thị kết quả
        navigate('/map');
    };

    return (
        <div className="relative min-h-screen bg-zinc-950 overflow-y-auto flex flex-col items-center justify-center font-sans text-zinc-100 py-12 px-4 select-none">
            {/* Background Image of Cozy Cafe - clear & high quality */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80 pointer-events-none"
                style={{
                    backgroundImage: `url('/cafe_bg.png')`,
                }}
            />
            {/* Dark overlay for readability - transparent enough to show image details */}
            <div className="absolute inset-0 z-0 bg-zinc-950/45 pointer-events-none" />

            {/* Lớp nền Neon Blur mượt mà, chuyển động chậm */}
            <div className="absolute top-[5%] left-[10%] w-[45%] h-[45%] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[5%] right-[10%] w-[45%] h-[45%] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

            {/* Logo góc trên bên trái */}
            <div className="absolute top-6 left-6 flex items-center gap-2.5 z-20">
                <div className="flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-2xl p-2.5 shadow-lg shadow-emerald-500/20">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                        <line x1="6" x2="6" y1="2" y2="4" />
                        <line x1="10" x2="10" y1="2" y2="4" />
                        <line x1="14" x2="14" y1="2" y2="4" />
                    </svg>
                </div>
                <span className="font-black text-2xl tracking-wider text-white">DrinkMap</span>
            </div>

            {/* Card Trung tâm thiết kế Neon Glassmorphism - Frosted Glass */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                className="w-full max-w-3xl bg-zinc-950/15 backdrop-blur-[8px] border border-white/10 rounded-[32px] p-6 md:p-10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] relative z-10 space-y-10"
            >      
                {/* Banner tiêu đề */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">
                        <SparklesIcon className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                        Khám phá theo gu riêng
                    </div>  
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                        Bạn muốn đi đâu hôm nay?
                    </h1>
                    <p className="text-sm text-zinc-200 max-w-md mx-auto font-semibold drop-shadow-lg">
                        Chọn không gian yêu thích, mức chi tiêu và bán kính để tìm quán nước hoàn hảo dành riêng cho bạn.
                    </p>
                </div>

                {/* Tiêu chí 1: Sở thích / Không gian */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-100">
                        <span className="text-base text-emerald-400 font-bold drop-shadow">01 /</span>
                        <h3 className="font-extrabold text-sm uppercase tracking-widest text-white drop-shadow-lg">Chọn sở thích & Không gian</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {BEVERAGE_TYPES.map((type) => {
                            const isActive = beverageTypes === type.id;
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => setBeverageTypes(isActive ? '' : type.id)}
                                    className={`
                    group relative flex flex-col items-start p-5 rounded-2xl border text-left transition-all duration-300 overflow-hidden cursor-pointer backdrop-blur-sm
                    ${isActive
                                            ? `bg-gradient-to-br ${type.color} text-white border-transparent shadow-xl scale-[1.03]`
                                            : 'bg-zinc-950/10 text-zinc-200 border-white/10 hover:border-white/20 hover:bg-zinc-900/30 hover:scale-[1.01]'
                                        }
                  `}
                                >
                                    <div className="flex justify-between items-center w-full mb-3">
                                        <span className="text-3xl filter drop-shadow-md group-hover:scale-110 transition-transform">{type.icon}</span>
                                        {isActive && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                                        )}
                                    </div>
                                    <span className={`text-[15px] font-extrabold mb-1 tracking-tight drop-shadow-md ${isActive ? 'text-white' : 'text-white'}`}>
                                        {type.label}
                                    </span>
                                    <span className={`text-[11px] font-semibold leading-relaxed drop-shadow ${isActive ? 'text-white/80' : 'text-zinc-300 group-hover:text-zinc-200'}`}>
                                        {type.desc}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
         
                {/* Hai cột tiêu chí phụ: Mức giá & Bán kính */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                    {/* Tiêu chí 2: Mức giá */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-100">
                            <span className="text-base text-emerald-400 font-bold drop-shadow">02 /</span>
                            <h3 className="font-extrabold text-sm uppercase tracking-widest text-white drop-shadow-lg">Mức chi tiêu (Giá cả)</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {PRICE_RANGES.map((price) => {
                                const isActive = priceRange === price.id;
                                return (
                                    <button
                                        key={price.id === null ? 'all' : price.id}
                                        onClick={() => setPriceRange(price.id)}
                                        className={`
                      flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer backdrop-blur-sm
                      ${isActive
                                                ? 'bg-zinc-800 text-emerald-400 border-emerald-500/50 shadow-md shadow-emerald-500/5 scale-[1.02]'
                                                : 'bg-zinc-950/10 text-zinc-300 border-white/10 hover:border-white/20 hover:text-white'
                                            }
                    `}
                                    >
                                        <span className="text-[13px] font-extrabold mb-0.5 drop-shadow">{price.label}</span>
                                        <span className="text-[10px] text-zinc-300 font-semibold drop-shadow">{price.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tiêu chí 3: Bán kính tìm kiếm */}
                    <div className="space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">  
                            <div className="flex justify-between items-center text-zinc-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-base text-emerald-400 font-bold drop-shadow">03 /</span>
                                    <h3 className="font-extrabold text-sm uppercase tracking-widest text-white drop-shadow-lg">Bán kính tìm kiếm</h3>
                                </div>
                                <span className="text-xs font-black px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/30 shadow-inner backdrop-blur-sm">
                                    {radiusKm} km
                                </span>
                            </div>
                            <div className="space-y-3 pt-2">
                                <input
                                    type="range"
                                    min="1.0"
                                    max="20.0"
                                    step="1.0"
                                    value={radiusKm}
                                    onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-zinc-900/60 rounded-full appearance-none cursor-pointer accent-emerald-500 border border-white/10"
                                />
                                <div className="flex justify-between text-[9px] text-zinc-300 font-extrabold uppercase tracking-wider drop-shadow">
                                    <span>Gần (1 km)</span>
                                    <span>Xa (20 km)</span>
                                </div>
                            </div>
                        </div>

                        {/* GPS Status Info */}
                        <div className="bg-zinc-950/10 backdrop-blur-sm border border-white/10 rounded-xl p-3.5 text-center flex items-center justify-center min-h-[48px]">
                            {locationError ? (
                                <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5 drop-shadow-md">
                                    <span>⚠️</span>
                                    <span>Đang dùng định vị mặc định (Hà Nội)</span>
                                </div>
                            ) : location ? (
                                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 drop-shadow-md">
                                    <MapIcon className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                                    <span>Vị trí của bạn đã được kết nối</span>
                                </div>
                            ) : (
                                <div className="text-[11px] text-zinc-300 font-semibold animate-pulse flex items-center gap-1.5 drop-shadow-md">
                                    <div className="w-2 h-2 rounded-full bg-zinc-300 animate-ping" />
                                    <span>Đang dò tìm tọa độ GPS...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Nút hành động chính */}
                <div className="pt-4">
                    <button
                        onClick={handleSearch}
                        className="w-full py-4.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-rose-600 hover:from-emerald-600 hover:to-rose-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_8px_30px_rgba(249,115,22,0.35)] hover:shadow-[0_12px_40px_rgba(249,115,22,0.55)] hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 group cursor-pointer"
                    >
                        <MapIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500 ease-out" />
                        Khám Phá Bản Đồ Ngay  
                    </button> 
                </div>  
            </motion.div>  
        </div>  
    );   
};   
         
export default FilterSelectionPage;

