// Appels API + hooks React Query pour les traces et les likes.
// Pour une nouvelle ressource (commentaires, comptes…), crée un fichier frère sur ce modèle.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { request } from './client.js';

export const traceKeys = {
  all: ['traces'],
  list: (filters) => ['traces', 'list', filters],
  detail: (id) => ['traces', 'detail', id],
};

export const tracesApi = {
  list: (filters) => request('/traces', { query: filters }),
  get: (id) => request(`/traces/${id}`),
  create: (formData) => request('/traces', { method: 'POST', body: formData, admin: true }),
  update: (id, fields) => request(`/traces/${id}`, { method: 'PATCH', body: fields, admin: true }),
  remove: (id) => request(`/traces/${id}`, { method: 'DELETE', admin: true }),
  like: (id) => request(`/traces/${id}/like`, { method: 'PUT' }),
  unlike: (id) => request(`/traces/${id}/like`, { method: 'DELETE' }),
};

export function useTraces(filters) {
  return useQuery({
    queryKey: traceKeys.list(filters),
    queryFn: () => tracesApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useTrace(id) {
  return useQuery({ queryKey: traceKeys.detail(id), queryFn: () => tracesApi.get(id), enabled: Boolean(id) });
}

export function useCreateTrace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tracesApi.create,
    onSuccess: (trace) => {
      qc.setQueryData(traceKeys.detail(trace.id), trace);
      qc.invalidateQueries({ queryKey: traceKeys.all });
    },
  });
}

export function useUpdateTrace(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields) => tracesApi.update(id, fields),
    onSuccess: (trace) => {
      qc.setQueryData(traceKeys.detail(id), trace);
      qc.invalidateQueries({ queryKey: traceKeys.all });
    },
  });
}

export function useDeleteTrace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tracesApi.remove,
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: traceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: traceKeys.all });
    },
  });
}

/** Applique `patch` à la trace `id` partout où elle est en cache (liste(s) + détail). */
function patchTraceInCache(qc, id, patch) {
  qc.setQueriesData({ queryKey: ['traces', 'list'] }, (old) =>
    old ? { ...old, items: old.items.map((t) => (t.id === id ? { ...t, ...patch(t) } : t)) } : old,
  );
  qc.setQueryData(traceKeys.detail(id), (old) => (old ? { ...old, ...patch(old) } : old));
}

/** Like / unlike avec mise à jour optimiste (le cœur réagit tout de suite). */
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }) => (liked ? tracesApi.unlike(id) : tracesApi.like(id)),
    onMutate: async ({ id, liked }) => {
      await qc.cancelQueries({ queryKey: traceKeys.all });
      const snapshot = qc.getQueriesData({ queryKey: traceKeys.all });
      patchTraceInCache(qc, id, (t) => ({ liked: !liked, likeCount: t.likeCount + (liked ? -1 : 1) }));
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSuccess: (state, { id }) => patchTraceInCache(qc, id, () => state),
  });
}
