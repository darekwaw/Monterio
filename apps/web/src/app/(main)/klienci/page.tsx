'use client';
import { useState } from 'react';
import { useCustomers, useCustomerById } from '@/hooks/useCustomers';
import { COMPANY_ID } from '@/lib/constants';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, Pencil, Search } from 'lucide-react';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<{ open: boolean; editId?: number }>({ open: false });
  const { customers, isLoading, totalCount } = useCustomers(COMPANY_ID, { search });
  const { data: editCustomer } = useCustomerById(dialog.editId ?? null);

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Klienci"
        subtitle={`${totalCount} klientów`}
        action={<Button onClick={() => setDialog({ open: true })}><Plus className="h-4 w-4" /> Nowy klient</Button>}
      />

      <div className="p-8">
        <div className="mb-4 max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj po nazwie…" className="pl-9" />
          </div>
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-stone-400">Wczytywanie…</p>
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="Brak klientów" description="Dodaj pierwszego klienta, żeby założyć zlecenie."
            action={<Button onClick={() => setDialog({ open: true })}><Plus className="h-4 w-4" /> Nowy klient</Button>} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3 text-left">Imię i nazwisko</th>
                  <th className="px-5 py-3 text-left">Lokalizacja</th>
                  <th className="px-5 py-3 text-left">Kontakt</th>
                  <th className="px-5 py-3 text-left">Stan</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3 font-medium text-stone-900">{c.name}</td>
                    <td className="px-5 py-3 text-stone-500">{c.locationName ?? '—'}</td>
                    <td className="px-5 py-3 text-stone-500">{c.phone ?? c.email ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Aktywny' : 'Nieaktywny'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setDialog({ open: true, editId: c.id })}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        editCustomer={editCustomer ?? null}
      />
    </div>
  );
}
