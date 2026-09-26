import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-stone-700">{label}</label>}
      <input
        className={cn(
          'block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900',
          'placeholder:text-stone-400 shadow-sm transition-shadow',
          'focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25',
          'disabled:bg-stone-50 disabled:text-stone-400',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/25',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';
