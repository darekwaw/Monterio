'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin, getSession } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Hammer, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const loginMut = useLogin();

  useEffect(() => {
    if (getSession()) router.replace('/');
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMut.mutate({ loginIdentifier: login, password });
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel marki — ciemny, ciepły charcoal */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(183,121,31,0.15),transparent_50%)]" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500">
            <Hammer className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Monterio</span>
        </div>
        <div className="relative">
          <p className="max-w-md text-2xl font-medium leading-snug text-white">
            Zlecenia montażowe, pomiary i dokumentacja — wszystko w jednym miejscu, bez papieru.
          </p>
          <p className="mt-4 text-sm text-stone-400">Bel-Pol · System zarządzania zleceniami</p>
        </div>
      </div>

      {/* Formularz */}
      <div className="flex w-full flex-col items-center justify-center bg-[var(--background)] px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500">
              <Hammer className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-stone-900">Monterio</span>
          </div>

          <h1 className="text-xl font-semibold text-stone-900">Zaloguj się</h1>
          <p className="mt-1 text-sm text-stone-500">Wpisz dane dostępu do systemu.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Login"
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="np. admin"
              autoFocus
              required
            />
            <Input
              label="Hasło"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {loginMut.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Nieprawidłowy login lub hasło.
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loginMut.isPending}>
              {loginMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zaloguj się'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
