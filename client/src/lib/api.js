const FALLBACK_API_URL = 'https://drinkmap.onrender.com';

export const resolveApiBaseUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return FALLBACK_API_URL;
  }

  const normalizedUrl = rawUrl.replace(/\/+$/, '');

  if (normalizedUrl.endsWith('/api') || normalizedUrl.endsWith('/api/v1')) {
    return normalizedUrl;
  }

  return `${normalizedUrl}/api`;
};

export const extractListPayload = (payload, keys = ['data', 'items', 'results', 'shops']) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  throw new Error('API did not return a valid list payload.');
};

export const extractObjectPayload = (payload, keys = ['data', 'item', 'shop', 'user']) => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    for (const key of keys) {
      const nestedValue = payload[key];

      if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
        return nestedValue;
      }
    }

    return payload;
  }

  throw new Error('API did not return a valid object payload.');
};
