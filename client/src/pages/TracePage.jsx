import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { gpxDownloadUrl } from '../api/client.js';
import { useDeleteTrace, useTrace } from '../api/traces.js';
import { ElevationProfile } from '../components/ElevationProfile.jsx';
import { LikeButton } from '../components/LikeButton.jsx';
import { TraceMap } from '../components/maps/TraceMap.jsx';
import { ErrorState, Spinner } from '../components/ui.jsx';
import { useAdmin } from '../features/admin/AdminContext.jsx';
import { activityOf } from '../lib/activities.js';
import { formatDate, formatKm, formatMeters } from '../lib/format.js';

export function TracePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { data: trace, isPending, isError, error, refetch } = useTrace(id);
  const remove = useDeleteTrace();
  const [highlight, setHighlight] = useState(null);

  if (isPending) return <Spinner />;
  if (isError) {
    return (
      <div className="page-narrow">
        <ErrorState error={error} onRetry={error.status === 404 ? undefined : refetch} />
        <Link to="/" className="back-link">← Toutes les traces</Link>
      </div>
    );
  }

  const activity = activityOf(trace.activity);
  const { stats } = trace;

  const handleDelete = () => {
    if (!window.confirm(`Supprimer définitivement « ${trace.name} » et ses likes ?`)) return;
    remove.mutate(trace.id, { onSuccess: () => navigate('/', { replace: true }) });
  };

  return (
    <article className="trace-page">
      <Link to="/" className="back-link">← Toutes les traces</Link>

      <header className="trace-page__header">
        <div>
          <span className="chip">{activity.icon} {activity.label}</span>
          <h1>{trace.name}</h1>
          <p className="muted small">Ajoutée le {formatDate(trace.createdAt)}</p>
        </div>
        <div className="trace-page__actions">
          <LikeButton trace={trace} />
          <a className="btn btn--primary" href={gpxDownloadUrl(trace.id)} download={trace.gpxFilename}>
            Télécharger le GPX
          </a>
          {isAdmin && (
            <>
              <Link className="btn btn--ghost" to={`/traces/${trace.id}/edit`}>Modifier</Link>
              <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={remove.isPending}>
                {remove.isPending ? 'Suppression…' : 'Supprimer'}
              </button>
            </>
          )}
        </div>
      </header>
      {remove.isError && <ErrorState error={remove.error} />}

      <dl className="stat-tiles">
        <div className="stat-tile"><dt>Distance</dt><dd>{formatKm(stats.distanceM)}</dd></div>
        <div className="stat-tile"><dt>Dénivelé +</dt><dd>{formatMeters(stats.elevationGainM)}</dd></div>
        <div className="stat-tile"><dt>Dénivelé −</dt><dd>{formatMeters(stats.elevationLossM)}</dd></div>
        <div className="stat-tile"><dt>Altitude</dt><dd>{stats.minElevationM == null ? '—' : `${stats.minElevationM}–${stats.maxElevationM} m`}</dd></div>
      </dl>

      <TraceMap trace={trace} highlight={highlight} />

      <section className="panel">
        <h2 className="panel__title">Profil</h2>
        <ElevationProfile geometry={trace.geometry} onHover={setHighlight} />
      </section>

      {trace.description && (
        <section className="panel">
          <h2 className="panel__title">Description</h2>
          <p className="prose">{trace.description}</p>
        </section>
      )}
    </article>
  );
}
