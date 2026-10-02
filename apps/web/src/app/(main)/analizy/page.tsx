'use client';
import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { useRequestAnalytics } from '@/hooks/useAnalytics';
import { useLocations } from '@/hooks/useLocations';
import { useServiceGroups } from '@/hooks/useServiceGroups';
import { useContractors } from '@/hooks/useContractors';
import { COMPANY_ID } from '@/lib/constants';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Stars } from '@/components/ui/stars';
import { BarChart3, Briefcase, HardHat } from 'lucide-react';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/types';

const COLORS = { onTime: '#15803d', early: '#b7791f', late: '#b91c1c', created: '#3a352f', completed: '#b7791f' };

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('pl-PL', { month: 'short', year: '2-digit' }).format(new Date(year, month - 1, 1));
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="text-xs font-medium text-stone-400">{label}</p>
        <p className="text-2xl font-semibold text-stone-900">{value}</p>
        {sub && <p className="text-xs text-stone-400">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => {
    const d = new Date(today); d.setMonth(d.getMonth() - 11); d.setDate(1);
    return d;
  }, [today]);

  const [fromDate, setFromDate] = useState(toIsoDate(defaultFrom));
  const [toDate, setToDate] = useState(toIsoDate(today));
  const [locationId, setLocationId] = useState('');
  const [serviceGroupId, setServiceGroupId] = useState('');
  const [contractorId, setContractorId] = useState('');

  const { data: locations } = useLocations(COMPANY_ID);
  const { data: serviceGroups } = useServiceGroups();
  const { data: contractors } = useContractors();

  const { data, isLoading } = useRequestAnalytics({
    companyId: COMPANY_ID, fromDate, toDate,
    locationId: locationId ? Number(locationId) : null,
    serviceGroupId: serviceGroupId ? Number(serviceGroupId) : null,
    contractorId: contractorId ? Number(contractorId) : null,
  });

  const monthlyChart = data?.monthly.map(m => ({
    label: monthLabel(m.year, m.month), Utworzone: m.created, Wykonane: m.completed,
  })) ?? [];

  const totalRated = (data?.onTimeCount ?? 0) + (data?.earlyCount ?? 0) + (data?.lateCount ?? 0);
  const timelinessChart = data ? [
    { name: 'Na czas', value: data.onTimeCount, color: COLORS.onTime },
    { name: 'Wcześniej', value: data.earlyCount, color: COLORS.early },
    { name: 'Opóźnione', value: data.lateCount, color: COLORS.late },
  ].filter(d => d.value > 0) : [];

  const onTimePercent = totalRated > 0 ? Math.round(((data!.onTimeCount + data!.earlyCount) / totalRated) * 100) : null;

  const statusChart = data?.statusBreakdown.filter(s => s.count > 0).map(s => ({
    name: REQUEST_STATUS_LABELS[s.status] ?? s.statusName, value: s.count, color: REQUEST_STATUS_COLORS[s.status],
  })) ?? [];

  return (
    <div>
      <PageHeader icon={BarChart3} title="Analizy" subtitle="Zlecenia w czasie, terminowość i ranking wykonawców" />

      <div className="space-y-6 p-8">
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Od</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700">Do</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25" />
            </div>
            <div className="w-56">
              <Select label="Lokalizacja" value={locationId} onChange={e => setLocationId(e.target.value)}>
                <option value="">Wszystkie</option>
                {locations?.map(l => <option key={l.id} value={l.id}>{'　'.repeat(l.level)}{l.name}</option>)}
              </Select>
            </div>
            <div className="w-56">
              <Select label="Grupa serwisowa" value={serviceGroupId} onChange={e => setServiceGroupId(e.target.value)}>
                <option value="">Wszystkie</option>
                {serviceGroups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>
            <div className="w-56">
              <Select label="Firma wykonawcza" value={contractorId} onChange={e => setContractorId(e.target.value)}>
                <option value="">Wszystkie</option>
                {contractors?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        {!data && isLoading ? (
          <EmptyState icon={BarChart3} title="Wczytywanie danych..." />
        ) : !data || data.totalRequests === 0 ? (
          <EmptyState icon={BarChart3} title="Brak zleceń w wybranym zakresie" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiTile label="Zlecenia w okresie" value={String(data.totalRequests)} />
              <KpiTile label="Wykonane na czas / wcześniej" value={onTimePercent !== null ? `${onTimePercent}%` : '—'}
                sub={totalRated > 0 ? `z ${totalRated} ocenionych terminowo` : 'brak danych'} />
              <KpiTile label="Opóźnione" value={String(data.lateCount)} />
              <KpiTile label="Wykonawcy z co najmniej 1 zleceniem" value={String(data.contractorRanking.length)} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Zlecenia miesiąc do miesiąca</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e4e0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#78716c' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} />
                      <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e7e4e0', fontSize: 13 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Utworzone" fill={COLORS.created} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Wykonane" fill={COLORS.completed} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Terminowość wykonania</CardTitle>
                </CardHeader>
                <CardContent>
                  {timelinessChart.length === 0 ? (
                    <EmptyState icon={BarChart3} title="Brak wykonanych zleceń z ustawioną datą planowaną i faktyczną" />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={timelinessChart} dataKey="value" nameKey="name" cx="50%" cy="50%"
                          outerRadius={90} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
                          {timelinessChart.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e7e4e0', fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statusy zleceń</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`}>
                        {statusChart.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e7e4e0', fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent-600" /> Ranking firm wykonawczych</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {data.contractorRanking.length === 0 ? (
                    <EmptyState icon={Briefcase} title="Brak przypisanych zleceń w tym okresie" />
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {data.contractorRanking.map(c => (
                        <div key={c.contractorId} className="flex items-center justify-between px-5 py-3 text-sm">
                          <span className="font-medium text-stone-800">{c.name}</span>
                          <div className="flex items-center gap-3 text-xs text-stone-400">
                            <span>{c.requestCount} zleceń</span>
                            {c.averageRating != null && <Stars value={c.averageRating} showCount count={c.ratingCount} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><HardHat className="h-4 w-4 text-accent-600" /> Ranking instalatorów</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {data.employeeRanking.length === 0 ? (
                    <EmptyState icon={HardHat} title="Brak zleceń przypisanych do konkretnego instalatora w tym okresie" />
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {data.employeeRanking.map(e => (
                        <div key={e.employeeId} className="flex items-center justify-between px-5 py-3 text-sm">
                          <span className="font-medium text-stone-800">{e.name}</span>
                          <div className="flex items-center gap-3 text-xs text-stone-400">
                            <span>{e.requestCount} zleceń</span>
                            {e.averageRating != null && <Stars value={e.averageRating} showCount count={e.ratingCount} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
