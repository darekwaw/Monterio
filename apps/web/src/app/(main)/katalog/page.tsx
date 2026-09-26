'use client';
import { useState } from 'react';
import {
  useServiceCatalog, useCreateServiceCatalogItem, useUpdateServiceCatalogItem,
  useAddServiceActivity, useUpdateServiceActivity, useDeleteServiceActivity,
} from '@/hooks/useServiceCatalog';
import {
  useMeasurementAttributes, useCreateMeasurementAttribute, useUpdateMeasurementAttribute,
} from '@/hooks/useMeasurementAttributes';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { BookOpen, Plus, Ruler, Trash2, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DATA_TYPE_LABELS } from '@/types';
import type { MeasurementAttribute, ServiceActivity, ServiceCatalogItem } from '@/types';

function optionsToCsv(options: string | null): string {
  if (!options) return '';
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed.join(', ') : '';
  } catch {
    return '';
  }
}

function MeasurementAttributesPanel() {
  const { data: attrs } = useMeasurementAttributes();
  const createMut = useCreateMeasurementAttribute();
  const updateMut = useUpdateMeasurementAttribute();
  const [dialog, setDialog] = useState<{ open: boolean; edit?: MeasurementAttribute | null }>({ open: false });
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('1');
  const [unit, setUnit] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [options, setOptions] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAdd = () => {
    setDialog({ open: true, edit: null });
    setName(''); setDataType('1'); setUnit(''); setMinValue(''); setMaxValue(''); setOptions(''); setIsActive(true);
  };
  const openEdit = (a: MeasurementAttribute) => {
    setDialog({ open: true, edit: a });
    setName(a.name); setDataType(a.dataType.toString()); setUnit(a.unit ?? '');
    setMinValue(a.minValue?.toString() ?? ''); setMaxValue(a.maxValue?.toString() ?? '');
    setOptions(optionsToCsv(a.options)); setIsActive(a.isActive);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const body = {
      name: name.trim(),
      dataType: Number(dataType),
      unit: unit.trim() || null,
      minValue: minValue ? Number(minValue) : null,
      maxValue: maxValue ? Number(maxValue) : null,
      options: dataType === '5' && options.trim()
        ? JSON.stringify(options.split(',').map(o => o.trim()).filter(Boolean))
        : null,
    };
    if (dialog.edit) {
      await updateMut.mutateAsync({ id: dialog.edit.id, ...body, isActive });
    } else {
      await createMut.mutateAsync(body);
    }
    setDialog({ open: false });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Ruler className="h-4 w-4 text-accent-600" /> Punkty pomiarowe</CardTitle>
        <Button size="sm" variant="outline" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Nowy</Button>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {!attrs || attrs.length === 0 ? (
          <p className="py-4 text-center text-sm text-stone-400">Brak punktów pomiarowych.</p>
        ) : attrs.map(a => (
          <div key={a.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-stone-50">
            <span className={cn('font-medium', a.isActive ? 'text-stone-800' : 'text-stone-400 line-through')}>{a.name}</span>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>{DATA_TYPE_LABELS[a.dataType]}</span>
              {a.unit && <Badge tone="neutral">{a.unit}</Badge>}
              <button onClick={() => openEdit(a)} className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false })} title={dialog.edit ? `Edytuj: ${dialog.edit.name}` : 'Nowy punkt pomiarowy'}>
        <div className="space-y-4">
          <Input label="Nazwa *" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="np. Wysokość" />
          <Select label="Typ danych" value={dataType} onChange={e => setDataType(e.target.value)}>
            {Object.entries(DATA_TYPE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </Select>
          {dataType === '1' && (
            <div className="grid grid-cols-3 gap-3">
              <Input label="Jednostka" value={unit} onChange={e => setUnit(e.target.value)} placeholder="cm" />
              <Input label="Min" type="number" value={minValue} onChange={e => setMinValue(e.target.value)} />
              <Input label="Max" type="number" value={maxValue} onChange={e => setMaxValue(e.target.value)} />
            </div>
          )}
          {dataType === '5' && (
            <Input label="Opcje (rozdziel przecinkami)" value={options} onChange={e => setOptions(e.target.value)} placeholder="Lewe, Prawe" />
          )}
          {dialog.edit && (
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-500" />
              Aktywny
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialog({ open: false })}>Anuluj</Button>
            <Button onClick={handleSave} disabled={!name.trim() || createMut.isPending || updateMut.isPending}>
              {dialog.edit ? 'Zapisz zmiany' : 'Utwórz'}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}

function ActivityRow({ activity, onDelete }: { activity: ServiceActivity; onDelete: () => void }) {
  const { data: attrs } = useMeasurementAttributes();
  const updateMut = useUpdateServiceActivity();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(activity.name);
  const [attrId, setAttrId] = useState(activity.measurementAttributeId?.toString() ?? '');

  if (editing) {
    return (
      <div className="flex items-center gap-2 pl-8">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nazwa czynności" className="h-8 flex-1 text-xs" autoFocus />
        <Select value={attrId} onChange={e => setAttrId(e.target.value)} className="h-8 w-44 text-xs">
          <option value="">— bez pomiaru —</option>
          {attrs?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <Button size="sm" disabled={!name.trim() || updateMut.isPending} onClick={async () => {
          await updateMut.mutateAsync({
            activityId: activity.id, name: name.trim(), sortOrder: activity.sortOrder,
            measurementAttributeId: attrId ? Number(attrId) : null,
          });
          setEditing(false);
        }}>Zapisz</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Anuluj</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg py-1 pl-8 pr-2 text-xs hover:bg-stone-50">
      <span className="text-stone-600">↳ {activity.name}</span>
      <div className="flex items-center gap-2">
        {activity.measurementAttributeName && (
          <Badge tone="accent">{activity.measurementAttributeName}{activity.unit ? ` (${activity.unit})` : ''}</Badge>
        )}
        <button onClick={() => setEditing(true)} className="text-stone-300 hover:text-stone-600">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onDelete} className="text-stone-300 hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function AddActivityRow({ itemId }: { itemId: number }) {
  const { data: attrs } = useMeasurementAttributes();
  const addMut = useAddServiceActivity();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [attrId, setAttrId] = useState('');

  if (!adding) {
    return (
      <button onClick={() => setAdding(true)} className="flex items-center gap-1 pl-8 text-xs font-medium text-accent-600 hover:text-accent-700">
        <Plus className="h-3 w-3" /> Dodaj czynność
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 pl-8">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nazwa czynności" className="h-8 flex-1 text-xs" autoFocus />
      <Select value={attrId} onChange={e => setAttrId(e.target.value)} className="h-8 w-44 text-xs">
        <option value="">— bez pomiaru —</option>
        {attrs?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
      </Select>
      <Button size="sm" disabled={!name.trim() || addMut.isPending} onClick={async () => {
        await addMut.mutateAsync({ itemId, name: name.trim(), measurementAttributeId: attrId ? Number(attrId) : null });
        setName(''); setAttrId(''); setAdding(false);
      }}>Dodaj</Button>
      <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Anuluj</Button>
    </div>
  );
}

function ServiceCatalogPanel() {
  const { data: items } = useServiceCatalog(false);
  const createMut = useCreateServiceCatalogItem();
  const updateMut = useUpdateServiceCatalogItem();
  const deleteActivityMut = useDeleteServiceActivity();
  const [dialog, setDialog] = useState<{ open: boolean; edit?: ServiceCatalogItem | null }>({ open: false });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const openAdd = () => {
    setDialog({ open: true, edit: null });
    setName(''); setDescription(''); setIsActive(true);
  };
  const openEdit = (item: ServiceCatalogItem) => {
    setDialog({ open: true, edit: item });
    setName(item.name); setDescription(item.description ?? ''); setIsActive(item.isActive);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (dialog.edit) {
      await updateMut.mutateAsync({ id: dialog.edit.id, name: name.trim(), description: description.trim() || null, isActive });
    } else {
      const { id } = await createMut.mutateAsync({ name: name.trim(), description: description.trim() || null });
      setExpanded(prev => new Set(prev).add(id));
    }
    setDialog({ open: false });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-accent-600" /> Katalog usług</CardTitle>
        <Button size="sm" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Nowa usługa</Button>
      </CardHeader>
      <CardContent className="p-0">
        {!items || items.length === 0 ? (
          <EmptyState icon={BookOpen} title="Brak usług w katalogu" description="Dodaj pierwszą pozycję, np. „Wymiarowanie drzwi”."
            action={<Button size="sm" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Nowa usługa</Button>} />
        ) : (
          <div className="divide-y divide-stone-100">
            {items.map(item => (
              <div key={item.id} className="px-5 py-3">
                <div className="flex w-full items-center gap-2">
                  <button onClick={() => toggle(item.id)} className="flex flex-1 items-center gap-2 text-left">
                    {expanded.has(item.id) ? <ChevronDown className="h-3.5 w-3.5 text-stone-400" /> : <ChevronRight className="h-3.5 w-3.5 text-stone-400" />}
                    <span className={cn('flex-1 text-sm font-medium', item.isActive ? 'text-stone-800' : 'text-stone-400 line-through')}>{item.name}</span>
                    <Badge tone="neutral">{item.activities.length} czynności</Badge>
                  </button>
                  <button onClick={() => openEdit(item)} className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {expanded.has(item.id) && (
                  <div className="mt-2 space-y-1.5 pl-1">
                    {item.activities.map(a => (
                      <ActivityRow key={a.id} activity={a} onDelete={() => deleteActivityMut.mutate(a.id)} />
                    ))}
                    <AddActivityRow itemId={item.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false })} title={dialog.edit ? `Edytuj: ${dialog.edit.name}` : 'Nowa usługa'}>
        <div className="space-y-4">
          <Input label="Nazwa *" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="np. Wymiarowanie drzwi" />
          <Input label="Opis" value={description} onChange={e => setDescription(e.target.value)} />
          {dialog.edit && (
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-500" />
              Aktywna
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialog({ open: false })}>Anuluj</Button>
            <Button onClick={handleSave} disabled={!name.trim() || createMut.isPending || updateMut.isPending}>
              {dialog.edit ? 'Zapisz zmiany' : 'Utwórz'}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}

export default function CatalogPage() {
  return (
    <div>
      <PageHeader icon={BookOpen} title="Katalog usług" subtitle="Usługi, czynności i punkty pomiarowe — bez cen" />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <div className="lg:col-span-2"><ServiceCatalogPanel /></div>
        <div><MeasurementAttributesPanel /></div>
      </div>
    </div>
  );
}
