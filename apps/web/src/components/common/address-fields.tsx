'use client';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import type { Address } from '@/types';

export interface AddressFormValue {
  street: string;
  postalCode: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
}

export const emptyAddress: AddressFormValue = {
  street: '', postalCode: '', city: '', country: '', latitude: '', longitude: '',
};

export function addressDtoToForm(address?: Address | null): AddressFormValue {
  if (!address) return emptyAddress;
  return {
    street: address.street ?? '',
    postalCode: address.postalCode ?? '',
    city: address.city ?? '',
    country: address.country ?? '',
    latitude: address.latitude != null ? String(address.latitude) : '',
    longitude: address.longitude != null ? String(address.longitude) : '',
  };
}

export function addressFormToDto(value: AddressFormValue): Omit<Address, 'id'> | null {
  const { street, postalCode, city, country, latitude, longitude } = value;
  if (!street && !postalCode && !city && !country && !latitude && !longitude) return null;
  return {
    street: street || null,
    postalCode: postalCode || null,
    city: city || null,
    country: country || null,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
  };
}

export function AddressFields({ value, onChange, label = 'Adres' }: {
  value: AddressFormValue; onChange: (v: AddressFormValue) => void; label?: string;
}) {
  const set = (key: keyof AddressFormValue) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: e.target.value });

  return (
    <details className="group rounded-lg border border-stone-200">
      <summary className="flex cursor-pointer select-none items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-stone-600">
        <MapPin className="h-3.5 w-3.5 text-stone-400" /> {label}
        <span className="font-normal text-stone-400">(opcjonalnie)</span>
      </summary>
      <div className="space-y-3 border-t border-stone-100 p-3">
        <Input label="Ulica i numer" value={value.street} onChange={set('street')} placeholder="np. ul. Przemysłowa 12" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Kod pocztowy" value={value.postalCode} onChange={set('postalCode')} placeholder="00-000" />
          <Input label="Miasto" value={value.city} onChange={set('city')} placeholder="Warszawa" />
        </div>
        <Input label="Kraj" value={value.country} onChange={set('country')} placeholder="Polska" />
      </div>
    </details>
  );
}
