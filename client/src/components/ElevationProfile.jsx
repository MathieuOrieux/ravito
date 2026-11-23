import { useMemo, useState } from 'react';
import { formatKm, formatMeters } from '../lib/format.js';

const W = 800;
const H = 180;
const PAD = { top: 12, right: 12, bottom: 24, left: 44 };

function distance([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const r = (d) => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Profil altimétrique en SVG. `onHover([lat, lon] | null)` permet de suivre le point sur la carte. */
export function ElevationProfile({ geometry, onHover }) {
  const data = useMemo(() => {
    let d = 0;
    const pts = [];
    geometry.forEach((p, i) => {
      if (i) d += distance(geometry[i - 1], p);
      if (p[2] != null) pts.push({ d, ele: p[2], lat: p[0], lon: p[1] });
    });
    return pts;
  }, [geometry]);
  const [hover, setHover] = useState(null);

  if (data.length < 2) return <p className="muted">Pas de données d'altitude dans ce GPX.</p>;

  const maxD = data[data.length - 1].d || 1;
  const eles = data.map((p) => p.ele);
  let minE = Math.min(...eles);
  let maxE = Math.max(...eles);
  const margin = Math.max(10, (maxE - minE) * 0.15);
  minE = Math.floor((minE - margin) / 10) * 10;
  maxE = Math.ceil((maxE + margin) / 10) * 10;

  const x = (d) => PAD.left + (d / maxD) * (W - PAD.left - PAD.right);
  const y = (e) => PAD.top + (1 - (e - minE) / (maxE - minE)) * (H - PAD.top - PAD.bottom);
  const line = data.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.ele).toFixed(1)}`).join('');
  const area = `${line}L${x(maxD)},${H - PAD.bottom}L${x(0)},${H - PAD.bottom}Z`;
  const yTicks = [minE, Math.round((minE + maxE) / 2), maxE];
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxD);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const d = ((e.clientX - rect.left) / rect.width * W - PAD.left) / (W - PAD.left - PAD.right) * maxD;
    let best = data[0];
    for (const p of data) if (Math.abs(p.d - d) < Math.abs(best.d - d)) best = p;
    setHover(best);
    onHover?.([best.lat, best.lon]);
  };
  const handleLeave = () => {
    setHover(null);
    onHover?.(null);
  };

  return (
    <figure className="profile">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Profil altimétrique, de ${formatMeters(Math.min(...eles))} à ${formatMeters(Math.max(...eles))}`}
        onPointerMove={handleMove} onPointerLeave={handleLeave}>
        <defs>
          <linearGradient id="profile-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="profile__stop" stopOpacity="0.45" />
            <stop offset="100%" className="profile__stop" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="profile__grid" />
            <text x={PAD.left - 6} y={y(t)} className="profile__label" textAnchor="end" dominantBaseline="middle">{t} m</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 6} className="profile__label" textAnchor="middle">{formatKm(t)}</text>
        ))}
        <path d={area} fill="url(#profile-fill)" />
        <path d={line} className="profile__line" />
        {hover && (
          <g>
            <line x1={x(hover.d)} x2={x(hover.d)} y1={PAD.top} y2={H - PAD.bottom} className="profile__cursor" />
            <circle cx={x(hover.d)} cy={y(hover.ele)} r="4" className="profile__dot" />
          </g>
        )}
      </svg>
      <figcaption className="profile__caption" aria-live="polite">
        {hover ? `${formatKm(hover.d)} · ${formatMeters(hover.ele)}` : 'Survole le profil pour suivre la trace sur la carte'}
      </figcaption>
    </figure>
  );
}
