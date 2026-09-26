'use client';
import { useState } from 'react';
import { useCreateRequest } from '@/hooks/useRequests';
import { useCustomers } from '@/hooks/useCustomers';
import { useLocations } from '@/hooks/useLocations';
import { useServiceCatalog } from '@/hooks/useServiceCatalog';
import { COMPANY_ID } from '@/lib/constants';
import { CustomerDialog } from '@/components/customers/customer-dialog';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AddressFields, addressFormToDto, emptyAddress, type AddressFormValue } from '@/components/common/address-fields';
import { Plus, Minus } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; }

export function CreateRequestDialog({ open, onClose }: Props) {
  const createMut = useCreateRequest();
  const { data: locations } = useLocations(COMPANY_ID);
  const { data: catalog } = useServiceCatalog();

  const [customerSearch, setCustomerSearch] = useState('');
  const { customers } = useCustomers(COMPANY_ID, { search: customerSearch, enabled: open });
  const [customerId, setCustomerId] = useState('');
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  const [locationId, setLocationId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState<AddressFormValue>(emptyAddress);
  const [serviceQuantities, setServiceQuantities] = useState<Record<number, number>>({});

  const setQuantity = (id: number, qty: number) =>
    setServiceQuantities(prev => {
      if (qty <= 0) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: qty };
    });

  const reset = () => {
    setCustomerSearch(''); setCustomerId(''); setLocationId('');
    setScheduledDate(''); setDescription(''); setAddress(emptyAddress); setServiceQuantities({});
  };

  const handleSubmit = async () => {
    if (!customerId) return;
    const serviceCatalogItemIds = Object.entries(serviceQuantities)
      .flatMap(([id, qty]) => Array(qty).fill(Number(id)));
    await createMut.mutateAsync({
      companyId: COMPANY_ID,
      customerId: Number(customerId),
      locationId: locationId ? Number(locationId) : null,
      scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
      description: description.trim() || null,
      address: addressFormToDto(address),
      serviceCatalogItemIds: serviceCatalogItemIds.length ? serviceCatalogItemIds : undefined,
    });
    reset();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={() => { reset(); onClose(); }} title="Nowe zlecenie" className="max-w-lg">
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-stone-700">Klient *</label>
              <button
                type="button"
                onClick={() => setCustomerDialogOpen(true)}
                className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
              >
                <Plus className="h-3.5 w-3.5" /> Nowy klient
              </button>
            </div>
            <Input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} placeholder="Szukaj klienta…" className="mb-2" />
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              required
              className="block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
            >
              <option value="">— Wybierz z listy —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.locationName ? ` (${c.locationName})` : ''}</option>)}
            </select>
          </div>

          <Select label="Lokalizacja" value={locationId} onChange={e => setLocationId(e.target.value)}>
            <option value="">— Brak —</option>
            {locations?.map(l => <option key={l.id} value={l.id}>{'　'.repeat(l.level)}{l.name}</option>)}
          </Select>

          <Input label="Planowana realizacja" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />

          <AddressFields value={address} onChange={setAddress} label="Adres wykonania" />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">Usługi</label>
            <div className="max-h-52 space-y-0.5 overflow-y-auto rounded-lg border border-stone-200 p-1.5">
              {catalog?.length ? catalog.map(s => {
                const qty = serviceQuantities[s.id] ?? 0;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-stone-50">
                    <span className={qty > 0 ? 'text-stone-800' : 'text-stone-600'}>{s.name}</span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(s.id, qty - 1)}
                        disabled={qty === 0}
                        className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-sm tabular-nums">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(s.id, qty + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-stone-300 text-stone-500 hover:bg-stone-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              }) : <p className="px-2 py-2 text-sm text-stone-400">Brak usług w katalogu.</p>}
            </div>
          </div>

          <Textarea label="Opis" value={description} onChange={e => setDescription(e.target.value)} rows={3} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Anuluj</Button>
            <Button onClick={handleSubmit} disabled={!customerId || createMut.isPending}>
              {createMut.isPending ? 'Tworzę…' : 'Utwórz zlecenie'}
            </Button>
          </div>
        </div>
      </Dialog>

      <CustomerDialog
        open={customerDialogOpen}
        onClose={() => setCustomerDialogOpen(false)}
        onCreated={id => setCustomerId(id.toString())}
      />
    </>
  );
}
