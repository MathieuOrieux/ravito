import { useNavigate } from 'react-router';
import { useCreateTrace } from '../api/traces.js';
import { TraceForm } from '../features/traces/TraceForm.jsx';

export function TraceNewPage() {
  const navigate = useNavigate();
  const create = useCreateTrace();

  const handleSubmit = ({ name, description, activity, file }) => {
    const form = new FormData();
    form.append('gpx', file);
    form.append('name', name);
    form.append('description', description);
    form.append('activity', activity);
    create.mutate(form, { onSuccess: (trace) => navigate(`/traces/${trace.id}`) });
  };

  return (
    <div className="page-narrow">
      <h1>Ajouter une trace</h1>
      <p className="muted">Distance, dénivelé et profil sont calculés automatiquement depuis le GPX.</p>
      <TraceForm withFile submitLabel="Publier la trace" submitting={create.isPending} error={create.error}
        onSubmit={handleSubmit} onCancel={() => navigate(-1)} />
    </div>
  );
}
