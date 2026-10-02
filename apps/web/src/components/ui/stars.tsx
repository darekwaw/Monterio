import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Wyłącznie do odczytu — ocenę wystawia klient przez publiczny link/QR (patrz /ocena/[id]),
 * nigdy z poziomu weba ani urządzenia instalatora — web ją tylko pokazuje. */
export function Stars({ value, size = 'sm', showCount, count }: {
  value: number | null; size?: 'sm' | 'md'; showCount?: boolean; count?: number;
}) {
  if (value == null) return <span className="text-xs text-stone-400">Brak oceny</span>;

  const px = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn(px, i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-stone-300')}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-stone-600">{value.toFixed(1)}</span>
      {showCount && <span className="text-xs text-stone-400">({count ?? 0})</span>}
    </span>
  );
}
