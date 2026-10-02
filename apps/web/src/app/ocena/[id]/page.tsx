'use client';
import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Hammer, CheckCircle2, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface PublicRatingInfo {
  number: string;
  rating: number | null;
  ratingComment: string | null;
}

/** Publiczna strona oceny zlecenia — bez logowania, dostępna tylko z linku/QR-kodu wygenerowanego
 * na ekranie instalatora (token w query stringu, zweryfikowany po stronie API). Świadomie poza
 * (main), żeby nie przechodzić przez layout z guardem sesji pracownika. */
export default function PublicRatingPage() {
  const { id } = useParams<{ id: string }>();
  const token = useSearchParams().get('token') ?? '';
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-rating', id, token],
    queryFn: async () => {
      const { data } = await apiClient.get<PublicRatingInfo>(`/api/public/requests/${id}`, { params: { token } });
      return data;
    },
    enabled: !!id && !!token,
    retry: false,
  });

  const submitMut = useMutation({
    mutationFn: async () => {
      await apiClient.put(`/api/public/requests/${id}/rating`, { rating, comment: comment.trim() || null }, { params: { token } });
    },
    onSuccess: () => setSubmitted(true),
  });

  const alreadyRated = data?.rating != null && !submitted;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500">
            <Hammer className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-stone-900">Monterio</span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-stone-500">
            Link jest nieprawidłowy albo wygasł. Skontaktuj się z firmą wykonawczą, jeśli chcesz ocenić zlecenie.
          </p>
        )}

        {data && !submitted && !alreadyRated && (
          <>
            <h1 className="text-xl font-semibold text-stone-900">Jak oceniasz naszą usługę?</h1>
            <p className="mt-1 text-sm text-stone-500">Zlecenie {data.number}</p>

            <div className="mt-6 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i} gwiazdek`}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1"
                >
                  <Star
                    className={`h-9 w-9 ${
                      i <= (hoverRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Komentarz (opcjonalnie)"
              rows={3}
              className="mt-6 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm
                placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
            />

            {submitMut.isError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Nie udało się zapisać oceny. Spróbuj ponownie.
              </p>
            )}

            <Button
              className="mt-4 w-full"
              size="lg"
              variant="accent"
              disabled={rating < 1 || submitMut.isPending}
              onClick={() => submitMut.mutate()}
            >
              {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Wyślij ocenę'}
            </Button>
          </>
        )}

        {(submitted || alreadyRated) && (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h1 className="mt-3 text-lg font-semibold text-stone-900">Dziękujemy za ocenę!</h1>
            <p className="mt-1 text-sm text-stone-500">Zlecenie {data?.number}</p>
          </div>
        )}
      </div>
    </div>
  );
}
