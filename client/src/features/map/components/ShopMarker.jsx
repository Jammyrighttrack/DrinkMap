import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { BuildingStorefrontIcon, StarIcon } from '@heroicons/react/24/outline';
import { renderToStaticMarkup } from 'react-dom/server';

// Hàm tạo Icon Marker độc quyền dựa trên điểm AI Match Score
const createShopIcon = (shop, isSelected) => {
  const isHighMatch = shop.match_score >= 80;
  
  // Custom HTML chèn vào thẻ Div của Leaflet
  const iconMarkup = renderToStaticMarkup(
    <div className="relative group flex flex-col items-center justify-center">
      
      {/* Glow effect đằng sau marker nếu điểm Match cao hoặc đang được Click */}
      {(isHighMatch || isSelected) && (
        <div className={`absolute -inset-2 rounded-full blur-md opacity-40 z-0 ${isSelected ? 'bg-emerald-500' : 'bg-emerald-500'}`}></div>
      )}

      {/* Bubble Chính */}
      <div className={`
        relative z-10 flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 transition-transform
        ${isSelected 
          ? 'bg-emerald-600 border-white scale-110' 
          : isHighMatch 
            ? 'bg-gradient-to-br from-emerald-500 to-red-500 border-white' 
            : 'bg-white border-emerald-500 text-emerald-600'
        }
      `}>
        {/* Nền xanh/trắng, ruột thì đổi màu ngược lại */}
        {shop.category === 'Trà sữa' ? (
          <span className={`text-[12px] font-bold ${isSelected || isHighMatch ? 'text-white' : 'text-emerald-600'}`}>🧋</span>
        ) : (
          <BuildingStorefrontIcon className={`w-4 h-4 ${isSelected || isHighMatch ? 'text-white' : 'text-emerald-600'}`} strokeWidth={2.5} />
        )}

        {/* Cục nhỏ xinh góc trên bên phải báo hiệu siêu phẩm */}
        {isHighMatch && !isSelected && (
          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-yellow-400 border border-white rounded-full shadow-sm text-yellow-900">
            <StarIcon className="w-2.5 h-2.5 fill-current" />
          </div>
        )}
      </div>

      {/* Mũi nhọn trỏ xuống (Cái đuôi của bong bóng map) */}
      <div className={`
        w-2 h-2 -mt-1 rounded-sm rotate-45 z-0
        ${isSelected ? 'bg-emerald-600' : isHighMatch ? 'bg-red-500' : 'bg-emerald-500'}
      `}></div>
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-marker bg-transparent border-0', // Xóa class mặc định nền trắng dư thừa
    iconSize: [40, 48], // Tùy chỉnh kích thước bounding box bấm
    iconAnchor: [20, 44], // Tọa độ tâm đinh ghim (nằm ở đáy)
    popupAnchor: [0, -40] // Độ cao hiện Popup nếu có
  });
};

const ShopMarker = ({ shop, isSelected, onClick }) => {
  // Trích xuất tọa độ an toàn từ MongoDB GeoJSON format
  if (!shop?.location?.coordinates || shop.location.coordinates.length < 2) return null;
  
  // Tọa độ MongoDB là [Longitude, Latitude] 
  // Map Leaflet là [Latitude, Longitude]
  const position = [
    shop.location.coordinates[1], // Lat
    shop.location.coordinates[0]  // Lng
  ];

  const customIcon = createShopIcon(shop, isSelected);

  return (
    <Marker 
      position={position} 
      icon={customIcon}
      eventHandlers={{
        click: () => {
          if (onClick) onClick(shop);
        }
      }}
      zIndexOffset={isSelected ? 500 : (shop.match_score >= 80 ? 100 : 0)} // Chọn hoặc quán Hot thì ưu tiên nổi lên trên
    />
  );
};

export default ShopMarker;
