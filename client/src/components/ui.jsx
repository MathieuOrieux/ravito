// Petits composants d'interface partagés.

export function Spinner({ label = 'Chargement…' }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <strong>Oups.</strong>
      <span>{error?.message || 'Une erreur est survenue.'}</span>
      {onRetry && <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>Réessayer</button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state state--empty">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={htmlFor} className="field__label">{label}</label>
      {children}
      {error ? <p className="field__error">{error}</p> : hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}
