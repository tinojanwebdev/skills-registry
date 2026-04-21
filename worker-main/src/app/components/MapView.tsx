import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// Person icon SVG creator
const personSvg = (bg: string, border: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28C40 9 31 0 20 0z" fill="${bg}" stroke="${border}" stroke-width="2"/>
  <circle cx="20" cy="15" r="6" fill="white"/>
  <path d="M10 28c0-5.5 4.5-8 10-8s10 2.5 10 8" fill="white" opacity="0.9"/>
</svg>`;

const createPersonIcon = (bg: string, border: string) => new L.DivIcon({
  html: personSvg(bg, border),
  className: '',
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48],
});

// Provider icons
export const availableIcon = createPersonIcon('#16a34a', '#15803d');  // green
export const busyIcon = createPersonIcon('#eab308', '#ca8a04');       // gold/yellow
export const redIcon = createPersonIcon('#dc2626', '#b91c1c');        // red (for service area)
export const blueIcon = createPersonIcon('#2563eb', '#1d4ed8');       // blue

// Keep old colored pin markers for backward compat
const createPinIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
export const greenIcon = createPinIcon('green');
export const goldIcon = createPinIcon('gold');

// Auto-fit map to markers
const FitBounds = ({ markers }: { markers: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => L.latLng(m[0], m[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, map]);
  return null;
};

// Recenter map
const RecenterMap = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [center, map]);
  return null;
};

export interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  icon?: L.Icon | L.DivIcon;
}

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  circle?: { center: [number, number]; radius: number };
  height?: string;
  fitMarkers?: boolean;
  onMarkerClick?: (id: number) => void;
}

export const MapView = ({ center, zoom = 13, markers = [], circle, height = '400px', fitMarkers = false, onMarkerClick }: MapViewProps) => {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height, width: '100%', borderRadius: '0.5rem', zIndex: 0 }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      {fitMarkers && markers.length > 0 && (
        <FitBounds markers={markers.map(m => [m.lat, m.lng])} />
      )}
      {circle && (
        <Circle center={circle.center} radius={circle.radius * 1000} pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.1 }} />
      )}
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={m.icon || blueIcon}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(m.id) } : {}}>
          <Popup>
            <div className="text-sm">
              <p className="font-medium">{m.label}</p>
              {m.sublabel && <p className="text-gray-600">{m.sublabel}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
