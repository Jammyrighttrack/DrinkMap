import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
      <div class="absolute h-full w-full animate-ping rounded-full bg-blue-500 opacity-20"></div>
      <div class="z-10 h-4 w-4 rounded-full border-4 border-blue-600 bg-white shadow-lg"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const getShopPosition = (shop) => {
  const coordinates = shop?.location?.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  const [lng, lat] = coordinates;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
};

function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
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
  }, [center, map, zoom]);

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
  const mapShops = useMemo(
    () => shops.filter((shop) => getShopPosition(shop)),
    [shops]
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

        {userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng) && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={UserLocationIcon}
            zIndexOffset={1000}
          >
            <Popup className="rounded-xl">
              <span className="font-bold text-blue-600">Vi tri cua ban</span>
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
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-semibold text-orange-600">
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
