import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TasteProfileBar from '../../features/search/components/TasteProfileBar';

const Sidebar = ({ isOpen, onClose, activeItem, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const menuItems = [
    { id: 'explore', label: 'Khám phá', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'trending', label: 'Thịnh hành', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'saved', label: 'Đã lưu', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
    { id: 'favourite', label: 'Yêu thích', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  ];

  return (
    <>
      {/* 
        Overlay đen mờ khi Sidebar mở ra (Áp dụng cho mọi loại màn hình khi Sidebar đóng vai trò như Drawer)
      */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* 
        Container Sidebar chính: 
        - Mobile/Tablet: Bị giấu đi (-translate-x-full), chỉ chui ra khi isOpen = true
        - Desktop (lg): Luôn luôn trượt ra hoặc nằm cố định (tuỳ vào thiết kế Layout)
      */}
      <aside
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-72 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out shadow-xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full overflow-y-auto pt-4 pb-20 lg:pb-4">

          {/* Menu Sections */}
          <div className="flex-1 px-4 space-y-1.5">
            <h4 className="px-2 mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
              Bảng điều khiển
            </h4>

            {menuItems.map((item) => {
              const isSelected = activeItem === item.id;

              return (
                <div key={item.id} className="mb-1">
                  <button
                    onClick={() => {
                      if (isSelected) {
                        setIsExpanded(!isExpanded);
                      } else {
                        setIsExpanded(true);
                        if (onNavigate) onNavigate(item.id);
                      }

                      // Chỉ đóng trên mobile nếu chọn mục khác
                      if (window.innerWidth < 1024 && !isSelected && onClose) onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all group
                      ${isSelected
                        ? isExpanded
                          ? 'bg-orange-50 text-orange-600 rounded-t-2xl'
                          : 'bg-orange-50 text-orange-600 rounded-lg'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 rounded-lg'
                      }
                    `}
                  >
                    <svg
                      className={`w-5 h-5 ${isSelected ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isSelected ? 2.5 : 2} d={item.icon} />
                    </svg>
                    {item.label}

                    {/* Badge nhỏ thông báo nếu cần (Giả lập cho mục saved) */}
                    {item.id === 'saved' && (
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isSelected ? 'bg-orange-200 text-orange-700' : 'bg-orange-100 text-orange-600'} ${!isSelected || !isExpanded ? 'ml-auto' : 'ml-2'}`}>
                        3
                      </span>
                    )}

                    {/* Hiển thị Chevron cho mục đang chọn */}
                    {isSelected && (
                      <svg
                        className={`w-4 h-4 ml-auto text-orange-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* Render Accordion Content */}
                  {isSelected && (
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-0 overflow-hidden overflow-y-auto"
                        >
                          {item.id === 'explore' && <TasteProfileBar />}

                          {item.id === 'trending' && (
                            <div className="w-full p-4 bg-orange-50 rounded-b-2xl">
                              <div className="bg-white/50 border border-orange-100 rounded-xl p-4 text-center">
                                <p className="text-sm font-medium text-orange-800">Top các quán nổi bật</p>
                                <p className="text-xs text-orange-600 mt-1">Sắp xếp theo đánh giá cao nhất</p>
                              </div>
                            </div>
                          )}

                          {item.id === 'saved' && (
                            <div className="w-full p-4 bg-orange-50 rounded-b-2xl">
                              <div className="bg-white/50 border border-orange-100 rounded-xl p-4 text-center">
                                <p className="text-sm font-medium text-orange-800">Chưa có kết nối mạng</p>
                                <p className="text-xs text-orange-600 mt-1">Quá trình Tích hợp Auth sắp ra mắt</p>
                              </div>
                            </div>
                          )}

                          {item.id === 'favourite' && (
                            <div className="w-full p-4 bg-orange-50 rounded-b-2xl">
                              <div className="bg-white/50 border border-orange-100 rounded-xl p-4 text-center">
                                <p className="text-sm font-medium text-orange-800">Khoảng trống yêu thích</p>
                                <p className="text-xs text-orange-600 mt-1">Chưa thả tim địa điểm nào</p>
                              </div>
                            </div>
                          )}

                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer of Sidebar */}
          <div className="p-4 mx-4 mt-auto rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
            <div className="flex bg-orange-100 p-2.5 w-10 h-10 rounded-full mb-3 items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <h5 className="text-sm font-bold text-orange-800 mb-1">DrinkMap Pro</h5>
            <p className="text-xs text-orange-600/80 leading-relaxed mb-3">
              Mở khóa thuật toán AI dự đoán chính xác gu đồ uống của bạn đến 36%.
            </p>
            <button className="w-full text-xs font-bold text-white bg-orange-600 rounded-lg py-2 hover:bg-orange-700 transition-colors">
              Nâng cấp ngay
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
