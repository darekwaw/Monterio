'use client';

export type ToastType = 'error' | 'warning' | 'success' | 'info';
export interface ToastItem { id: number; message: string; type: ToastType; }

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(toasts);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(toasts);
  return () => { listeners.delete(listener); };
}

export function dismissToast(id: number) {
  toasts = toasts.filter(t => t.id !== id);
  emit();
}

export function toast(message: string, type: ToastType = 'info', durationMs = 6000) {
  if (toasts.some(t => t.message === message && t.type === type)) return;
  const item: ToastItem = { id: nextId++, message, type };
  toasts = [...toasts, item];
  emit();
  setTimeout(() => dismissToast(item.id), durationMs);
}
