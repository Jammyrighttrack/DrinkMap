/**
 * mapUtils.js
 * Tập hợp các hàm tiện ích (Helpers) chuyên dụng cho Bản đồ (Leaflet / GeoSpatial)
 * Giúp code trong Component sạch sẽ, dễ Unit Test và tái sử dụng.
 */

/**
 * 1. Tính toán khoảng cách đường chim bay giữa 2 điểm (Công thức Haversine)
 * @param {number} lat1 Vĩ độ điểm 1
 * @param {number} lon1 Kinh độ điểm 1
 * @param {number} lat2 Vĩ độ điểm 2
 * @param {number} lon2 Kinh độ điểm 2
 * @returns {number} Khoảng cách tính bằng mét (m)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δφ = (lat2 - lat1) * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
};

/**
 * 2. Format hiển thị khoảng cách thân thiện với người dùng (UX)
 * @param {number} meters Khoảng cách tính bằng mét
 * @returns {string} Trả về dạng "500m" hoặc "1.2km"
 */
export const formatDistance = (meters) => {
  if (meters == null || isNaN(meters)) return "0m";
  
  if (meters < 1000) {
    // Làm tròn số nguyên nếu dưới 1km (ví dụ: 854m)
    return `${Math.round(meters)}m`;
  }
  
  // Trên 1km thì hiển thị số thập phân (ví dụ: 2.3km)
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * 3. Trích xuất đúng chuẩn tọa độ [lng, lat] từ Object Location của MongoDB
 * MongoDB lưu GeoJSON format: { type: "Point", coordinates: [longitude, latitude] }
 * (Nhớ rằng Mongo đứng ngược với Leaflet: Mongo là [Lng, Lat], Leaflet mong đợi [Lat, Lng])
 * 
 * @param {Object} location Object location từ Backend trả về
 * @returns {Array} Khảng định có giá trị [lng, lat] hoặc undefined
 */
export const extractCoordinates = (location) => {
  if (location && location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    return location.coordinates;
  }
  return undefined;
};

/**
 * 4. Chuyển đổi tọa độ Leaflet (Lat, Lng) sang chuẩn GeoJSON (Lng, Lat) cho API của FastAPI
 * @param {Object} latLng Object trả về từ sự kiện map.getCenter() của Leaflet (e.g. {lat: 21.0, lng: 105.8})
 * @returns {Object} JSON { lng, lat } chuẩn quy ước cho Backend
 */
export const leafletToGeoQuery = (latLng) => {
  if (!latLng || latLng.lng === undefined || latLng.lat === undefined) return null;
  
  return {
    lng: latLng.lng,
    lat: latLng.lat
  };
};

/**
 * 5. Lấy Bounding Box của Bản đồ (Góc Tây Nam & Đông Bắc)
 * Dùng khi bạn muốn query API "Lấy tất cả quán đang hiển thị trên màn hình hiện tại" thay vì "Bán kính".
 * @param {Object} leafletBounds Lấy từ lệnh `map.getBounds()` của Leaflet
 * @returns {Object} Object chứa 4 điểm góc giới hạn { sw_lng, sw_lat, ne_lng, ne_lat }
 */
export const getBoundsQuery = (leafletBounds) => {
  if (!leafletBounds) return null;
  
  const sw = leafletBounds.getSouthWest();
  const ne = leafletBounds.getNorthEast();
  
  return {
    sw_lng: sw.lng,
    sw_lat: sw.lat,
    ne_lng: ne.lng,
    ne_lat: ne.lat
  };
};

/**
 * 6. Tính toán Mức Độ Zoom (Zoom Level) hợp lý dựa vào Độ Chính Xác (Accuracy) của GPS thiết bị
 * @param {number} accuracy Sai số tính bằng mét (từ navigator.geolocation)
 * @returns {number} Zoom level chuẩn cho Maps (0 - 18)
 */
export const calculateZoomFromAccuracy = (accuracy) => {
  if (!accuracy) return 15;       // Mặc định mức 15 (cấp quận/phường) nếu không có data
  if (accuracy <= 50) return 17;  // Mạng cực khỏe, sóng GPS chuẩn -> Zoom sát mặt đường 
  if (accuracy <= 500) return 15; // Trung bình -> Zoom cấp quận
  if (accuracy <= 5000) return 13;// Kém -> Zoom toàn thành phố
  return 11;                      // Quá kém -> Zoom cấp quốc gia / liên tỉnh
};
