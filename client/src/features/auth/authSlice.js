import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi, userApi } from './authApi';

// Helper trích xuất thông báo lỗi an toàn (tránh văng Object hoặc Array gây crash React)
const extractErrorMessage = (error, defaultMsg) => {
  const detail = error.response?.data?.detail;
  if (!detail) {
    return error.response?.data?.message 
      || (typeof error.response?.data === 'string' ? error.response.data : null)
      || defaultMsg;
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const firstErr = detail[0];
    const field = firstErr.loc ? firstErr.loc[firstErr.loc.length - 1] : '';
    const fieldText = field && field !== 'body' ? `[${field}] ` : '';
    return `${fieldText}${firstErr.msg}`;
  }
  return defaultMsg;
};

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
      sessionStorage.setItem('token', data.access_token);
      
      // Song song đó, dùng chính token vừa sinh ra để truy vấn Profile của User
      const userProfile = await authApi.getCurrentUser(data.access_token);
      
      return { token: data.access_token, user: userProfile };
    } catch (error) {
      const message = extractErrorMessage(error, 'Đăng nhập không thành công, vui lòng kiểm tra lại email/mật khẩu.');
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
      const message = extractErrorMessage(error, 'Email này có thể đã được đăng ký!');
      return rejectWithValue(message);
    }
  }
);

// 3. Khôi phục phiên Đăng nhập (Initial Load)
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      // Gửi verify token xuống lấy thông tin cá nhân
      const userProfile = await authApi.getCurrentUser(token);
      return { token, user: userProfile };
    } catch (error) {
      // Nếu API trả vể 401 Unauthorized (Token hết hạn/hỏng)
      sessionStorage.removeItem('token');
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
      sessionStorage.removeItem('token');
      return true;
    } catch (error) {
      return rejectWithValue('Lỗi hệ thống khi đăng xuất');
    }
  }
);

// 5. Đăng nhập Google giả lập gọi API thật
export const googleLoginApi = createAsyncThunk(
  'auth/googleLogin',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.loginWithGoogleMock(payload);
      sessionStorage.setItem('token', data.access_token);
      return { token: data.access_token, user: data.user };
    } catch (error) {
      const message = extractErrorMessage(error, 'Đăng nhập Google thất bại, vui lòng thử lại sau.');
      return rejectWithValue(message);
    }
  }
);

// 5a. Xác thực OTP
export const verifyOtpApi = createAsyncThunk(
  'auth/verifyOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyOtp(payload);
      sessionStorage.setItem('token', data.access_token);
      return { token: data.access_token, user: data.user };
    } catch (error) {
      const message = extractErrorMessage(error, 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
      return rejectWithValue(message);
    }
  }
);

// 5b. Gửi lại mã OTP
export const resendOtpApi = createAsyncThunk(
  'auth/resendOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.resendOtp(payload);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Không thể gửi lại mã OTP, vui lòng thử lại sau.');
      return rejectWithValue(message);
    }
  }
);

// 5c. Yêu cầu đổi mật khẩu (Quên mật khẩu)
export const forgotPasswordApi = createAsyncThunk(
  'auth/forgotPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.forgotPassword(payload);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Email không tồn tại hoặc có lỗi xảy ra.');
      return rejectWithValue(message);
    }
  }
);

// 5d. Đặt lại mật khẩu mới
export const resetPasswordApi = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await authApi.resetPassword(payload);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Mã xác thực không đúng hoặc đã hết hạn.');
      return rejectWithValue(message);
    }
  }
);

// 6. Cập nhật sở thích cá nhân
export const updatePreferencesApi = createAsyncThunk(
  'auth/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const data = await userApi.updatePreferences(preferences);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Không thể cập nhật sở thích.');
      return rejectWithValue(message);
    }
  }
);

// 7. Lưu / Bỏ lưu quán nước
export const toggleFavoriteApi = createAsyncThunk(
  'auth/toggleFavorite',
  async (shopId, { rejectWithValue }) => {
    try {
      const data = await userApi.toggleSaveShop(shopId);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Không thể lưu/bỏ lưu quán nước.');
      return rejectWithValue(message);
    }
  }
);

// 8. Cập nhật thông tin cá nhân (họ tên)
export const updateProfileApi = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const data = await userApi.updateProfile(profileData);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Không thể cập nhật thông tin cá nhân.');
      return rejectWithValue(message);
    }
  }
);

// 9. Cập nhật thiết lập thông báo / riêng tư
export const updateSettingsApi = createAsyncThunk(
  'auth/updateSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const data = await userApi.updateSettings(settingsData);
      return data;
    } catch (error) {
      const message = extractErrorMessage(error, 'Không thể cập nhật thiết lập.');
      return rejectWithValue(message);
    }
  }
);

// 10. Xóa tài khoản vĩnh viễn
export const deleteAccountApi = createAsyncThunk(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await userApi.deleteAccount();
      sessionStorage.removeItem('token');
      return true;
    } catch (error) {
      const message = extractErrorMessage(error, 'Lỗi khi xóa tài khoản.');
      return rejectWithValue(message);
    }
  }
);

// ==========================================
// REDUX SLICE: QUẢN LÝ TIMELINE STATE 
// ==========================================

const initialState = {
  currentUser: null,
  // Đọc mồi token từ Storage để tránh chớp nhoáng (Flash) UI
  token: sessionStorage.getItem('token') || null, 
  isAuthenticated: !!sessionStorage.getItem('token'), 
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
      sessionStorage.removeItem('token');
    },
    // Mock login bằng Google cho UI
    mockGoogleLogin: (state) => {
      state.isAuthenticated = true;
      state.token = 'mock_google_token_123';
      state.currentUser = { fullName: 'Google User', email: 'user@gmail.com' };
      sessionStorage.setItem('token', 'mock_google_token_123');
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

    // ------- GOOGLE LOGIN PIPELINE -------
    builder
      .addCase(googleLoginApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLoginApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.currentUser = action.payload.user;
      })
      .addCase(googleLoginApi.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // ------- VERIFY OTP PIPELINE -------
    builder
      .addCase(verifyOtpApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtpApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.currentUser = action.payload.user;
      })
      .addCase(verifyOtpApi.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });

    // ------- RESEND OTP PIPELINE -------
    builder
      .addCase(resendOtpApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOtpApi.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendOtpApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ------- FORGOT PASSWORD PIPELINE -------
    builder
      .addCase(forgotPasswordApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPasswordApi.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPasswordApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ------- RESET PASSWORD PIPELINE -------
    builder
      .addCase(resetPasswordApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPasswordApi.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPasswordApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ------- UPDATE PREFERENCES -------
    builder
      .addCase(updatePreferencesApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePreferencesApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(updatePreferencesApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ------- TOGGLE FAVORITE -------
    builder
      .addCase(toggleFavoriteApi.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      });

    // ------- UPDATE PROFILE -------
    builder
      .addCase(updateProfileApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfileApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateProfileApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ------- UPDATE SETTINGS -------
    builder
      .addCase(updateSettingsApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSettingsApi.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(updateSettingsApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ------- DELETE ACCOUNT -------
    builder
      .addCase(deleteAccountApi.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteAccountApi.fulfilled, (state) => {
        state.isLoading = false;
        state.currentUser = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(deleteAccountApi.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

// Cho phép UI Component gọi các Tools cục bộ
export const { clearError, forceLogout, mockGoogleLogin } = authSlice.actions;

// Gắn cái này vào configureStore (store.js)
export default authSlice.reducer;
