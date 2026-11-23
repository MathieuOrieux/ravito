import { MapContainer, TileLayer } from 'react-leaflet';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DEFAULT_CENTER = [47.218, -1.553]; // Nantes

/** Carte Leaflet commune à toute l'app (fond OSM). */
export function BaseMap({ children, className = '', ...props }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={10} scrollWheelZoom={false} className={`map ${className}`} {...props}>
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={18} />
      {children}
    </MapContainer>
  );
}
