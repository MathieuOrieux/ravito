import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useAdmin } from '../features/admin/AdminContext.jsx';

export function Layout() {
  const { isAdmin, logout } = useAdmin();
  const { pathname } = useLocation();
  // Nouvelle page => on repart du haut (les filtres de l'accueil ne changent que la query string).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="app">
      <a className="skip-link" href="#main">Aller au contenu</a>
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand" aria-label="Ravito, accueil">
            <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
              <rect width="32" height="32" rx="8" className="brand__bg" />
              <path d="M6 22c4-10 7-12 10-6s6 4 10-8" className="brand__line" />
            </svg>
            <span>Ravito</span>
          </Link>
          <nav className="topbar__nav">
            <NavLink to="/" end>Traces</NavLink>
            {isAdmin ? (
              <>
                <Link to="/traces/new" className="btn btn--primary btn--sm">+ Ajouter une trace</Link>
                <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>Quitter le mode admin</button>
              </>
            ) : (
              <NavLink to="/admin">Admin</NavLink>
            )}
          </nav>
        </div>
      </header>
      <main id="main" className="container main">
        <Outlet />
      </main>
      <footer className="container footer">
        Fonds de carte © contributeurs <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
      </footer>
    </div>
  );
}
