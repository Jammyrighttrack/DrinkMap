import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../../store/useMapStore';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const UserLocationIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: `
    <div class="relative flex h-8 w-8 items-center justify-center">
      <div class="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-20"></div>
      <div class="z-10 h-4 w-4 rounded-full border-4 border-emerald-600 bg-white shadow-lg"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const getShopPosition = (shop) => {
  const loc = shop?.location;

  if (loc) {
    const { type, coordinates } = loc;

    // Point: coordinates = [lng, lat]
    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
      const [lng, lat] = coordinates;
      if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    }

    // Polygon / MultiPolygon: tính centroid của ring ngoài
    if ((type === 'Polygon' || type === 'MultiPolygon') && Array.isArray(coordinates)) {
      const ring = type === 'Polygon' ? coordinates[0] : coordinates[0]?.[0];
      if (Array.isArray(ring) && ring.length > 0) {
        const avgLng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
        const avgLat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
        if (Number.isFinite(avgLat) && Number.isFinite(avgLng)) return [avgLat, avgLng];
      }
    }
  }

  // Flat lat/lng fields (từ AI response)
  if (shop?.lat && shop?.lng && Number.isFinite(shop.lat) && Number.isFinite(shop.lng)) {
    return [shop.lat, shop.lng];
  }

  return null;
};

function MapController({ center, zoom }) {
  const map = useMap();
  const activeRoute = useMapStore((state) => state.activeRoute);

  useEffect(() => {
    if (activeRoute) return;

    if (!Array.isArray(center) || center.length < 2) {
      return;
    }

    const [targetLat, targetLng] = center;

    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) {
      return;
    }

    const currentCenter = map.getCenter();
    const isSameCenter =
      Math.abs(currentCenter.lat - targetLat) < 0.0001 &&
      Math.abs(currentCenter.lng - targetLng) < 0.0001;

    if (!isSameCenter || map.getZoom() !== zoom) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [center, map, zoom, activeRoute]);

  return null;
}

function FocusedShopController({ mapShops }) {
  const map = useMap();
  const focusedShop = useMapStore((state) => state.focusedShop);
  const activeRoute = useMapStore((state) => state.activeRoute);

  useEffect(() => {
    if (activeRoute) return;
    if (!focusedShop) return;

    let targetPos = getShopPosition(focusedShop);
    
    // If AI parsed shop doesn't have exact coordinates, match with DB shops
    if (!targetPos) {
      const match = mapShops.find(s => s.slug === focusedShop.slug || s.name === focusedShop.name);
      if (match) targetPos = getShopPosition(match);
    }

    if (targetPos) {
      map.flyTo(targetPos, 17, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [focusedShop, map, mapShops, activeRoute]);

  return null;
}

function RouteController() {
  const map = useMap();
  const activeRoute = useMapStore((state) => state.activeRoute);

  useEffect(() => {
    if (activeRoute?.coordinates && activeRoute.coordinates.length > 0) {
      const bounds = L.latLngBounds(activeRoute.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activeRoute, map]);

  return null;
}

const MapCore = ({
  center = [10.762622, 106.660172],
  zoom = 14,
  shops = [],
  userLocation = null,
  onMarkerClick,
  onMapDragEnd,
  className = '',
}) => {
  const { activeShops, activeRoute } = useMapStore();
  const displayShops = activeShops.length > 0 ? activeShops : shops;

  const mapShops = useMemo(
    () => displayShops.filter((shop) => getShopPosition(shop)),
    [displayShops]
  );

  return (
    <div className={`relative z-0 h-full w-full ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        className="h-full w-full outline-none"
        whenReady={(event) => {
          if (onMapDragEnd) {
            event.target.on('dragend', () => {
              const centerObj = event.target.getCenter();
              onMapDragEnd({ lat: centerObj.lat, lng: centerObj.lng });
            });
          }
        }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        <ZoomControl position="bottomright" />
        <MapController center={center} zoom={zoom} />
        <FocusedShopController mapShops={mapShops} />
        <RouteController />

        {activeRoute?.coordinates && activeRoute.coordinates.length > 0 && (
          <Polyline
            positions={activeRoute.coordinates}
            pathOptions={{
              color: '#3b82f6',
              weight: 6,
              opacity: 0.8,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          />
        )}

        {userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng) && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={UserLocationIcon}
            zIndexOffset={1000}
          >
            <Popup className="rounded-xl">
              <span className="font-bold text-emerald-600">Vi tri cua ban</span>
            </Popup>
          </Marker>
        )}

        {mapShops.map((shop) => (
          <Marker
            key={shop.id || shop._id || `${shop.name}-${shop.address}`}
            position={getShopPosition(shop)}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(shop);
                }
              },
            }}
          >
            <Popup className="custom-popup" closeButton={false}>
              <div className="w-36 text-center">
                <p className="line-clamp-2 text-[13px] font-bold leading-tight text-gray-900">
                  {shop.name}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <span className="text-yellow-500">*</span>
                  {shop.average_rating || shop.rating || 'New'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapCore;
