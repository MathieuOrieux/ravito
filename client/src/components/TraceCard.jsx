import { Link } from 'react-router';
import { activityOf } from '../lib/activities.js';
import { formatKm, formatMeters } from '../lib/format.js';
import { LikeButton } from './LikeButton.jsx';
import { RoutePreview } from './RoutePreview.jsx';

export function TraceCard({ trace, active, onHover }) {
  const activity = activityOf(trace.activity);
  return (
    <article
      className={`trace-card${active ? ' is-active' : ''}`}
      onMouseEnter={() => onHover?.(trace.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <Link to={`/traces/${trace.id}`} className="trace-card__link">
        <RoutePreview points={trace.preview} className="trace-card__preview" />
        <div className="trace-card__body">
          <span className="chip">{activity.icon} {activity.label}</span>
          <h3 className="trace-card__title">{trace.name}</h3>
          <dl className="stats-inline">
            <div><dt>Distance</dt><dd>{formatKm(trace.stats.distanceM)}</dd></div>
            <div><dt>D+</dt><dd>{formatMeters(trace.stats.elevationGainM)}</dd></div>
          </dl>
          {trace.description && <p className="trace-card__desc">{trace.description}</p>}
        </div>
      </Link>
      <div className="trace-card__like">
        <LikeButton trace={trace} size="sm" />
      </div>
    </article>
  );
}
