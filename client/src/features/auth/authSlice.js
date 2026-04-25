import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from './authApi';

// ==========================================
// THUNKS MANG TÍNH NGHIỆP VỤ CAO
// ==========================================

// 1. Đăng nhập & Nạp Dữ Liệu User Ngay Lập Tức
export const loginApi = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Gọi API lấy Access Token (FastAPI)
      const data = await authApi.login(credentials);
      
      // Khắc cờ token vào trình duyệt
      localStorage.setItem('token', data.access_token);
      
      // Song song đó, dùng chính token vừa sinh ra để truy vấn Profile của User
      const userProfile = await authApi.getCurrentUser(data.access_token);
      
      return { token: data.access_token, user: userProfile };
    } catch (error) {
      // Bóc tách câu cảnh báo chuẩn từ FastAPI văng ra (Detail error)
      const message = error.response?.data?.detail 
        || (typeof error.response?.data === 'string' ? error.response.data : null)
        || 'Đăng nhập không thành công, vui lòng kiểm tra lại email/mật khẩu.';
      return rejectWithValue(message);
    }
  }
);

// 2. Đăng ký tài khoản
export const registerApi = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authApi.register(userData);
      return response;
    } catch (error) {
      const message = error.response?.data?.detail 
        || 'Email này có thể đã được đăng ký!';
      return rejectWithValue(message);
    }
  }
);

// 3. Khôi phục phiên Đăng nhập (Initial Load)
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Gửi verify token xuống lấy thông tin cá nhân
      const userProfile = await authApi.getCurrentUser(token);
      return { token, user: userProfile };
    } catch (error) {
      // Nếu API trả vể 401 Unauthorized (Token hết hạn/hỏng)
      localStorage.removeItem('token');
      return rejectWithValue('Phiên đăng nhập hết hạn');
    }
  }
);

// 4. Đăng xuất
export const logoutApi = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // (Optional) Gọi api xoá Session trên backend nếu Backend có table Token
      // await authApi.logout(); 
      localStorage.removeItem('token');
      return true;
    } catch (error) {
      return rejectWithValue('Lỗi hệ thống khi đăng xuất');
    }
  }
);

// ==========================================
// REDUX SLICE: QUẢN LÝ TIMELINE STATE 
// ==========================================

const initialState = {
  currentUser: null,
  // Đọc mồi token từ Storage để tránh chớp nhoáng (Flash) UI
  token: localStorage.getItem('token') || null, 
  isAuthenticated: !!localStorage.getItem('token'), 
  isLoading: false, 
  error: null,
  isInitializing: true, // Trạng thái App đang chật vật tải Auth Profile ở giây đầu tiên mở màn hình
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Hàm sync (Action thuần)
    clearError: (state) => {
      state.error = null;
    },
    // Chặn ép Đăng xuất khẩn cấp nếu dính bug
    forceLogout: (state) => {
      state.currentUser = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    // Mock login bằng Google cho UI
    mockGoogleLogin: (state) => {
      state.isAuthenticated = true;
      state.token = 'mock_google_token_123';
      state.currentUser = { fullName: 'Google User', email: 'user@gmail.com' };
      localStorage.setItem('token', 'mock_google_token_123');
    }
  },
  extraReducers: (builder) => {
    // ------- LOGIN PIPELINE -------
    builder
      .addCase(loginApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.currentUser = action.payload.user;
      })
      .addCase(loginApi.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload; // Ném chuỗi string lỗi vào state
      });

    // ------- REGISTER PIPELINE -------
    builder
      .addCase(registerApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerApi.fulfilled, (state) => {
        state.isLoading = false;
        // KHÔNG set isAuthenticated = true ở đây, bắt buộc user phải quay về form Login!
      })
      .addCase(registerApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ------- INITIALIZING (FETCH ME) -------
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isInitializing = true; 
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isInitializing = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.currentUser = action.payload.user;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isInitializing = false;
        state.isAuthenticated = false;
        state.currentUser = null;
        state.token = null; 
        // Lỗi chạy ngầm sẽ ko in ra màn hình cản trở UX
      });

    // ------- LOGOUT -------
    builder
      .addCase(logoutApi.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.currentUser = null;
        state.error = null; 
        // Lúc logout thành công sẽ xóa sạch
      });
  }
});

// Cho phép UI Component gọi các Tools cục bộ
export const { clearError, forceLogout, mockGoogleLogin } = authSlice.actions;

// Gắn cái này vào configureStore (store.js)
export default authSlice.reducer;
