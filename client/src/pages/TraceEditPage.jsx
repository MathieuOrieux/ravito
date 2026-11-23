import { Link, useNavigate, useParams } from 'react-router';
import { useTrace, useUpdateTrace } from '../api/traces.js';
import { ErrorState, Spinner } from '../components/ui.jsx';
import { TraceForm } from '../features/traces/TraceForm.jsx';

export function TraceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: trace, isPending, isError, error } = useTrace(id);
  const update = useUpdateTrace(id);

  if (isPending) return <Spinner />;
  if (isError) return <ErrorState error={error} />;

  return (
    <div className="page-narrow">
      <Link to={`/traces/${id}`} className="back-link">← Retour à la trace</Link>
      <h1>Modifier « {trace.name} »</h1>
      <TraceForm
        key={trace.id}
        initial={trace}
        submitLabel="Enregistrer"
        submitting={update.isPending}
        error={update.error}
        onSubmit={({ name, description, activity }) =>
          update.mutate({ name, description, activity }, { onSuccess: () => navigate(`/traces/${id}`) })
        }
        onCancel={() => navigate(`/traces/${id}`)}
      />
    </div>
  );
}
