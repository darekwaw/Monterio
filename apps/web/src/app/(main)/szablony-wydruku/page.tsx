'use client';
import { useState } from 'react';
import {
  usePrintTemplates, useCreatePrintTemplate, useUpdatePrintTemplate, useSetDefaultPrintTemplate,
} from '@/hooks/usePrintTemplates';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';
import { FileText, Plus, Star } from 'lucide-react';
import type { PrintTemplate } from '@/types';

const TOKENS: { token: string; description: string }[] = [
  { token: 'numer_zlecenia', description: 'Numer zlecenia (np. ZL/2026/0001)' },
  { token: 'data_utworzenia', description: 'Data założenia zlecenia' },
  { token: 'data_wykonania', description: 'Planowana data realizacji (deklarowana przez klienta)' },
  { token: 'data_realizacji', description: 'Faktyczna data realizacji' },
  { token: 'roznica_dni', description: 'Różnica w dniach: planowana vs faktyczna (np. "+2 dni opóźnienia")' },
  { token: 'klient_nazwa', description: 'Imię i nazwisko / nazwa klienta' },
  { token: 'klient_telefon', description: 'Telefon klienta' },
  { token: 'klient_adres', description: 'Adres klienta' },
  { token: 'adres_wykonania', description: 'Adres wykonania zlecenia (jeśli brak — adres klienta)' },
  { token: 'lokalizacja', description: 'Lokalizacja (oddział/punkt) zlecenia' },
  { token: 'opis', description: 'Opis zlecenia' },
  { token: 'grupa_serwisowa', description: 'Przypisana grupa serwisowa' },
  { token: 'firma_wykonawcza', description: 'Przypisana firma wykonawcza' },
  { token: 'instalator', description: 'Przypisany instalator' },
  { token: 'tabela_uslug', description: 'Tabela usług/czynności z wynikami pomiarów (gotowy HTML)' },
];

const DEFAULT_TEMPLATE_HTML = `<h1>Protokół zlecenia {{numer_zlecenia}}</h1>
<p><strong>Klient:</strong> {{klient_nazwa}}<br/>
<strong>Telefon:</strong> {{klient_telefon}}<br/>
<strong>Adres:</strong> {{klient_adres}}</p>
<p><strong>Lokalizacja:</strong> {{lokalizacja}}<br/>
<strong>Planowana realizacja:</strong> {{data_wykonania}}<br/>
<strong>Instalator:</strong> {{instalator}} ({{firma_wykonawcza}})</p>
{{tabela_uslug}}
<p style="margin-top:40px;">Podpis klienta: ____________________</p>`;

export default function PrintTemplatesPage() {
  const { data: templates, isLoading } = usePrintTemplates();
  const createMut = useCreatePrintTemplate();
  const updateMut = useUpdatePrintTemplate();
  const setDefaultMut = useSetDefaultPrintTemplate();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [templateHtml, setTemplateHtml] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [dirty, setDirty] = useState(false);

  const selected = templates?.find(t => t.id === selectedId) ?? null;

  const select = (t: PrintTemplate) => {
    setSelectedId(t.id);
    setName(t.name); setTemplateHtml(t.templateHtml); setIsActive(t.isActive);
    setDirty(false);
  };

  const startNew = () => {
    setSelectedId(null);
    setName('Nowy szablon'); setTemplateHtml(DEFAULT_TEMPLATE_HTML); setIsActive(true);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !templateHtml.trim()) return;
    if (selected) {
      await updateMut.mutateAsync({ id: selected.id, name: name.trim(), templateHtml, isActive });
    } else {
      const { id } = await createMut.mutateAsync({ name: name.trim(), templateHtml });
      setSelectedId(id);
    }
    setDirty(false);
  };

  const isEditingNew = selectedId === null && dirty;

  return (
    <div>
      <PageHeader icon={FileText} title="Szablony wydruku" subtitle="Szablony HTML protokołów zleceń — z tokenami {{...}}" />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-accent-600" /> Szablony</CardTitle>
            <Button size="sm" onClick={startNew}><Plus className="h-3.5 w-3.5" /> Nowy</Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-stone-400">Wczytywanie…</p>
            ) : !templates || templates.length === 0 ? (
              <EmptyState icon={FileText} title="Brak szablonów" description="Dodaj pierwszy szablon protokołu."
                action={<Button size="sm" onClick={startNew}><Plus className="h-3.5 w-3.5" /> Nowy szablon</Button>} />
            ) : (
              <div className="divide-y divide-stone-100">
                {templates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => select(t)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-5 py-3 text-left text-sm hover:bg-stone-50',
                      selectedId === t.id && 'bg-accent-50/60'
                    )}
                  >
                    <span className={cn('font-medium', t.isActive ? 'text-stone-800' : 'text-stone-400 line-through')}>{t.name}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {t.isDefault && <Badge tone="accent"><Star className="mr-1 h-3 w-3" />Domyślny</Badge>}
                      {!t.isActive && <Badge tone="neutral">Nieaktywny</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {!selected && !isEditingNew ? (
            <Card><CardContent className="py-16 text-center text-sm text-stone-400">
              Wybierz szablon z listy albo utwórz nowy.
            </CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selected ? `Edytuj: ${selected.name}` : 'Nowy szablon'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nazwa *" value={name}
                  onChange={e => { setName(e.target.value); setDirty(true); }}
                  placeholder="np. Protokół montażu"
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-700">Treść *</label>
                  <RichTextEditor
                    value={templateHtml}
                    onChange={html => { setTemplateHtml(html); setDirty(true); }}
                    tokens={TOKENS.map(t => ({ code: t.token, label: t.token }))}
                    minHeight={340}
                  />
                </div>
                {selected && (
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" checked={isActive} onChange={e => { setIsActive(e.target.checked); setDirty(true); }}
                      className="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-500" />
                    Aktywny
                  </label>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    {selected && !selected.isDefault && (
                      <Button variant="outline" size="sm" disabled={setDefaultMut.isPending}
                        onClick={() => setDefaultMut.mutate(selected.id)}>
                        <Star className="h-3.5 w-3.5" /> Ustaw jako domyślny
                      </Button>
                    )}
                  </div>
                  <Button onClick={handleSave} disabled={!name.trim() || !templateHtml.trim() || !dirty || createMut.isPending || updateMut.isPending}>
                    {selected ? 'Zapisz zmiany' : 'Utwórz szablon'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-sm">Dostępne tokeny</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {TOKENS.map(t => (
                <div key={t.token} className="flex items-baseline gap-2 text-xs">
                  <code className="shrink-0 rounded bg-stone-100 px-1.5 py-0.5 text-accent-700">{`{{${t.token}}}`}</code>
                  <span className="text-stone-500">{t.description}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
