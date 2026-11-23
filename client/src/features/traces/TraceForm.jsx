import { useId, useState } from 'react';
import { Field } from '../../components/ui.jsx';
import { ACTIVITIES } from '../../lib/activities.js';

const FIELDS = ['name', 'activity', 'description', 'gpx'];
const errorFor =(error, field) => error?.details?.find((d) => d.field === field)?.message;

/**
 * Formulaire partagé création / modification.
 * En création (`withFile`), le fichier GPX est obligatoire et le nom facultatif (repris du GPX).
 */
export function TraceForm({ initial = {}, withFile = false, submitting, error, submitLabel, onSubmit, onCancel }) {
  const id = useId();
  const [name, setName] = useState(initial.name ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [activity, setActivity] = useState(initial.activity ?? 'velo');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const pickFile = (f) => {
    if (!f) return;
    if (!/\.gpx$/i.test(f.name)) {
      setLocalError('Choisis un fichier .gpx');
      return;
    }
    setLocalError(null);
    setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (withFile && !file) {
      setLocalError('Ajoute un fichier GPX');
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim(), activity, file });
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {withFile && (
        <Field label="Fichier GPX" htmlFor={`${id}-file`} error={localError || errorFor(error, 'gpx')}>
          <label
            htmlFor={`${id}-file`}
            className={`dropzone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
          >
            {file ? (
              <span><strong>{file.name}</strong> · {(file.size / 1024).toFixed(0)} Ko — clique pour changer</span>
            ) : (
              <span><strong>Dépose ton fichier .gpx ici</strong> ou clique pour le choisir</span>
            )}
            <input id={`${id}-file`} type="file" accept=".gpx,application/gpx+xml" className="sr-only"
              onChange={(e) => pickFile(e.target.files[0])} />
          </label>
        </Field>
      )}

      <Field label="Nom" htmlFor={`${id}-name`} error={errorFor(error, 'name')}
        hint={withFile ? 'Facultatif : par défaut, le nom contenu dans le GPX.' : undefined}>
        <input id={`${id}-name`} className="input" value={name} maxLength={120} required={!withFile}
          onChange={(e) => setName(e.target.value)} placeholder="Vallée du Cens" />
      </Field>

      <Field label="Activité" htmlFor={`${id}-activity`} error={errorFor(error, 'activity')}>
        <select id={`${id}-activity`} className="input" value={activity} onChange={(e) => setActivity(e.target.value)}>
          {ACTIVITIES.map((a) => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
        </select>
      </Field>

      <Field label="Description" htmlFor={`${id}-desc`} error={errorFor(error, 'description')}
        hint={`${description.length}/2000 — revêtement, passages délicats, ravito…`}>
        <textarea id={`${id}-desc`} className="input" rows={5} maxLength={2000} value={description}
          onChange={(e) => setDescription(e.target.value)} />
      </Field>

      {/* Erreur générale, si elle n'est pas déjà affichée sous un champ */}
      {error && !error.details?.some((d) => FIELDS.includes(d.field)) && (
        <p className="form__error" role="alert">{error.message}</p>
      )}

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : submitLabel}
        </button>
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>}
      </div>
    </form>
  );
}
