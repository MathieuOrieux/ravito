import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout.jsx';
import { RequireAdmin } from './features/admin/RequireAdmin.jsx';
import { AdminLoginPage } from './pages/AdminLoginPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { TraceEditPage } from './pages/TraceEditPage.jsx';
import { TraceNewPage } from './pages/TraceNewPage.jsx';
import { TracePage } from './pages/TracePage.jsx';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="traces/:id" element={<TracePage />} />
        <Route path="admin" element={<AdminLoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="traces/new" element={<TraceNewPage />} />
          <Route path="traces/:id/edit" element={<TraceEditPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
