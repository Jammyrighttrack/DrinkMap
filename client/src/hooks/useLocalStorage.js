import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage Hook - Chuẩn FSD Shared
 * 
 * @description Hook giúp đồng bộ hóa State của React với trình duyệt (localStorage).
 * Khi bạn cập nhật State, giá trị tự động lưu xuống ổ cứng.
 * Khi F5 trình duyệt, State tự động đọc lại giá trị cũ lên mà không bị mất dữ liệu.
 * ĐẶC BIỆT: Hỗ trợ đồng bộ hóa dữ liệu TRỰC TIẾP giữa nhiều tab (cửa sổ) trình duyệt khác nhau.
 * 
 * @param {string} key - Tên chìa khóa để lưu trong localStorage (Vd: 'drinkmap-theme')
 * @param {any} initialValue - Giá trị khởi tạo mặc định nếu trong kho chưa có
 * @returns {[any, Function]} - Mảng gồm [Giá_trị_hiện_tại, Hàm_cập_nhật] y hệt useState
 */
export function useLocalStorage(key, initialValue) {
  
  // Hàm trợ giúp để đọc dữ liệu an toàn từ kho
  const readValue = useCallback(() => {
    // Chặn lỗi nếu App đang chạy trên server-side rendering (như Next.js)
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Nếu có dữ liệu thì parse JSON báo về, nếu không thì lấy giá trị khởi tạo
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`DrinkMap Warning: Lỗi khi đọc localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // Khởi tạo State gốc bằng hàm callback (để tối ưu, chỉ chạy 1 lần lúc render đầu tiên)
  const [storedValue, setStoredValue] = useState(readValue);

  // Hàm set giá trị mới (Nâng cấp từ useState setter)
  const setValue = useCallback((value) => {
    if (typeof window === 'undefined') {
      console.warn(`DrinkMap Warning: Đang cố lưu mảng "${key}" nhưng môi trường chưa phải là trình duyệt.`);
      return;
    }

    try {
      // Hỗ trợ truyền vào function giống y hệt setState của React (vd: prev => prev + 1)
      const newValue = value instanceof Function ? value(storedValue) : value;
      
      // 1. Lưu xuống bộ nhớ tạm của Browser
      window.localStorage.setItem(key, JSON.stringify(newValue));
      
      // 2. Cập nhật lại React State để UI render lại ngay lập tức
      setStoredValue(newValue);

      // 3. Fake một Event để báo cho các component KHÁC trong cùng 1 cục App biết data đã đổi
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      console.warn(`DrinkMap Warning: Lỗi khi lưu localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Lắng nghe sự thay đổi của kho (Dành cho tính năng mở nhiều Tab)
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    // Bắt sự kiện 'storage' mặc định của Browser (Mở Tab B đổi Mode Tối, Tab A Tự Đổi Theo Ngay Lập Tức)
    window.addEventListener('storage', handleStorageChange);
    
    // Bắt sự kiện 'local-storage' tự chế (Dùng để đồng bộ trong cùng 1 Tab)
    window.addEventListener('local-storage', handleStorageChange);

    // Kỹ thuật dọn dẹp bộ nhớ chống rò rỉ (Memory Leak)
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [readValue]);

  return [storedValue, setValue];
}
