import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { request } from '../../api/client.js';
import { getAdminToken, setAdminToken } from '../../lib/admin.js';

const AdminContext = createContext(null);

/** Mode admin : la clé est vérifiée par l'API puis gardée dans le navigateur. */
export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => Boolean(getAdminToken()));

  const login = useCallback(async (token) => {
    const previous = getAdminToken();
    setAdminToken(token);
    try {
      await request('/auth/check', { admin: true });
      setIsAdmin(true);
    } catch (err) {
      setAdminToken(previous);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setAdminToken('');
    setIsAdmin(false);
  }, []);

  const value = useMemo(() => ({ isAdmin, login, logout }), [isAdmin, login, logout]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin doit être utilisé dans <AdminProvider>');
  return ctx;
}
