import { useEffect, useMemo } from 'react';
import { Polyline, Tooltip, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router';
import { COLORS } from '../../lib/theme.js';
import { BaseMap } from './BaseMap.jsx';

function FitAll({ traces }) {
  const map = useMap();
  const key = traces.map((t) => t.id).join(',');
  useEffect(() => {
    if (!traces.length) return;
    const [[a, b], [c, d]] = traces.reduce(
      ([[minLat, minLon], [maxLat, maxLon]], t) => [
        [Math.min(minLat, t.bbox[0][0]), Math.min(minLon, t.bbox[0][1])],
        [Math.max(maxLat, t.bbox[1][0]), Math.max(maxLon, t.bbox[1][1])],
      ],
      [[90, 180], [-90, -180]],
    );
    map.fitBounds([[a, b], [c, d]], { padding: [24, 24], animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/** Toutes les traces de la liste sur une carte ; la trace survolée est mise en avant. */
export function OverviewMap({ traces, activeId, onHover }) {
  const navigate = useNavigate();
  // La trace active est dessinée en dernier pour passer au-dessus.
  const ordered = useMemo(
    () => [...traces].sort((a, b) => (a.id === activeId) - (b.id === activeId)),
    [traces, activeId],
  );
  return (
    <BaseMap className="map--overview">
      <FitAll traces={traces} />
      {ordered.map((t) => {
        const active = t.id === activeId;
        return (
          <Polyline
            key={`${t.id}-${active}`}
            positions={t.preview}
            pathOptions={{
              color: active ? COLORS.accent : COLORS.route,
              weight: active ? 6 : 4,
              opacity: activeId && !active ? 0.45 : 0.95,
            }}
            eventHandlers={{
              click: () => navigate(`/traces/${t.id}`),
              mouseover: () => onHover?.(t.id),
              mouseout: () => onHover?.(null),
            }}
          >
            <Tooltip sticky>{t.name}</Tooltip>
          </Polyline>
        );
      })}
    </BaseMap>
  );
}
