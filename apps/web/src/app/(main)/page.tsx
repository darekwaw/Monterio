'use client';
import Link from 'next/link';
import { useRequests } from '@/hooks/useRequests';
import { useCustomers } from '@/hooks/useCustomers';
import { COMPANY_ID } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/types';
import {
  LayoutDashboard, ClipboardList, Users, Clock, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50">
          <Icon className="h-5 w-5 text-accent-600" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight text-stone-900">{value}</p>
          <p className="text-sm text-stone-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { requests, totalCount } = useRequests(COMPANY_ID, { pageSize: 8 });
  const { totalCount: customerCount } = useCustomers(COMPANY_ID, { pageSize: 1 });

  const activeCount = requests.filter(r => r.status === 2 || r.status === 3).length;
  const doneCount = requests.filter(r => r.status === 4).length;

  return (
    <div>
      <div className="border-b border-stone-200 bg-white px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50">
            <LayoutDashboard className="h-4.5 w-4.5 text-accent-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-stone-900">Dashboard</h1>
            <p className="text-sm text-stone-400">Przegląd zleceń i klientów Bel-Pol</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Wszystkie zlecenia" value={totalCount} icon={ClipboardList} />
          <StatCard label="W toku" value={activeCount} icon={Clock} />
          <StatCard label="Wykonane" value={doneCount} icon={CheckCircle2} />
          <StatCard label="Klienci" value={customerCount} icon={Users} />
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-stone-900">Ostatnie zlecenia</h3>
            <Link href="/zlecenia" className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700">
              Zobacz wszystkie <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {requests.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-stone-400">Brak zleceń — utwórz pierwsze w zakładce Zlecenia.</p>
            ) : requests.map(r => (
              <Link
                key={r.id}
                href="/zlecenia"
                className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-stone-50"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-stone-400">{r.number}</span>
                  <span className="font-medium text-stone-800">{r.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  {r.scheduledDate && <span className="text-xs text-stone-400">{formatDate(r.scheduledDate)}</span>}
                  <Badge color={REQUEST_STATUS_COLORS[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
