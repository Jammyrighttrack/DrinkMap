import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewsApi } from './reviewsApi';

// ==========================================
// ASYNC THUNKS
// ==========================================

/** Lấy đánh giá của một quán */
export const fetchShopReviews = createAsyncThunk(
  'reviews/fetchShopReviews',
  async (shopId, { rejectWithValue }) => {
    try {
      const data = await reviewsApi.getShopReviews(shopId);
      return { shopId, reviews: data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Không thể tải đánh giá.');
    }
  }
);

/** Lấy tất cả đánh giá của user hiện tại */
export const fetchMyReviews = createAsyncThunk(
  'reviews/fetchMyReviews',
  async (_, { rejectWithValue }) => {
    try {
      return await reviewsApi.getMyReviews();
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Không thể tải lịch sử đánh giá.');
    }
  }
);

/** Gửi đánh giá mới */
export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async (reviewPayload, { rejectWithValue }) => {
    try {
      return await reviewsApi.submitReview(reviewPayload);
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Không thể gửi đánh giá.');
    }
  }
);

/** Xóa đánh giá */
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (reviewId, { rejectWithValue }) => {
    try {
      await reviewsApi.deleteReview(reviewId);
      return reviewId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Không thể xóa đánh giá.');
    }
  }
);

// ==========================================
// SLICE
// ==========================================

const initialState = {
  // Reviews theo shop: { [shopId]: ReviewResponse[] }
  byShop: {},
  shopReviewsLoading: false,
  shopReviewsError: null,

  // Reviews của user hiện tại
  myReviews: [],
  myReviewsLoading: false,
  myReviewsError: null,

  // Trạng thái submit
  isSubmitting: false,
  submitError: null,
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearShopReviewsError: (state) => {
      state.shopReviewsError = null;
    },
    clearSubmitError: (state) => {
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    // --- fetchShopReviews ---
    builder
      .addCase(fetchShopReviews.pending, (state) => {
        state.shopReviewsLoading = true;
        state.shopReviewsError = null;
      })
      .addCase(fetchShopReviews.fulfilled, (state, action) => {
        state.shopReviewsLoading = false;
        state.byShop[action.payload.shopId] = action.payload.reviews;
      })
      .addCase(fetchShopReviews.rejected, (state, action) => {
        state.shopReviewsLoading = false;
        state.shopReviewsError = action.payload;
      });

    // --- fetchMyReviews ---
    builder
      .addCase(fetchMyReviews.pending, (state) => {
        state.myReviewsLoading = true;
        state.myReviewsError = null;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.myReviewsLoading = false;
        state.myReviews = action.payload;
      })
      .addCase(fetchMyReviews.rejected, (state, action) => {
        state.myReviewsLoading = false;
        state.myReviewsError = action.payload;
      });

    // --- submitReview ---
    builder
      .addCase(submitReview.pending, (state) => {
        state.isSubmitting = true;
        state.submitError = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const review = action.payload;
        // Prepend to shop reviews if cached
        if (state.byShop[review.shop_id]) {
          state.byShop[review.shop_id] = [review, ...state.byShop[review.shop_id]];
        }
        // Also prepend to myReviews
        state.myReviews = [review, ...state.myReviews];
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.submitError = action.payload;
      });

    // --- deleteReview ---
    builder.addCase(deleteReview.fulfilled, (state, action) => {
      const deletedId = action.payload;
      state.myReviews = state.myReviews.filter((r) => r.id !== deletedId);
      // Also remove from byShop cache
      Object.keys(state.byShop).forEach((shopId) => {
        state.byShop[shopId] = state.byShop[shopId].filter((r) => r.id !== deletedId);
      });
    });
  },
});

export const { clearShopReviewsError, clearSubmitError } = reviewsSlice.actions;

// Selectors
export const selectShopReviews = (shopId) => (state) =>
  state.reviews.byShop[shopId] || [];
export const selectShopReviewsLoading = (state) => state.reviews.shopReviewsLoading;
export const selectMyReviews = (state) => state.reviews.myReviews;
export const selectMyReviewsLoading = (state) => state.reviews.myReviewsLoading;
export const selectIsSubmitting = (state) => state.reviews.isSubmitting;
export const selectSubmitError = (state) => state.reviews.submitError;

export default reviewsSlice.reducer;
