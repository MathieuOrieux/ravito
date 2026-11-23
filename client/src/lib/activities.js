// Doit rester aligné avec server/src/lib/activities.js
export const ACTIVITIES = [
  { value: 'velo', label: 'Vélo route', icon: '🚴' },
  { value: 'gravel', label: 'Gravel', icon: '🚵' },
  { value: 'vtt', label: 'VTT', icon: '⛰️' },
  { value: 'course', label: 'Course à pied', icon: '🏃' },
  { value: 'marche', label: 'Marche', icon: '🥾' },
];

const byValue = Object.fromEntries(ACTIVITIES.map((a) => [a.value, a]));
export const activityOf = (value) => byValue[value] || { value, label: value, icon: '📍' };
