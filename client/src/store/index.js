import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import shopsReducer from '../features/shops/shopsSlice';
import searchReducer from '../features/search/searchSlice';
import reviewsReducer from '../features/review/reviewsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: authReducer, // Alias để tương thích với các component gọi state.user
    shops: shopsReducer,
    search: searchReducer,
    reviews: reviewsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
