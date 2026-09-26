'use client';
import { apiClient } from './api-client';

/** Otwiera plik (np. PDF) w nowej karcie do podglądu/wydruku — z tokenem JWT, którego zwykły
 * `<a href target="_blank">` nie wysyła (dopiero jak wyłączyliśmy DevAuth, to zaczęło mieć
 * znaczenie). Okno trzeba otworzyć SYNCHRONICZNIE w handlerze kliknięcia, inaczej przeglądarka
 * zablokuje je jako popup, bo samo pobranie danych jest asynchroniczne. */
export async function openAuthenticatedFile(url: string) {
  const win = window.open('', '_blank');
  try {
    const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' });
    const objectUrl = URL.createObjectURL(data);
    if (win) win.location.href = objectUrl;
    else window.open(objectUrl, '_blank');
  } catch (err) {
    win?.close();
    throw err;
  }
}

/** Pobiera plik (force-download) z tokenem JWT — dla załączników, gdzie chcemy zapisać plik. */
export async function downloadAuthenticatedFile(url: string, fileName: string) {
  const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
