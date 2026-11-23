import { useEffect } from 'react';
import { CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { COLORS } from '../../lib/theme.js';
import { BaseMap } from './BaseMap.jsx';

function FitBounds({ bbox }) {
  const map = useMap();
  useEffect(() => {
    if (bbox) map.fitBounds(bbox, { padding: [24, 24], animate: false });
  }, [map, bbox]);
  return null;
}

/** Une trace complète, avec départ/arrivée et le point survolé sur le profil. */
export function TraceMap({ trace, highlight }) {
  const positions = trace.geometry.map(([lat, lon]) => [lat, lon]);
  const start = positions[0];
  const end = positions[positions.length - 1];
  return (
    <BaseMap className="map--detail">
      <FitBounds bbox={trace.bbox} />
      <Polyline positions={positions} pathOptions={{ color: COLORS.routeCasing, weight: 8, opacity: 0.9 }} />
      <Polyline positions={positions} pathOptions={{ color: COLORS.accent, weight: 4 }} />
      <CircleMarker center={start} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: COLORS.start, fillOpacity: 1 }}>
        <Tooltip>Départ</Tooltip>
      </CircleMarker>
      <CircleMarker center={end} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: COLORS.end, fillOpacity: 1 }}>
        <Tooltip>Arrivée</Tooltip>
      </CircleMarker>
      {highlight && (
        <CircleMarker center={highlight} radius={6} pathOptions={{ color: '#111', weight: 2, fillColor: '#fff', fillOpacity: 1 }} />
      )}
    </BaseMap>
  );
}
