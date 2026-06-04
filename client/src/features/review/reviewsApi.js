import axios from 'axios';
import { resolveApiBaseUrl } from '../../lib/api';

const BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL
);

// Axios client cho reviews endpoints
const reviewsClient = axios.create({
  baseURL: `${BASE_URL}/reviews`,
  headers: { 'Content-Type': 'application/json' },
});

// Axios client cho favourites endpoints
const favouritesClient = axios.create({
  baseURL: `${BASE_URL}/favourites`,
  headers: { 'Content-Type': 'application/json' },
});

// Tự động đính kèm token vào mỗi request
const addAuthInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

addAuthInterceptor(reviewsClient);
addAuthInterceptor(favouritesClient);

// =========================================
// REVIEWS API
// =========================================
export const reviewsApi = {
  /** Lấy tất cả đánh giá của một quán */
  getShopReviews: async (shopId) => {
    const response = await reviewsClient.get(`/shops/${shopId}/reviews`);
    return response.data;
  },

  /** Lấy tất cả đánh giá mà user hiện tại đã viết */
  getMyReviews: async () => {
    const response = await reviewsClient.get('/me');
    return response.data;
  },

  /** Tạo đánh giá mới cho một quán */
  submitReview: async ({ shopId, rating, comment, tasteTags = [], photos = [] }) => {
    const response = await reviewsClient.post('/', {
      shop_id: shopId,
      rating,
      comment,
      taste_tags: tasteTags,
      photos,
    });
    return response.data;
  },

  /** Xóa đánh giá theo id */
  deleteReview: async (reviewId) => {
    const response = await reviewsClient.delete(`/${reviewId}`);
    return response.data;
  },
};

// =========================================
// FAVOURITES API
// =========================================
export const favouritesApi = {
  /** Kiểm tra xem quán có trong danh sách yêu thích không */
  checkFavourite: async (shopId) => {
    const response = await favouritesClient.get(`/check/${shopId}`);
    return response.data; // { is_favourite: boolean }
  },

  /** Thêm quán vào danh sách yêu thích */
  addFavourite: async (shopId) => {
    const response = await favouritesClient.post('/', { shop_id: shopId });
    return response.data;
  },

  /** Xóa quán khỏi danh sách yêu thích */
  removeFavourite: async (shopId) => {
    const response = await favouritesClient.delete(`/${shopId}`);
    return response.data;
  },

  /** Lấy tất cả quán yêu thích */
  getFavourites: async () => {
    const response = await favouritesClient.get('/');
    return response.data;
  },
};
