import { useState, useEffect } from 'react';

/**
 * useDebounce - Custom Hook chuẩn xác (FSD Shared Library)
 * 
 * @description
 * Cơ chế "kìm hãm": Chỉ cập nhật và trả về `value` mới khi người dùng 
 * ĐÃ NGỪNG thao tác (gõ phím/chọn) sau một khoảng thời gian `delay` nhất định.
 * Cực kỳ quan trọng để chống spam API (ví dụ: thanh Search gọi API liên tục mỗi chữ cái).
 *    
 * @param {any} value - Giá trị gốc (state) thường xuyên thay đổi (vd: chuỗi tìm kiếm)
 * @param {number} delay - Thời gian chờ (mili giây). Mặc định 500ms.
 * @returns {any} - Giá trị đã được "làm mượt" (debounced)
 *    
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) { fetchAPI(debouncedSearchTerm); }
 * }, [debouncedSearchTerm]);
 */   
export function useDebounce(value, delay = 500) {
  // Biến lưu trữ giá trị sẽ trả về (được cập nhật chậm hơn value gốc)
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Mỗi khi `value` hoặc `delay` thay đổi, ta hẹn giờ cập nhật lại `debouncedValue`
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
       
    // KỸ THUẬT QUAN TRỌNG: Cleanup Function
    // Nếu `value` thay đổi liên tục trước khi hết `delay` (user gõ phím nhanh), 
    // hàm cleanup sẽ chạy, xoá hẹn giờ cũ (clearTimeout) để bắt đầu đếm giờ lại từ đầu.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Chỉ re-run effect nếu value hoặc delay thay đổi

  return debouncedValue;
}
