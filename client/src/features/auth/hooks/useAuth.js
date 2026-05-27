import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
// Giả định bạn có các actions/thunks từ slice quản lý User/Auth
// import { loginApi, registerApi, logoutApi, clearError } from '../authSlice';

/**
 * useAuth Hook - Custom Hook chuần FSD cho tính năng Xác thực
 * Cung cấp Interface sạch sẽ cho các Component giao tiếp với Redux / API
 * mà không cần phải gọi lại useDispatch hay useSelector quá nhiều lần.
 */
export function useAuth() {
  const dispatch = useDispatch();
  
  // Lấy state từ Redux Store (slice 'auth')
  const authState = useSelector((state) => state.auth);

  const { isAuthenticated, currentUser, isLoading, error, isInitializing } = authState;

  // 1. Hàm Đăng nhập
  const login = useCallback(async (credentials) => {
    try {
      // Ví dụ: const resultAction = await dispatch(loginApi(credentials)).unwrap();
      // return resultAction;
      
      console.log('Sending login data:', credentials);
      // Giả lập call API nếu chưa có
      return new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  }, [dispatch]);

  // 2. Hàm Đăng ký
  const register = useCallback(async (userData) => {
    try {
      // return await dispatch(registerApi(userData)).unwrap();
      console.log('Sending register data:', userData);
      return new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Register failed:', err);
      throw err;
    }
  }, [dispatch]);

  // 3. Hàm Đăng xuất
  const logout = useCallback(async () => {
    try {
      // await dispatch(logoutApi()).unwrap();
      console.log('Logging out...');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, [dispatch]);

  // 4. Hàm Đăng nhập bằng Google (OAuth)
  const loginWithGoogle = useCallback(async (googleToken) => {
    try {
      // return await dispatch(loginWithGoogleApi(googleToken)).unwrap();
      console.log('Google login token:', googleToken);
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  // 5. Hàm xoá thông báo lỗi (Dùng khi component unmount hoặc user bắt đầu gõ lại mk)
  const resetError = useCallback(() => {
    // dispatch(clearError());
  }, [dispatch]);

  // Trả về tất cả State và Actions dưới dạng 1 object duy nhất
  return {
    // State
    isAuthenticated,
    user: currentUser,
    isLoading,
    isInitializing,
    error,
    
    // Actions
    login,
    register,
    logout,
    loginWithGoogle,
    resetError,
  };
}
