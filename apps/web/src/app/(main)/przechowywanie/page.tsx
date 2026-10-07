'use client';
import { useEffect, useState } from 'react';
import {
  useStorageSettings, useSaveStorage, useTestStorage, useMigrateStorage,
  type StorageMigrateResult, type StorageProvider, type StorageTestResult,
} from '@/hooks/useStorage';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Cloud, HardDrive, CheckCircle2, XCircle, Loader2, ArrowRightLeft, PlugZap, Save,
} from 'lucide-react';

export default function StoragePage() {
  const { data, isLoading } = useStorageSettings();
  const saveMut = useSaveStorage();
  const testMut = useTestStorage();
  const migrateMut = useMigrateStorage();

  const [selected, setSelected] = useState<string>('Local');
  const [values, setValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<StorageTestResult | null>(null);
  const [migrateResult, setMigrateResult] = useState<StorageMigrateResult | null>(null);

  const provider: StorageProvider | undefined = data?.providers.find(p => p.provider === selected);
  const active = data?.activeProvider;

  // Po załadowaniu (i po każdym zapisie) pokaż aktywnego dostawcę z jego zapisanymi polami jawnymi.
  useEffect(() => {
    if (!data) return;
    setSelected(data.activeProvider);
    const p = data.providers.find(x => x.provider === data.activeProvider);
    setValues(p?.values ?? {});
  }, [data]);

  const choose = (p: StorageProvider) => {
    setSelected(p.provider);
    setValues(p.values);
    setTestResult(null);
    setMigrateResult(null);
  };

  const setField = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      setTestResult(await testMut.mutateAsync({ provider: selected, values }));
    } catch { /* błąd pokazuje globalny interceptor */ }
  };

  const handleSave = async () => {
    setTestResult(null);
    try {
      await saveMut.mutateAsync({ provider: selected, values });
      toast(selected === 'Local' ? 'Pliki będą zapisywane na dysku serwera.' : `Aktywny dostawca: ${provider?.label}.`, 'success');
    } catch { /* j.w. — komunikat (np. nieudany test połączenia) pokazuje interceptor */ }
  };

  const handleMigrate = async () => {
    if (!confirm('Przenieść załączniki z dysku serwera do aktywnej chmury? Pliki na dysku zostaną (nic nie jest kasowane).')) return;
    setMigrateResult(null);
    try {
      setMigrateResult(await migrateMut.mutateAsync());
    } catch { /* j.w. */ }
  };

  return (
    <div>
      <PageHeader
        icon={Cloud}
        title="Przechowywanie plików"
        subtitle="Gdzie fizycznie trafiają załączniki do zleceń"
      />

      <div className="max-w-3xl space-y-5 p-8">
        {isLoading || !data ? (
          <p className="py-16 text-center text-sm text-stone-400">Wczytywanie…</p>
        ) : (
          <>
            <section className="rounded-xl border border-stone-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-stone-700">Dostawca</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {data.providers.map(p => {
                  const Icon = p.isCloud ? Cloud : HardDrive;
                  const isSel = p.provider === selected;
                  return (
                    <button
                      key={p.provider}
                      type="button"
                      onClick={() => choose(p)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
                        isSel
                          ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-500'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isSel ? 'text-accent-600' : 'text-stone-400')} />
                      <span className="flex-1 text-sm font-medium text-stone-800">{p.label}</span>
                      {p.provider === active && <Badge tone="success">Aktywny</Badge>}
                    </button>
                  );
                })}
              </div>
              {provider && <p className="mt-3 text-xs text-stone-500">{provider.description}</p>}
            </section>

            {provider && provider.fields.length > 0 && (
              <section className="rounded-xl border border-stone-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-stone-700">Konfiguracja połączenia</h2>
                <p className="mb-4 mt-1 text-xs text-stone-400">
                  Dane są szyfrowane przed zapisem w bazie. Zapisane hasła i klucze nie są wyświetlane —
                  zostaw pole puste, żeby je zachować.
                </p>
                <div className="space-y-4">
                  {provider.fields.map(f => {
                    const secretSet = f.secret && provider.secretsSet.includes(f.key);
                    const label = f.required ? f.label : `${f.label} (opcjonalnie)`;
                    const placeholder = secretSet ? '•••••••• (zapisane)' : f.placeholder ?? '';
                    return (
                      <div key={f.key}>
                        {f.type === 'checkbox' ? (
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                            <input
                              type="checkbox"
                              checked={values[f.key] === 'true'}
                              onChange={e => setField(f.key, String(e.target.checked))}
                              className="h-4 w-4 rounded border-stone-300 accent-accent-500"
                            />
                            {f.label}
                          </label>
                        ) : f.type === 'textarea' ? (
                          <Textarea
                            label={label}
                            rows={4}
                            value={values[f.key] ?? ''}
                            onChange={e => setField(f.key, e.target.value)}
                            placeholder={placeholder}
                          />
                        ) : (
                          <Input
                            label={label}
                            type={f.type}
                            autoComplete="off"
                            value={values[f.key] ?? ''}
                            onChange={e => setField(f.key, e.target.value)}
                            placeholder={placeholder}
                          />
                        )}
                        {f.help && <p className="mt-1 text-xs text-stone-400">{f.help}</p>}
                      </div>
                    );
                  })}
                </div>

                {testResult && (
                  <div className={cn(
                    'mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                    testResult.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-red-200 bg-red-50 text-red-700'
                  )}>
                    {testResult.success
                      ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{testResult.success ? 'Połączenie działa — zapis i odczyt pliku próbnego się powiodły.' : testResult.error}</span>
                  </div>
                )}
              </section>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={saveMut.isPending || testMut.isPending}>
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {selected === 'Local' ? 'Użyj dysku serwera' : 'Zapisz i aktywuj'}
              </Button>
              {provider?.isCloud && (
                <Button variant="outline" onClick={handleTest} disabled={testMut.isPending || saveMut.isPending}>
                  {testMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />}
                  Testuj połączenie
                </Button>
              )}
              {provider?.isCloud && (
                <span className="text-xs text-stone-400">Zapis zawsze poprzedza automatyczny test połączenia.</span>
              )}
            </div>

            {active && active !== 'Local' && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <ArrowRightLeft className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-900">Przenieś istniejące załączniki</h3>
                    <p className="mb-3 mt-1 text-xs text-amber-800">
                      Nowe pliki trafiają od razu do aktywnej chmury, a stare nadal są czytane z miejsca, w którym
                      leżą. Jeśli chcesz mieć wszystko w jednym miejscu, przenieś pliki z dysku serwera.
                    </p>
                    <Button variant="outline" onClick={handleMigrate} disabled={migrateMut.isPending}>
                      {migrateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                      Przenieś pliki z dysku
                    </Button>
                    {migrateResult && (
                      <div className="mt-3 space-y-1 text-sm">
                        <p className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Przeniesiono: {migrateResult.succeeded}
                        </p>
                        {migrateResult.failed > 0 && (
                          <p className="flex items-center gap-1.5 text-red-600">
                            <XCircle className="h-4 w-4" /> Błędy: {migrateResult.failed}
                          </p>
                        )}
                        {migrateResult.errors.map((e, i) => (
                          <p key={i} className="pl-5 text-xs text-red-500">{e}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
