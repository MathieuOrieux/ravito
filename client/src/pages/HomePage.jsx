import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTraces } from '../api/traces.js';
import { OverviewMap } from '../components/maps/OverviewMap.jsx';
import { TraceCard } from '../components/TraceCard.jsx';
import { EmptyState, ErrorState, Spinner } from '../components/ui.jsx';
import { useAdmin } from '../features/admin/AdminContext.jsx';
import { ACTIVITIES } from '../lib/activities.js';
import { useDebouncedValue } from '../lib/useDebouncedValue.js';

const SORTS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'popular', label: 'Plus likées' },
  { value: 'distance', label: 'Plus courtes' },
  { value: 'name', label: 'Nom (A→Z)' },
];

export function HomePage() {
  const { isAdmin } = useAdmin();
  // Les filtres vivent dans l'URL : partageables et conservés au retour arrière.
  const [params, setParams] = useSearchParams();
  const activity = params.get('activity') || '';
  const sort = params.get('sort') || 'recent';
  const [search, setSearch] = useState(params.get('q') || '');
  const q = useDebouncedValue(search.trim());
  const [hoveredId, setHoveredId] = useState(null);

  const setParam = (key, value) =>
    setParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
      return p;
    }, { replace: true });

  useEffect(() => {
    if (q !== (params.get('q') || '')) setParam('q', q);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isPending, isError, error, refetch, isFetching } = useTraces({ q, activity, sort, limit: 100 });
  const traces = data?.items ?? [];
  const filtered = Boolean(q || activity);

  return (
    <div className="home">
      <section className="hero">
        <h1>Les traces du dimanche</h1>
        <p className="muted">Repère une sortie, télécharge le GPX, et like celles que tu as aimées.</p>
      </section>

      <div className="toolbar" role="search">
        <input
          type="search"
          className="input toolbar__search"
          placeholder="Rechercher une trace…"
          aria-label="Rechercher une trace"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Filtrer par activité">
          <button type="button" className="chip chip--btn" aria-pressed={!activity} onClick={() => setParam('activity', '')}>Toutes</button>
          {ACTIVITIES.map((a) => (
            <button key={a.value} type="button" className="chip chip--btn" aria-pressed={activity === a.value}
              onClick={() => setParam('activity', activity === a.value ? '' : a.value)}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
        <label className="toolbar__sort">
          <span className="sr-only">Trier</span>
          <select className="input" value={sort} onChange={(e) => setParam('sort', e.target.value === 'recent' ? '' : e.target.value)}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="home__layout">
        <section className="home__list" aria-label="Liste des traces" aria-busy={isFetching}>
          {isPending ? (
            <Spinner />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : traces.length === 0 ? (
            <EmptyState title={filtered ? 'Aucune trace ne correspond' : 'Aucune trace pour le moment'}>
              {filtered ? <span>Essaie un autre filtre.</span>
                : isAdmin ? <Link to="/traces/new" className="btn btn--primary">Ajouter la première trace</Link>
                  : <span>Reviens bientôt !</span>}
            </EmptyState>
          ) : (
            <>
              <p className="muted small">{data.total} trace{data.total > 1 ? 's' : ''}</p>
              <div className="trace-grid">
                {traces.map((t) => (
                  <TraceCard key={t.id} trace={t} active={t.id === hoveredId} onHover={setHoveredId} />
                ))}
              </div>
            </>
          )}
        </section>
        <aside className="home__map" aria-label="Carte des traces">
          <OverviewMap traces={traces} activeId={hoveredId} onHover={setHoveredId} />
        </aside>
      </div>
    </div>
  );
}
