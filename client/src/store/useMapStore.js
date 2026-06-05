import { create } from 'zustand';

export const useMapStore = create((set) => ({
  activeShops: [],
  focusedShop: null,
  activeRoute: null, // Object: { coordinates, distance, duration, shopName }
  userLocation: null, // Object: { lat, lng }
  
  setActiveShops: (shops) => set({ activeShops: shops }),
  clearActiveShops: () => set({ activeShops: [] }),
  setFocusedShop: (shop) => set({ focusedShop: shop }),
  clearFocusedShop: () => set({ focusedShop: null }),
  setActiveRoute: (route) => set({ activeRoute: route }),
  clearActiveRoute: () => set({ activeRoute: null }),
  setUserLocation: (location) => set({ userLocation: location }),
}));
