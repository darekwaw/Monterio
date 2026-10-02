import { useEffect } from 'react';
import { AppState } from 'react-native';

/** Odświeża dane natychmiast gdy appka wraca z tła na pierwszy plan (np. instalator
 * dostał nowe zlecenie podczas gdy telefon leżał zablokowany). Uzupełnia polling
 * z refetchInterval w useMyRequests — ten hook daje natychmiastowość, polling daje
 * odświeżenie także wtedy, gdy appka cały czas jest otwarta na ekranie listy. */
export function useForegroundRefetch(refetch: () => void) {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refetch();
    });
    return () => sub.remove();
  }, [refetch]);
}
