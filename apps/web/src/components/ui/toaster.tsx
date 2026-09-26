'use client';
import { useEffect, useState } from 'react';
import { subscribe, dismissToast, type ToastItem, type ToastType } from '@/lib/toast';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const STYLES: Record<ToastType, { box: string; icon: React.ReactNode }> = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', icon: <AlertCircle className="h-4 w-4 text-red-500 shrink-0" /> },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-800', icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" /> },
  success: { box: 'border-green-200 bg-green-50 text-green-800', icon: <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> },
  info: { box: 'border-stone-200 bg-white text-stone-800', icon: <Info className="h-4 w-4 text-stone-400 shrink-0" /> },
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map(t => {
        const s = STYLES[t.type];
        return (
          <div key={t.id} className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${s.box}`}>
            <span className="mt-0.5">{s.icon}</span>
            <p className="flex-1 leading-relaxed">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="shrink-0 rounded p-0.5 opacity-50 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
