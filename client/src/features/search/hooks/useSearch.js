import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  searchShops, 
  selectSearchResults, 
  selectShopsStatus, 
  selectShopsError,
  selectShopsFilters 
} from '../../shops/shopsSlice';

/**
 * Custom Hook `useSearch`
 * Chuyên trách việc tìm kiếm toàn cục (Global Regex Text Search) bằng Tên quán hoặc Địa chỉ.
 * Hoạt động độc lập với logic tìm kiếm quanh đây (useNearbyShops).
 */
const useSearch = () => {
  const dispatch = useDispatch();
  
  // Trích xuất State từ Redux
  const results = useSelector(selectSearchResults);
  const filters = useSelector(selectShopsFilters);
  const status = useSelector(selectShopsStatus);
  const error = useSelector(selectShopsError);

  const isLoading = status === 'loading';
  const isError = status === 'failed';
  const isSuccess = status === 'succeeded';

  /**
   * 1. Hàm kích hoạt tìm kiếm thủ công
   * Hữu ích khi bạn muốn gọi tìm kiếm từ một nút bấm cụ thể chứ không chờ Redux.
   */
  const executeSearch = useCallback((keyword, limit = 20) => {
    if (!keyword || keyword.trim() === '') return;
    // Gọi thẳng Thunk Action để bắn API sang FastAPI
    dispatch(searchShops({ q: keyword.trim(), limit }));
  }, [dispatch]);

  /**
   * 2. Bộ Lắng Nghe Thông Minh (Auto-Search Listener)
   * Thay vì bắt Component giao diện phải tự lo lắng việc gọi API, 
   * Hook này âm thầm lắng nghe sự thay đổi của biến `filters.q` (từ SearchBar) 
   * và tự động rà quét data mới.
   */
  useEffect(() => {
    const keyword = filters?.q;
    
    // Nếu có từ khóa, ta rà quét. Nếu từ khóa rỗng, không làm gì cả (vì SearchBar đã clear list hiển thị).
    if (keyword && keyword.trim() !== '') {
      
      // Kỹ thuật Debouncing nhẹ nhàng 
      // Dù ở SearchBar ta đã Submit bằng ngón tay, debounce 300ms vẫn giữ an toàn 
      // lỡ có nơi khác dispatch(updateFilters) liên tục.
      const delaySearch = setTimeout(() => {
        executeSearch(keyword);
      }, 300);
      
      // Cleanup: Hủy API nếu trong 300ms tới user lại gõ chữ hoặc đổi Filter
      return () => clearTimeout(delaySearch);
    }
  }, [filters.q, executeSearch]);

  return {
    // Dữ liệu mảng các quán tìm được
    results,
    
    // Trạng thái (Phục vụ việc hiển thị Spinner ⏳ hay Bảng Lỗi ❌)
    isLoading,
    isError,
    isSuccess,
    error,
    
    // Action thủ công nếu cần
    executeSearch
  };
};

export default useSearch;
