import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Field } from '../components/ui.jsx';
import { useAdmin } from '../features/admin/AdminContext.jsx';

export function AdminLoginPage() {
  const { isAdmin, login, logout } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  if (isAdmin) {
    return (
      <div className="page-narrow">
        <h1>Mode admin actif</h1>
        <p className="muted">Tu peux ajouter, modifier et supprimer des traces.</p>
        <div className="form__actions">
          <Link to="/traces/new" className="btn btn--primary">Ajouter une trace</Link>
          <button type="button" className="btn btn--ghost" onClick={logout}>Quitter le mode admin</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(token.trim());
      navigate(location.state?.from || '/traces/new', { replace: true });
    } catch (err) {
      setError(err.status === 401 ? 'Clé incorrecte.' : err.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="page-narrow">
      <h1>Accès admin</h1>
      <p className="muted">La clé admin (variable <code>ADMIN_TOKEN</code> du serveur) permet de gérer les traces.</p>
      <form className="form" onSubmit={handleSubmit}>
        <Field label="Clé admin" htmlFor="admin-token" error={error}>
          <input id="admin-token" type="password" className="input" autoComplete="current-password"
            value={token} onChange={(e) => setToken(e.target.value)} required />
        </Field>
        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={pending || !token.trim()}>
            {pending ? 'Vérification…' : 'Entrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
