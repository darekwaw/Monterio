'use client';
import { useState } from 'react';
import { useContractors, useCreateContractor, useUpdateContractor } from '@/hooks/useContractors';
import {
  useServiceGroups, useCreateServiceGroup, useUpdateServiceGroup, useServiceGroupMembers,
  useAddContractorToGroup, useRemoveContractorFromGroup,
} from '@/hooks/useServiceGroups';
import { useLocations } from '@/hooks/useLocations';
import { useEmployees, useCreateEmployee } from '@/hooks/useEmployees';
import { COMPANY_ID } from '@/lib/constants';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { AddressFields, addressDtoToForm, addressFormToDto, emptyAddress, type AddressFormValue } from '@/components/common/address-fields';
import { Stars } from '@/components/ui/stars';
import { Briefcase, Users2, Plus, X, UserPlus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contractor, ServiceGroup } from '@/types';

function ContractorEmployees({ contractorId }: { contractorId: number }) {
  const { data: employees } = useEmployees({ contractorId });
  const createMut = useCreateEmployee();
  const [adding, setAdding] = useState(false);
  const [fullName, setFullName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="mt-2 space-y-1 pl-4">
      {employees?.map(e => (
        <div key={e.id} className="flex items-center justify-between gap-2 py-0.5 text-xs text-stone-500">
          <span className="flex items-center gap-2">
            <span className="h-1 w-1 shrink-0 rounded-full bg-stone-300" /> {e.fullName} <span className="text-stone-300">· {e.loginIdentifier}</span>
          </span>
          {e.averageRating != null && <Stars value={e.averageRating} showCount count={e.ratingCount} />}
        </div>
      ))}
      {adding ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Imię i nazwisko" className="h-7 w-36 text-xs" autoFocus />
          <Input value={login} onChange={e => setLogin(e.target.value)} placeholder="login" className="h-7 w-24 text-xs" />
          <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="hasło" type="password" className="h-7 w-24 text-xs" />
          <Button size="sm" disabled={!fullName.trim() || !login.trim() || !password} onClick={async () => {
            await createMut.mutateAsync({ companyId: null, contractorId, fullName: fullName.trim(), loginIdentifier: login.trim(), password });
            setFullName(''); setLogin(''); setPassword(''); setAdding(false);
          }}>Dodaj</Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Anuluj</Button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 pt-1 text-xs font-medium text-accent-600 hover:text-accent-700">
          <UserPlus className="h-3 w-3" /> Dodaj instalatora
        </button>
      )}
    </div>
  );
}

function ContractorsPanel() {
  const { data: contractors } = useContractors();
  const createMut = useCreateContractor();
  const updateMut = useUpdateContractor();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: Contractor | null }>({ open: false });
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [address, setAddress] = useState<AddressFormValue>(emptyAddress);

  const openAdd = () => {
    setDialog({ open: true, edit: null });
    setName(''); setTaxId(''); setPhone(''); setEmail(''); setIsActive(true); setAddress(emptyAddress);
  };
  const openEdit = (c: Contractor) => {
    setDialog({ open: true, edit: c });
    setName(c.name); setTaxId(c.taxId ?? ''); setPhone(c.phone ?? ''); setEmail(c.email ?? '');
    setIsActive(c.isActive); setAddress(addressDtoToForm(c.address));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const body = {
      name: name.trim(), taxId: taxId.trim() || null, phone: phone.trim() || null,
      email: email.trim() || null, address: addressFormToDto(address),
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
        <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent-600" /> Firmy wykonawcze</CardTitle>
        <Button size="sm" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Nowa firma</Button>
      </CardHeader>
      <CardContent className="p-0">
        {!contractors || contractors.length === 0 ? (
          <EmptyState icon={Briefcase} title="Brak firm wykonawczych" />
        ) : (
          <div className="divide-y divide-stone-100">
            {contractors.map(c => (
              <div key={c.id} className="px-5 py-3">
                <div className="flex w-full items-center justify-between gap-2 text-left text-sm">
                  <button onClick={() => setExpanded(v => v === c.id ? null : c.id)} className="flex flex-1 items-center justify-between text-left">
                    <span className={cn('font-medium', c.isActive ? 'text-stone-800' : 'text-stone-400 line-through')}>{c.name}</span>
                    <span className="flex items-center gap-2 text-xs text-stone-400">
                      {c.averageRating != null && <Stars value={c.averageRating} showCount count={c.ratingCount} />}
                      {c.phone ?? c.email ?? '—'}
                    </span>
                  </button>
                  <button onClick={() => openEdit(c)} className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {expanded === c.id && <ContractorEmployees contractorId={c.id} />}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false })} title={dialog.edit ? `Edytuj: ${dialog.edit.name}` : 'Nowa firma wykonawcza'}>
        <div className="space-y-4">
          <Input label="Nazwa firmy *" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input label="NIP" value={taxId} onChange={e => setTaxId(e.target.value)} />
            <Input label="Telefon" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <Input label="E-mail" value={email} onChange={e => setEmail(e.target.value)} type="email" />
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
    </Card>
  );
}

function ServiceGroupMembersPanel({ groupId }: { groupId: number }) {
  const { data: members } = useServiceGroupMembers(groupId);
  const { data: allContractors } = useContractors(true);
  const addMut = useAddContractorToGroup();
  const removeMut = useRemoveContractorFromGroup();
  const [selected, setSelected] = useState('');

  const available = (allContractors ?? []).filter(c => !members?.some(m => m.id === c.id));

  return (
    <div className="mt-2 space-y-1.5 pl-4">
      {members?.map(m => (
        <div key={m.id} className="flex items-center justify-between rounded-lg py-1 text-xs">
          <span className="text-stone-600">{m.name}</span>
          <button onClick={() => removeMut.mutate({ groupId, contractorId: m.id })} className="text-stone-300 hover:text-red-500">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {available.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <Select value={selected} onChange={e => setSelected(e.target.value)} className="h-10 text-sm">
            <option value="">— dodaj firmę —</option>
            {available.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Button disabled={!selected} onClick={async () => {
            await addMut.mutateAsync({ groupId, contractorId: Number(selected) });
            setSelected('');
          }}>Dodaj</Button>
        </div>
      )}
    </div>
  );
}

function ServiceGroupsPanel() {
  const { data: locations } = useLocations(COMPANY_ID);
  const { data: groups } = useServiceGroups();
  const createMut = useCreateServiceGroup();
  const updateMut = useUpdateServiceGroup();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: ServiceGroup | null }>({ open: false });
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAdd = () => {
    setDialog({ open: true, edit: null });
    setName(''); setLocationId(''); setIsActive(true);
  };
  const openEdit = (g: ServiceGroup) => {
    setDialog({ open: true, edit: g });
    setName(g.name); setLocationId(g.locationId.toString()); setIsActive(g.isActive);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (dialog.edit) {
      await updateMut.mutateAsync({ id: dialog.edit.id, name: name.trim(), isActive });
    } else {
      if (!locationId) return;
      await createMut.mutateAsync({ locationId: Number(locationId), name: name.trim() });
    }
    setDialog({ open: false });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Users2 className="h-4 w-4 text-accent-600" /> Grupy serwisowe</CardTitle>
        <Button size="sm" onClick={openAdd}><Plus className="h-3.5 w-3.5" /> Nowa grupa</Button>
      </CardHeader>
      <CardContent className="p-0">
        {!groups || groups.length === 0 ? (
          <EmptyState icon={Users2} title="Brak grup serwisowych" />
        ) : (
          <div className="divide-y divide-stone-100">
            {groups.map(g => (
              <div key={g.id} className="px-5 py-3">
                <div className="flex w-full items-center justify-between gap-2 text-left text-sm">
                  <button onClick={() => setExpanded(v => v === g.id ? null : g.id)} className="flex flex-1 items-center justify-between text-left">
                    <span className={cn('font-medium', g.isActive ? 'text-stone-800' : 'text-stone-400 line-through')}>{g.name}</span>
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span>{g.locationName}</span>
                      <Badge tone="neutral">{g.memberCount} firm</Badge>
                    </div>
                  </button>
                  <button onClick={() => openEdit(g)} className="shrink-0 rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {expanded === g.id && <ServiceGroupMembersPanel groupId={g.id} />}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialog.open} onClose={() => setDialog({ open: false })} title={dialog.edit ? `Edytuj: ${dialog.edit.name}` : 'Nowa grupa serwisowa'}>
        <div className="space-y-4">
          <Input label="Nazwa *" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="np. Grupa Poznań" />
          {dialog.edit ? (
            <p className="text-xs text-stone-400">Lokalizacja: {dialog.edit.locationName} (nie do zmiany)</p>
          ) : (
            <Select label="Lokalizacja *" value={locationId} onChange={e => setLocationId(e.target.value)}>
              <option value="">— Wybierz —</option>
              {locations?.map(l => <option key={l.id} value={l.id}>{'　'.repeat(l.level)}{l.name}</option>)}
            </Select>
          )}
          {dialog.edit && (
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-500" />
              Aktywna
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialog({ open: false })}>Anuluj</Button>
            <Button onClick={handleSave} disabled={!name.trim() || (!dialog.edit && !locationId) || createMut.isPending || updateMut.isPending}>
              {dialog.edit ? 'Zapisz zmiany' : 'Utwórz'}
            </Button>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}

export default function ContractorsPage() {
  return (
    <div>
      <PageHeader icon={Briefcase} title="Wykonawcy" subtitle="Firmy B2B, ich instalatorzy i grupy serwisowe" />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-2">
        <ServiceGroupsPanel />
        <ContractorsPanel />
      </div>
    </div>
  );
}
