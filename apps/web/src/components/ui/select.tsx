import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-stone-700">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            'block w-full appearance-none rounded-lg border border-stone-300 bg-white px-3 py-2 pr-9 text-sm text-stone-900 shadow-sm',
            'focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25',
            error && 'border-red-400',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';
