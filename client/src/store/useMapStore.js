import { create } from 'zustand';

export const useMapStore = create((set) => ({
  activeShops: [],
  focusedShop: null,
  
  setActiveShops: (shops) => set({ activeShops: shops }),
  setFocusedShop: (shop) => set({ focusedShop: shop }),
  clearFocusedShop: () => set({ focusedShop: null }),
}));
