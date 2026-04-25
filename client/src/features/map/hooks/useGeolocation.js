import { useCallback, useMemo, useState } from 'react';

const useGeolocation = (options) => {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Keep geolocation options stable so requestLocation does not change every render.
  const geoOptions = useMemo(() => {
    const safeOptions = options || {};

    return {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...safeOptions,
    };
  }, [
    options?.enableHighAccuracy,
    options?.maximumAge,
    options?.timeout,
  ]);

  const handleSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy: posAccuracy } = position.coords;

    setLocation({ lat: latitude, lng: longitude });
    setAccuracy(posAccuracy);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((geoError) => {
    let errorMessage = 'Khong the dinh vi vi tri cua ban.';

    switch (geoError.code) {
      case geoError.PERMISSION_DENIED:
        errorMessage = 'Ban da tu choi quyen truy cap vi tri. Hay bat lai trong cai dat trinh duyet.';
        break;
      case geoError.POSITION_UNAVAILABLE:
        errorMessage = 'Thong tin vi tri hien khong kha dung.';
        break;
      case geoError.TIMEOUT:
        errorMessage = 'Yeu cau dinh vi da het thoi gian cho.';
        break;
      default:
        errorMessage = 'Da xay ra loi khong xac dinh khi lay vi tri.';
        break;
    }

    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trinh duyet hoac thiet bi cua ban khong ho tro dinh vi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
  }, [geoOptions, handleError, handleSuccess]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Trinh duyet hoac thiet bi cua ban khong ho tro theo doi vi tri.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        handleSuccess(position);
        setIsLoading(false);
      },
      handleError,
      geoOptions
    );

    return watchId;
  }, [geoOptions, handleError, handleSuccess]);

  const stopWatching = useCallback((watchId) => {
    if (watchId !== undefined && watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return {
    location,
    accuracy,
    error,
    isLoading,
    requestLocation,
    startWatching,
    stopWatching,
  };
};

export default useGeolocation;
