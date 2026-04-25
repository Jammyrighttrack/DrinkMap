import { createSlice } from '@reduxjs/toolkit';

/**
 * searchSlice.js
 * Quản lý hoàn toàn trạng thái UI (Giao diện) và Lịch sử của quá trình Tìm kiếm.
 * Tách biệt hoàn toàn với shopsSlice (chỉ lo gọi data quán). 
 * Pattern này giúp App chạy mượt hơn và dễ maintain cực kỳ.
 */

const initialState = {
  // Trạng thái Giao diện 
  isSearchActive: false,       // Người dùng có đang gõ hay click vào thanh SearchBar không (hiện Panel)
  isFilterDrawerOpen: false,   // Trạng thái Bật/Tắt của Ngăn xếp Bộ lọc (FilterDrawer)
  
  // Dữ liệu Gợi ý & Lịch sử
  recentSearches: [],          // Lưu lại các từ khóa người dùng đã gõ (VD: "Cà phê muối", "Matcha")
  suggestions: [],             // Chứa danh sách gợi ý từ điển/API khi đang gõ dở
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // --- 1. Quản lý UI Components (Đóng / Mở) ---
    
    setSearchActive: (state, action) => {
      state.isSearchActive = action.payload;
    },
    
    toggleFilterDrawer: (state) => {
      state.isFilterDrawerOpen = !state.isFilterDrawerOpen;
    },
    
    setFilterDrawerOpen: (state, action) => {
      state.isFilterDrawerOpen = action.payload;
    },
    
    // --- 2. Quản lý Lịch sử (Recent Searches) ---
    
    addRecentSearch: (state, action) => {
      const keyword = action.payload?.trim();
      if (!keyword) return;
      
      // Xóa từ khóa y hệt nếu nó đang nằm ở chỗ cũ
      state.recentSearches = state.recentSearches.filter(
        item => item.toLowerCase() !== keyword.toLowerCase()
      );
      
      // Thêm từ khóa mới toanh lên đầu danh sách (LIFO)
      state.recentSearches.unshift(keyword);
      
      // Giới hạn chỉ giữ tối đa 10 từ khóa tìm kiếm gần nhất 
      if (state.recentSearches.length > 10) {
        state.recentSearches.pop();
      }
    },
    
    removeRecentSearch: (state, action) => {
      state.recentSearches = state.recentSearches.filter(
        item => item !== action.payload
      );
    },
    
    clearRecentSearches: (state) => {
      state.recentSearches = [];
    },
    
    // --- 3. Quản lý Từ khóa gợi ý thông minh (Suggestions) ---
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
    },
    
    clearSuggestions: (state) => {
      state.suggestions = [];
    }
  }
});

// ==========================================
// EXPORTS 
// ==========================================

export const {
  setSearchActive,
  toggleFilterDrawer,
  setFilterDrawerOpen,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  setSuggestions,
  clearSuggestions
} = searchSlice.actions;

// Các Selectors chuẩn bị sẵn cho Hook useSelector() bắt trên Giao diện
export const selectIsSearchActive = (state) => state.search.isSearchActive;
export const selectIsFilterDrawerOpen = (state) => state.search.isFilterDrawerOpen;
export const selectRecentSearches = (state) => state.search.recentSearches;
export const selectSearchSuggestions = (state) => state.search.suggestions;

export default searchSlice.reducer;
