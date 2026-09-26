'use client';
import { useState } from 'react';
import { useRequests } from '@/hooks/useRequests';
import { COMPANY_ID } from '@/lib/constants';
import { CreateRequestDialog } from '@/components/requests/create-request-dialog';
import { RequestDetailDialog } from '@/components/requests/request-detail-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatDate, dayDifference } from '@/lib/utils';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/types';

const STATUS_TABS = [
  { value: undefined, label: 'Wszystkie' },
  { value: 1, label: 'Nowe' },
  { value: 2, label: 'Przypisane' },
  { value: 3, label: 'W trakcie' },
  { value: 4, label: 'Wykonane' },
  { value: 5, label: 'Anulowane' },
];

export default function RequestsPage() {
  const [status, setStatus] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const { requests, isLoading, totalCount } = useRequests(COMPANY_ID, { status, search });

  return (
    <div>
      <PageHeader
        icon={ClipboardList}
        title="Zlecenia"
        subtitle={`${totalCount} zleceń`}
        action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Nowe zlecenie</Button>}
      />

      <div className="p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg border border-stone-200 bg-white p-1 w-fit">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.label}
                onClick={() => setStatus(tab.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  status === tab.value ? 'bg-ink-900 text-white' : 'text-stone-500 hover:bg-stone-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj po numerze lub kliencie…" className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-stone-400">Wczytywanie…</p>
        ) : requests.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Brak zleceń" description="Utwórz pierwsze zlecenie dla klienta."
            action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Nowe zlecenie</Button>} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3 text-left">Numer</th>
                  <th className="px-5 py-3 text-left">Klient</th>
                  <th className="px-5 py-3 text-left">Przypisanie</th>
                  <th className="px-5 py-3 text-left">Planowana</th>
                  <th className="px-5 py-3 text-left">Faktyczna</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requests.map(r => {
                  const diff = dayDifference(r.scheduledDate, r.completionDate);
                  return (
                    <tr key={r.id} onClick={() => setDetailId(r.id)} className="cursor-pointer hover:bg-stone-50">
                      <td className="px-5 py-3 font-mono text-xs text-stone-500">{r.number}</td>
                      <td className="px-5 py-3 font-medium text-stone-900">{r.customerName}</td>
                      <td className="px-5 py-3 text-stone-500">
                        {r.employeeName ?? r.contractorName ?? r.serviceGroupName ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-stone-500">{r.scheduledDate ? formatDate(r.scheduledDate) : '—'}</td>
                      <td className="px-5 py-3 text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <span>{r.completionDate ? formatDate(r.completionDate) : '—'}</span>
                          {diff !== null && (
                            <Badge tone={diff === 0 ? 'success' : diff > 0 ? 'danger' : 'success'}>
                              {diff === 0 ? 'na czas' : diff > 0 ? `+${diff} dni` : `${diff} dni`}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge color={REQUEST_STATUS_COLORS[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateRequestDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <RequestDetailDialog requestId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
