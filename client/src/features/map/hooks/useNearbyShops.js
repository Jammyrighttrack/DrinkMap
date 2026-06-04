import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNearbyShops,
  selectNearbyShops,
  selectSelectedShop,
  selectShopsError,
  selectShopsFilters,
  selectShopsStatus,
  updateFilters,
  setSelectedShop,
  clearSelectedShop,
} from '../../shops/shopsSlice';

const useNearbyShops = () => {
  const dispatch = useDispatch();
  const shops = useSelector(selectNearbyShops);
  const selectedShop = useSelector(selectSelectedShop);
  const status = useSelector(selectShopsStatus);
  const error = useSelector(selectShopsError);
  const filters = useSelector(selectShopsFilters);

  const isLoading = status === 'loading';
  const isError = status === 'failed';
  const isSuccess = status === 'succeeded';

  const loadNearbyShops = useCallback((params) => {
    if (!params || params.lng === undefined || params.lat === undefined) {
      console.warn('Missing lng/lat when loading nearby shops.');
      return;
    }

    const apiParams = {
      lng: params.lng,
      lat: params.lat,
      radius_km: params.radius_km ?? 5.0,
    };

    if (params.beverage_types) {
      apiParams.beverage_types = params.beverage_types;
    }

    if (params.price_range !== null && params.price_range !== undefined && params.price_range !== '') {
      apiParams.price_range = Number(params.price_range);
    }
    
    if (params.q) {
      apiParams.q = params.q;
    }

    dispatch(updateFilters(params));
    dispatch(fetchNearbyShops(apiParams));
  }, [dispatch]);

  const handleSelectShop = useCallback((shop) => {
    dispatch(setSelectedShop(shop));
  }, [dispatch]);

  const handleDeselectShop = useCallback(() => {
    dispatch(clearSelectedShop());
  }, [dispatch]);

  return {
    shops,
    selectedShop,
    filters,
    isLoading,
    isError,
    isSuccess,
    error,
    loadNearbyShops,
    handleSelectShop,
    handleDeselectShop,
  };
};

export default useNearbyShops;
