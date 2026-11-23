// Vignette SVG du tracé (à partir de l'aperçu allégé fourni par l'API).
export function RoutePreview({ points, className = '' }) {
  if (!points?.length) return <div className={`route-preview ${className}`} />;
  const lats = points.map((p) => p[0]);
  const lons = points.map((p) => p[1]);
  const [minLat, maxLat, minLon, maxLon] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  // Correction de l'aplatissement des longitudes selon la latitude
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const w = (maxLon - minLon) * k || 1e-6;
  const h = maxLat - minLat || 1e-6;
  const scale = 90 / Math.max(w, h);
  const ox = (100 - w * scale) / 2;
  const oy = (100 - h * scale) / 2;
  const d = points
    .map(([lat, lon], i) => `${i ? 'L' : 'M'}${(ox + (lon - minLon) * k * scale).toFixed(1)},${(oy + (maxLat - lat) * scale).toFixed(1)}`)
    .join('');
  return (
    <svg className={`route-preview ${className}`} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
