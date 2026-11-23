import { Link } from 'react-router';
import { EmptyState } from '../components/ui.jsx';

export function NotFoundPage() {
  return (
    <EmptyState title="Page introuvable">
      <Link to="/" className="btn btn--primary">Retour aux traces</Link>
    </EmptyState>
  );
}
