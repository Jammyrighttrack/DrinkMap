import axios from 'axios';
import { extractListPayload, extractObjectPayload, resolveApiBaseUrl } from '../../lib/api';

// Configuration for Axios client communicating with FARM backend.
const BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL
);

const shopsClient = axios.create({
  baseURL: `${BASE_URL}/shops`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optionally auto-inject auth tokens from sessionStorage for protected endpoints
shopsClient.interceptors.request.use(
  (config) => {   
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const shopsApi = {
  /**
   * 1. Get List of Nearby Shops (Geospatial search + AI Scoring)
   * @param {Object} params - { lng: number, lat: number, max_distance?: number, category?: string }
   * @returns {Promise<Array>} List of Shop objects
   */
  getNearbyShops: async (params) => {
    const response = await shopsClient.get('/nearby', { params });
    return extractListPayload(response.data);
  },
       
  /**
   * 2. Get Single Shop Detail
   * @param {string} shopId 
   * @returns {Promise<Object>} The Shop object
   */
  getShopDetail: async (shopId) => {
    const response = await shopsClient.get(`/${shopId}`);
    return extractObjectPayload(response.data);
  },  

  /**
   * 3. Search Shops by keyword
   * @param {Object} params - { q: string, limit?: number }
   * @returns {Promise<Array>} List of Shop objects
   */
  searchShops: async (params) => {
    const response = await shopsClient.get('/search', { params });
    return extractListPayload(response.data);
  },
      
  /**   
   * 4. Get all shops with pagination (General purpose / Admin)
   * @param {Object} params - { limit?: number, skip?: number }
   * @returns {Promise<Array>} List of Shop objects
   */
  getAllShops: async (params = { limit: 50, skip: 0 }) => {
    const response = await shopsClient.get('/', { params });
    return extractListPayload(response.data);
  },

  /**
   * 5. Create a new shop (Requires Authentication)
   * @param {Object} shopData - Data adhering to backend ShopCreate schema
   * @returns {Promise<Object>} Created Shop object
   */
  createShop: async (shopData) => {
    const response = await shopsClient.post('/', shopData);
    return extractObjectPayload(response.data);
  },
      
  /**
   * 6. Update Shop information (Requires Authentication: Owner or Admin)
   * @param {string} shopId
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated Shop object
   */
  updateShop: async (shopId, updateData) => {
    const response = await shopsClient.put(`/${shopId}`, updateData);
    return extractObjectPayload(response.data);
  },

  /**
   * 7. Delete / Hide a shop (Soft delete)
   * @param {string} shopId 
   * @returns {Promise<Object>} Message showing success
   */
  deleteShop: async (shopId) => {
    const response = await shopsClient.delete(`/${shopId}`);
    return response.data;
  }
};
