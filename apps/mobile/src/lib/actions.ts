import { Linking, Platform } from 'react-native';
import type { Address } from '@/types';

export function formatAddressLine(address: Address | null): string | null {
  if (!address) return null;
  const cityPart = address.postalCode && address.city
    ? `${address.postalCode} ${address.city}`
    : address.city;
  return [address.street, cityPart].filter(Boolean).join(', ') || null;
}

export function callPhone(phone: string) {
  const digits = phone.replace(/[\s-]/g, '');
  const normalized = digits.startsWith('+') ? digits : `+48${digits}`;
  Linking.openURL(`tel:${normalized}`);
}

export function openInMaps(address: Address) {
  if (address.latitude != null && address.longitude != null) {
    const label = encodeURIComponent(formatAddressLine(address) ?? 'Cel podrozy');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${address.latitude},${address.longitude}`,
      default: `geo:${address.latitude},${address.longitude}?q=${address.latitude},${address.longitude}(${label})`,
    });
    Linking.openURL(url!);
    return;
  }
  const query = encodeURIComponent(formatAddressLine(address) ?? '');
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
}
