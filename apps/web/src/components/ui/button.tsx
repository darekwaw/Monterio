import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'bg-ink-900 text-white hover:bg-ink-800 shadow-sm',
        accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
        destructive: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
        outline: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-400',
        ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
        link: 'text-accent-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-[0.95rem]',
        icon: 'h-9 w-9 shrink-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = 'Button';
