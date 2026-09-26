'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/hooks/useAuth';
import { useRequestsRealtime } from '@/hooks/useSignalR';
import { Sidebar } from '@/components/layout/sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession(s);
    setReady(true);
  }, [router]);

  useRequestsRealtime();

  if (!ready || !session) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar fullName={session.fullName} role={session.role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
