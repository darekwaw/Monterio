'use client';
import * as React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('mb-4 flex gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1', className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors',
        'hover:bg-white data-[state=active]:bg-ink-900 data-[state=active]:text-white',
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = RadixTabs.Content;
