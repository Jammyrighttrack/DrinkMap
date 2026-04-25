import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { shopsApi } from './shopsApi';

// ==========================================
// 1. ASYNC THUNKS (Calls to Backend API)
// ==========================================

export const fetchNearbyShops = createAsyncThunk(
  'shops/fetchNearbyShops',
  async (params, { rejectWithValue }) => {
    try {   
      return await shopsApi.getNearbyShops(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
   
export const fetchShopDetail = createAsyncThunk(
  'shops/fetchShopDetail',
  async (shopId, { rejectWithValue }) => {
    try {   
      return await shopsApi.getShopDetail(shopId);
    } catch (error) {  
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const searchShops = createAsyncThunk(
  'shops/searchShops',   
  async (params, { rejectWithValue }) => {
    try {
      return await shopsApi.searchShops(params);
    } catch (error) {   
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);   

export const fetchAllShops = createAsyncThunk(
  'shops/fetchAllShops',
  async (params, { rejectWithValue }) => {
    try {
      return await shopsApi.getAllShops(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createNewShop = createAsyncThunk(
  'shops/createNewShop',
  async (shopData, { rejectWithValue }) => {
    try {
      return await shopsApi.createShop(shopData);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateExistingShop = createAsyncThunk(
  'shops/updateExistingShop',
  async ({ shopId, updateData }, { rejectWithValue }) => {
    try {  
      return await shopsApi.updateShop(shopId, updateData);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteExistingShop = createAsyncThunk(
  'shops/deleteExistingShop',
  async (shopId, { rejectWithValue }) => {
    try {
      const response = await shopsApi.deleteShop(shopId);
      return { shopId, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==========================================
// 2. INITIAL STATE (State Definition)
// ==========================================
const initialState = {
  // Lists
  nearbyShops: [],       // Shops shown on map bounding box
  searchResults: [],     // Text-based search results
  allShops: [],          // Admin / Pagination view list
  
  // Single Entity View
  selectedShop: null,    // The shop currently clicked / viewed
  
  // App filters / query parameters
  filters: {
    q: '',
    category: '',
    max_distance: 50000,  // Default 50km radius - bao phủ toàn bộ Hà Nội
    minRating: 0,
    priceRange: 'all',
    lng: null,
    lat: null,
  },
  
  // Loading Statuses
  status: 'idle',           // List fetching status: 'idle' | 'loading' | 'succeeded' | 'failed'
  detailStatus: 'idle',     // Single shop fetching status
  mutationStatus: 'idle',   // Create/Update/Delete status
  
  // Potential Error Response
  error: null,
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

// ==========================================
// 3. SLICE (Reducers & ExtraReducers)
// ==========================================
const shopsSlice = createSlice({
  name: 'shops',
  initialState,
  reducers: {
    // ---- Synchronous Actions ---- //
    
    // Select a shop for map popup or detail page
    setSelectedShop: (state, action) => {
      state.selectedShop = action.payload;
    },
    
    // Close shop detail popup
    clearSelectedShop: (state) => {
      state.selectedShop = null;
      state.detailStatus = 'idle'; // Reset status back so it refetches cleanly next time
    },
    
    // Update active filters (category, query, location)
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
      
    // Reset filters
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Manual reset of status/errors (useful when unmounting components)
    resetShopsState: (state) => {
      state.status = 'idle';
      state.mutationStatus = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Nearby Shops --- //
      .addCase(fetchNearbyShops.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNearbyShops.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.nearbyShops = ensureArray(action.payload);
      })   
      .addCase(fetchNearbyShops.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Fetch Shop Detail --- //
      .addCase(fetchShopDetail.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchShopDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.selectedShop = action.payload;
      })
      .addCase(fetchShopDetail.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = action.payload;
      })
         
      // --- Search Shops --- //
      .addCase(searchShops.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchShops.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.searchResults = ensureArray(action.payload);
      })
      .addCase(searchShops.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Mutations (Create / Update / Delete) --- //
      .addCase(createNewShop.pending, (state) => {
        state.mutationStatus = 'loading';
      })
      .addCase(createNewShop.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        state.nearbyShops.push(action.payload); // Instantly append to local map list if desirable
      })
      .addCase(createNewShop.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.payload;
      })
      
      .addCase(updateExistingShop.pending, (state) => {
        state.mutationStatus = 'loading';
      })
      .addCase(updateExistingShop.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        // Auto update local list
        const index = state.nearbyShops.findIndex(s => s.id === action.payload.id || s._id === action.payload._id);
        if (index !== -1) {
          state.nearbyShops[index] = action.payload;
        }
        // Auto update active viewing shop
        if (state.selectedShop && (state.selectedShop.id === action.payload.id || state.selectedShop._id === action.payload._id)) {
          state.selectedShop = action.payload;
        }
      })
      .addCase(updateExistingShop.rejected, (state, action) => {
        state.mutationStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(deleteExistingShop.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded';
        // Remove from list
        state.nearbyShops = state.nearbyShops.filter(s => s.id !== action.payload.shopId && s._id !== action.payload.shopId);
        // Clear if user is viewing this deleted shop
        if (state.selectedShop && (state.selectedShop.id === action.payload.shopId || state.selectedShop._id === action.payload.shopId)) {
          state.selectedShop = null;
          state.detailStatus = 'idle';
        }
      });
  },
});

// ==========================================
// 4. EXPORTS
// ==========================================
// Actions
export const {
  setSelectedShop,
  clearSelectedShop,
  updateFilters,
  clearFilters,
  resetShopsState
} = shopsSlice.actions;

// Selectors for Components hook (useSelector)
export const selectNearbyShops = (state) => ensureArray(state.shops?.nearbyShops);
export const selectSearchResults = (state) => ensureArray(state.shops?.searchResults);
export const selectSelectedShop = (state) => state.shops.selectedShop;
export const selectShopsStatus = (state) => state.shops.status;
export const selectDetailStatus = (state) => state.shops.detailStatus;
export const selectMutationStatus = (state) => state.shops.mutationStatus;
export const selectShopsError = (state) => state.shops.error;
export const selectShopsFilters = (state) => state.shops.filters;

// Target Reducer for the Store
export default shopsSlice.reducer;
