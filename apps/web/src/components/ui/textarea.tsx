import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-stone-700">{label}</label>}
      <textarea
        className={cn(
          'block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900',
          'placeholder:text-stone-400 shadow-sm transition-shadow',
          'focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25',
          error && 'border-red-400',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
