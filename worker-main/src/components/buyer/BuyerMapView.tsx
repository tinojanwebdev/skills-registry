import React, { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface BuyerMapViewProps {
  workers: Array<{
    id: number;
    name: string;
    service: string;
    hourlyRate: number;
    image?: string;
    lat: number;
    lng: number;
    latestPost?: { title: string } | null;
  }>;
  onSelectWorker: (worker: { id: number }) => void;
  center: { lat: number; lng: number };
  pinnedLocation?: { lat: number; lng: number } | null;
  onPinLocation?: (coords: { lat: number; lng: number }) => void;
}

const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const escapeUrlForCss = (url: string) => url.replace(/'/g, "\\'");

const createAvatarMarkerIcon = (imageUrl?: string) =>
  L.divIcon({
    className: 'seller-avatar-marker',
    html: `<div style="width:36px;height:36px;border-radius:9999px;border:2px solid #ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.35);background:${imageUrl ? `url('${escapeUrlForCss(imageUrl)}') center/cover no-repeat` : '#64748b'};"></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

const buyerPurpleIcon = L.divIcon({
  className: 'buyer-purple-marker',
  html: `<div style="width:28px;height:28px;border-radius:9999px;background:#8b5cf6;border:2px solid #ffffff;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;line-height:1;">●</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

function RecenterButton({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  return (
    <button
      className="absolute bottom-4 left-4 px-4 py-2 bg-white rounded-lg shadow-lg flex items-center gap-2 hover:bg-secondary transition-colors z-[1000]"
      onClick={() => map.setView([center.lat, center.lng], map.getZoom())}
    >
      <MapPin className="w-4 h-4" />
      <span className="text-sm font-medium">Recenter</span>
    </button>
  );
}

function MapLifecycleSync() {
  const map = useMap();
  useEffect(() => {
    const refresh = () => map.invalidateSize();
    const timeoutA = window.setTimeout(refresh, 0);
    const timeoutB = window.setTimeout(refresh, 250);
    window.addEventListener('resize', refresh);
    return () => {
      window.clearTimeout(timeoutA);
      window.clearTimeout(timeoutB);
      window.removeEventListener('resize', refresh);
    };
  }, [map]);
  return null;
}

function MapRecenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(timer);
  }, [center.lat, center.lng, map]);
  return null;
}

function MapPinHandler({
  onPinLocation,
}: {
  onPinLocation?: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click: (event) => {
      onPinLocation?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });
  return null;
}

export function BuyerMapView({
  workers,
  onSelectWorker,
  center,
  pinnedLocation,
  onPinLocation,
}: BuyerMapViewProps) {
  const safeCenter = {
    lat: Number.isFinite(center.lat) ? center.lat : 6.9271,
    lng: Number.isFinite(center.lng) ? center.lng : 79.8612,
  };
  const safeWorkers = workers.filter(
    (worker) => Number.isFinite(worker.lat) && Number.isFinite(worker.lng)
  );

  return (
    <div className="px-6 py-4 relative z-10">
      <div className="relative h-[60vh] min-h-[440px] md:h-[calc(100vh-300px)]">
        <div className="w-full h-full bg-secondary rounded-xl overflow-hidden relative border border-border shadow-md z-10">
        <MapContainer
          key={`${safeCenter.lat}-${safeCenter.lng}`}
          center={[safeCenter.lat, safeCenter.lng]}
          zoom={13}
          className="w-full h-full relative z-10"
          style={{ width: '100%', height: '100%', minHeight: '440px', zIndex: 10 }}
          scrollWheelZoom
          whenReady={(event) => {
            window.setTimeout(() => event.target.invalidateSize(), 0);
            window.setTimeout(() => event.target.invalidateSize(), 200);
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapLifecycleSync />
          <MapRecenter center={safeCenter} />
          <MapPinHandler onPinLocation={onPinLocation} />
          <Marker position={[safeCenter.lat, safeCenter.lng]} icon={buyerPurpleIcon}>
            <Popup>{pinnedLocation ? 'Pinned location' : 'Your location'}</Popup>
          </Marker>
          {safeWorkers.map((worker) => (
            <Marker
              key={worker.id}
              position={[worker.lat, worker.lng]}
              icon={createAvatarMarkerIcon(worker.image)}
              eventHandlers={{ click: () => onSelectWorker(worker) }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{worker.name}</div>
                  <div className="text-muted-foreground">{worker.service}</div>
                  <div className="mt-1">LRs {worker.hourlyRate}/hr</div>
                  {worker.latestPost && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground">Latest post</div>
                      <div className="font-medium">{worker.latestPost.title}</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          <RecenterButton center={safeCenter} />
        </MapContainer>
        {safeWorkers.length === 0 && (
          <div className="absolute top-3 right-3 bg-white/95 text-foreground text-xs px-3 py-1.5 rounded-md shadow">
            No nearby worker locations found
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/95 text-foreground text-xs px-3 py-1.5 rounded-md shadow">
          Tap map to pin location
        </div>
        </div>
      </div>
    </div>
  );
}
