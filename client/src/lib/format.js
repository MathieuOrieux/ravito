const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const df = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatKm = (m) => `${nf1.format(m / 1000)} km`;
export const formatMeters = (m) => (m == null ? '—' : `${nf0.format(m)} m`);
export const formatDate = (iso) => df.format(new Date(iso));
