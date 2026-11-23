import { Navigate, Outlet, useLocation } from 'react-router';
import { useAdmin } from './AdminContext.jsx';

export function RequireAdmin() {
  const { isAdmin } = useAdmin();
  const location = useLocation();
  if (!isAdmin) return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
