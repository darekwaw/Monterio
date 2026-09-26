'use client';
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State { hasError: boolean; message?: string; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-stone-800">Coś poszło nie tak</h2>
          <p className="mb-1 mt-1 text-sm text-stone-500">
            Wystąpił nieoczekiwany błąd interfejsu. Spróbuj ponownie — jeśli problem się powtarza, odśwież stronę.
          </p>
          {this.state.message && (
            <p className="mb-4 break-words font-mono text-xs text-stone-400">{this.state.message}</p>
          )}
          <div className="flex justify-center gap-2">
            <Button onClick={() => this.setState({ hasError: false, message: undefined })}>Spróbuj ponownie</Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>Odśwież stronę</Button>
          </div>
        </div>
      </div>
    );
  }
}
