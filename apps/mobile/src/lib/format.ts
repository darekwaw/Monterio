export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

/** "dziś, 10:00" / "jutro, 10:00" / "14.10.2026, 10:00" — do karty następnego zlecenia. */
export function formatWhen(iso: string | null): string {
  if (!iso) return 'termin nieustalony';
  const d = new Date(iso);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) / 86_400_000);
  const day = days === 0 ? 'dziś' : days === 1 ? 'jutro' : formatDate(iso);
  return `${day}, ${formatTime(iso)}`;
}

export function formatLongDate(d: Date): string {
  const s = d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
