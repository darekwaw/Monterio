import type { RequestListFilter, RequestListItem } from '@/types';

export const REQUEST_FILTER_LABELS: Record<RequestListFilter, string> = {
  today: 'Dziś',
  inprogress: 'W trakcie',
  pool: 'Do przejęcia',
  week: 'Ten tydzień',
  month: 'Wykonane w miesiącu',
};

export function isRequestListFilter(v: unknown): v is RequestListFilter {
  return typeof v === 'string' && v in REQUEST_FILTER_LABELS;
}

/** Te same reguły co liczniki w GET /api/me/dashboard (GetInstallerDashboardQuery) — kafelek
 * pulpitu i lista po kliknięciu muszą pokazywać tyle samo zleceń. Zmieniasz tu — zmień tam. */
export function matchesFilter(r: RequestListItem, filter: RequestListFilter): boolean {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sched = r.scheduledDate ? new Date(r.scheduledDate) : null;

  switch (filter) {
    case 'today':
      return r.isMine && r.status !== 5 && !!sched
        && sched >= dayStart && sched < new Date(dayStart.getTime() + 86_400_000);
    case 'inprogress':
      return r.isMine && r.status === 3;
    case 'pool':
      return r.canClaim && (r.status === 1 || r.status === 2);
    case 'week': {
      const weekStart = new Date(dayStart.getTime() - ((dayStart.getDay() + 6) % 7) * 86_400_000);
      return r.isMine && (r.status === 2 || r.status === 3) && !!sched
        && sched >= weekStart && sched < new Date(weekStart.getTime() + 7 * 86_400_000);
    }
    case 'month': {
      const done = r.completionDate ? new Date(r.completionDate) : null;
      return r.isMine && r.status === 4 && !!done
        && done.getFullYear() === now.getFullYear() && done.getMonth() === now.getMonth();
    }
  }
}
