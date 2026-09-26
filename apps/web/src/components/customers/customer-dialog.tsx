'use client';
import { useEffect, useState } from 'react';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { useLocations } from '@/hooks/useLocations';
import { COMPANY_ID } from '@/lib/constants';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AddressFields, addressDtoToForm, addressFormToDto, emptyAddress, type AddressFormValue } from '@/components/common/address-fields';
import type { CustomerDetail } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  editCustomer?: CustomerDetail | null;
  onCreated?: (id: number) => void;
}

export function CustomerDialog({ open, onClose, editCustomer, onCreated }: Props) {
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const { data: locations } = useLocations(COMPANY_ID);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [locationId, setLocationId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [address, setAddress] = useState<AddressFormValue>(emptyAddress);

  useEffect(() => {
    if (!open) return;
    setName(editCustomer?.name ?? '');
    setPhone(editCustomer?.phone ?? '');
    setEmail(editCustomer?.email ?? '');
    setLocationId(editCustomer?.locationId?.toString() ?? '');
    setIsActive(editCustomer?.isActive ?? true);
    setAddress(addressDtoToForm(editCustomer?.address));
  }, [open, editCustomer]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const body = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      locationId: locationId ? Number(locationId) : null,
      address: addressFormToDto(address),
    };
    if (editCustomer) {
      await updateMut.mutateAsync({ id: editCustomer.id, ...body, isActive });
    } else {
      const { id } = await createMut.mutateAsync({ companyId: COMPANY_ID, ...body });
      onCreated?.(id);
    }
    onClose();
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onClose={onClose} title={editCustomer ? `Edytuj: ${editCustomer.name}` : 'Nowy klient'}>
      <div className="space-y-4">
        <Input label="Imię i nazwisko *" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="np. Jan Kowalski" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Telefon" value={phone} onChange={e => setPhone(e.target.value)} placeholder="500 600 700" />
          <Input label="E-mail" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <Select label="Lokalizacja" value={locationId} onChange={e => setLocationId(e.target.value)}>
          <option value="">— Brak —</option>
          {locations?.map(l => <option key={l.id} value={l.id}>{'　'.repeat(l.level)}{l.name}</option>)}
        </Select>
        <AddressFields value={address} onChange={setAddress} />
        {editCustomer && (
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-500" />
            Aktywny
          </label>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
            {editCustomer ? 'Zapisz zmiany' : 'Utwórz'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
