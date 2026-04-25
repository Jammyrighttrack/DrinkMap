import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import shopsReducer from '../features/shops/shopsSlice';
import searchReducer from '../features/search/searchSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: authReducer, // Alias để tương thích với các component gọi state.user
    shops: shopsReducer,
    search: searchReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
