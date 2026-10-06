import { Suspense } from 'react';
import PublicRatingClient from './rating-client';

// Wymagane przez statyczny eksport (wersja instalacyjna) — serwer API zwraca ten sam plik
// dla każdego /ocena/<id>, a id jest czytane po stronie klienta z adresu.
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default function PublicRatingPage() {
  return (
    <Suspense>
      <PublicRatingClient />
    </Suspense>
  );
}
