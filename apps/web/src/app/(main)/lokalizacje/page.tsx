'use client';
import { useMemo, useState } from 'react';
import { useLocations, useCreateLocation, useUpdateLocation } from '@/hooks/useLocations';
import { COMPANY_ID } from '@/lib/constants';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { AddressFields, addressDtoToForm, addressFormToDto, emptyAddress, type AddressFormValue } from '@/components/common/address-fields';
import { MapPin, Plus, ChevronRight, ChevronDown, Pencil } from 'lucide-react';
import type { Location } from '@/types';
import { cn } from '@/lib/utils';

function LocationNode({ location, children, depth, onAdd, onEdit }: {
  location: Location; children: Location[]; depth: number;
  onAdd: (parentId: number) => void; onEdit: (l: Location) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 rounded-lg py-1.5 pr-2 hover:bg-stone-50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(v => !v)} className="rounded p-0.5 text-stone-400 hover:bg-stone-200">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : <span className="w-5" />}
        <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-300" />
        <span className={cn('flex-1 text-sm', location.isActive ? 'text-stone-800' : 'text-stone-400 line-through')}>
          {location.name}
        </span>
        {!location.isActive && <Badge tone="neutral">Nieaktywna</Badge>}
        <button
          onClick={() => onEdit(location)}
          className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onAdd(location.id)}
          className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
          title="Dodaj podlokalizację"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const { data: locations, isLoading } = useLocations(COMPANY_ID);
  const createMut = useCreateLocation();
  const updateMut = useUpdateLocation();

  const [dialog, setDialog] = useState<{ open: boolean; parentId?: number | null; edit?: Location | null }>({ open: false });
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [address, setAddress] = useState<AddressFormValue>(emptyAddress);

  const byParent = useMemo(() => {
    const map = new Map<number | null, Location[]>();
    (locations ?? []).forEach(l => {
      const key = l.parentId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    });
    return map;
  }, [locations]);

  const openAdd = (parentId: number | null) => {
    setDialog({ open: true, parentId, edit: null });
    setName(''); setIsActive(true); setAddress(emptyAddress);
  };
  const openEdit = (l: Location) => {
    setDialog({ open: true, edit: l });
    setName(l.name); setIsActive(l.isActive); setAddress(addressDtoToForm(l.address));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (dialog.edit) {
      await updateMut.mutateAsync({ id: dialog.edit.id, name: name.trim(), isActive, address: addressFormToDto(address) });
    } else {
      await createMut.mutateAsync({ companyId: COMPANY_ID, name: name.trim(), parentId: dialog.parentId ?? null, address: addressFormToDto(address) });
    }
    setDialog({ open: false });
  };

  const renderTree = (parentId: number | null, depth: number): React.ReactNode =>
    (byParent.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name)).map(loc => (
      <div key={loc.id}>
        <LocationNode
          location={loc}
          children={byParent.get(loc.id) ?? []}
          depth={depth}
          onAdd={id => openAdd(id)}
          onEdit={openEdit}
        />
        {renderTree(loc.id, depth + 1)}
      </div>
    ));

  const roots = byParent.get(null) ?? [];

  return (
    <div>
      <PageHeader
        icon={MapPin}
        title="Lokalizacje"
        subtitle="Dowolna struktura oddziałów i punktów sprzedaży"
        action={<Button onClick={() => openAdd(null)}><Plus className="h-4 w-4" /> Nowa lokalizacja</Button>}
      />

      <div className="p-8">
        <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
          {isLoading ? (
            <p className="px-5 py-8 text-center text-sm text-stone-400">Wczytywanie…</p>
          ) : roots.length === 0 ? (
            <EmptyState icon={MapPin} title="Brak lokalizacji" description="Dodaj pierwszy oddział lub punkt sprzedaży."
              action={<Button onClick={() => openAdd(null)}><Plus className="h-4 w-4" /> Nowa lokalizacja</Button>} />
          ) : renderTree(null, 0)}
        </div>
      </div>

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false })}
        title={dialog.edit ? `Edytuj: ${dialog.edit.name}` : 'Nowa lokalizacja'}
      >
        <div className="space-y-4">
          <Input label="Nazwa *" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="np. Oddział Poznań" />
          <AddressFields value={address} onChange={setAddress} />
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
    </div>
  );
}
