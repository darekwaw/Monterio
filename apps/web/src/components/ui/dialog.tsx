'use client';
import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px]" />
        <RadixDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
            className
          )}
        >
          <div className="flex shrink-0 items-start justify-between px-6 py-5">
            <div>
              <RadixDialog.Title className="text-base font-semibold text-stone-900">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-sm text-stone-400">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600">
              <X className="h-4 w-4" />
            </RadixDialog.Close>
          </div>
          <div className="overflow-y-auto px-6 pb-6">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
