import * as React from 'react';
import { cn } from '@/lib/utils';

const TONE_CLASSES = {
  neutral: 'bg-stone-100 text-stone-700',
  accent: 'bg-accent-50 text-accent-700',
  success: 'bg-[var(--success-bg)] text-[var(--success)]',
  warning: 'bg-[var(--warning-bg)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-bg)] text-[var(--danger)]',
} as const;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Hex/nazwany kolor tła (np. dynamiczny kolor statusu) — nadpisuje tone. */
  color?: string;
  /** Predefiniowany, spójny z paletą ton — użyj gdy nie masz dynamicznego koloru. */
  tone?: keyof typeof TONE_CLASSES;
}

export function Badge({ className, color, tone = 'neutral', style, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        !color && TONE_CLASSES[tone],
        color && 'text-white',
        className
      )}
      style={color ? { backgroundColor: color, ...style } : style}
      {...props}
    >
      {children}
    </span>
  );
}
