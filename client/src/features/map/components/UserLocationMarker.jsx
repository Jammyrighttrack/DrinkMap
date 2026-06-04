import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

// Icon vị trí người dùng (Chấm xanh dương đập nhịp tim giống Google Maps/Grab)
const createUserIcon = () => {
  const iconMarkup = renderToStaticMarkup(
    <div className="relative flex items-center justify-center w-8 h-8">
      {/* Vòng ngoài lan tỏa (Pulse effect) */}
      <div className="absolute w-full h-full bg-emerald-500 rounded-full animate-ping opacity-40"></div>
      
      {/* Vòng nhỏ lan tỏa nhẹ bên trong giúp hiệu ứng smooth hơn */}
      <div className="absolute w-6 h-6 bg-emerald-400 rounded-full animate-pulse opacity-50"></div>
      
      {/* Lõi Cứng ở giữa */}
      <div className="w-3.5 h-3.5 bg-white border-[3px] border-emerald-600 rounded-full shadow-[0_2px_8px_rgba(37,99,235,0.6)] z-10"></div>
      
      {/* Hình nón định hướng nhỏ (Mô phỏng la bàn - optional) */}
      <div className="absolute -top-1 w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-transparent border-b-emerald-600 rotate-0 z-0"></div>
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'bg-transparent border-0',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const UserLocationMarker = ({ position, accuracy }) => {
  if (!position) return null;

  const userIcon = createUserIcon();

  return (
    <>
      {/* Vòng tròn xanh lợt lợt biểu thị bán kính sai số (Accuracy Radius) */}
      {/* Giống y hệt cách Google Maps hiển thị độ chính xác GPS */}
      {accuracy && accuracy > 0 && (
        <Circle 
          center={position} 
          radius={accuracy} 
          pathOptions={{ 
            fillColor: '#3b82f6', // emerald-500
            fillOpacity: 0.15, 
            color: '#3b82f6', 
            weight: 1,
            opacity: 0.4 
          }} 
        />
      )}

      <Marker 
        position={position} 
        icon={userIcon}
        zIndexOffset={1000} // Cố định luôn nằm dưới Popup nhưng TRÊN tất cả quán cafe
      >
        <Popup className="rounded-xl font-sans" closeButton={false}>
          <div className="text-center w-28 py-1">
            <p className="font-bold text-[13px] text-emerald-700">Vị trí của bạn</p>
            {accuracy && (
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                Chính xác đến {Math.round(accuracy)}m
              </p>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export default UserLocationMarker;
