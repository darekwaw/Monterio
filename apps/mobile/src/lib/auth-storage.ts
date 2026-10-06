import * as SecureStore from 'expo-secure-store';
import type { Session } from '@/types';

const KEY = 'monterio_session';

export async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(session));
}

export async function getSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}

const SERVER_KEY = 'monterio_server_url';
let cachedServerUrl: string | null | undefined;

/** Adres serwera Monterio wpisany na ekranie logowania (np. http://192.168.1.10:5020). Jeden APK
 * obsługuje każde wdrożenie — adres nie jest wkompilowany w aplikację. */
export async function getServerUrl(): Promise<string | null> {
  if (cachedServerUrl === undefined) cachedServerUrl = await SecureStore.getItemAsync(SERVER_KEY);
  return cachedServerUrl;
}

export async function saveServerUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  cachedServerUrl = clean;
  await SecureStore.setItemAsync(SERVER_KEY, clean);
}
