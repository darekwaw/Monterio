import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** API zwraca UTC bez 'Z' — bez tego przeglądarka traktuje znacznik jako czas lokalny. */
function parseApiDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  const hasTimezone = date.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(date);
  return new Date(hasTimezone ? date : date + 'Z');
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(parseApiDate(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(parseApiDate(date));
}

/** Różnica w dniach między planowaną a faktyczną realizacją. Dodatnia = opóźnienie. */
export function dayDifference(
  scheduled: string | Date | null | undefined, completed: string | Date | null | undefined
): number | null {
  if (!scheduled || !completed) return null;
  const toMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const ms = toMidnight(parseApiDate(completed)) - toMidnight(parseApiDate(scheduled));
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function formatDayDifference(
  scheduled: string | Date | null | undefined, completed: string | Date | null | undefined
): string | null {
  const days = dayDifference(scheduled, completed);
  if (days === null) return null;
  if (days === 0) return 'na czas';
  return days > 0 ? `+${days} dni opóźnienia` : `${days} dni wcześniej`;
}
