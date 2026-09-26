'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLogout } from '@/hooks/useAuth';
import {
  LayoutDashboard, ClipboardList, Users, MapPin, BookOpen, Briefcase, Hammer, LogOut, FileText, UserCog,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/zlecenia', label: 'Zlecenia', icon: ClipboardList },
  { href: '/klienci', label: 'Klienci', icon: Users },
  { href: '/lokalizacje', label: 'Lokalizacje', icon: MapPin },
  { href: '/katalog', label: 'Katalog usług', icon: BookOpen },
  { href: '/wykonawcy', label: 'Wykonawcy', icon: Briefcase },
  { href: '/szablony-wydruku', label: 'Szablony wydruku', icon: FileText },
  { href: '/pracownicy', label: 'Pracownicy', icon: UserCog },
];

export function Sidebar({ fullName, role }: { fullName: string; role: string }) {
  const pathname = usePathname();
  const logout = useLogout();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-ink-900 text-stone-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500">
          <Hammer className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-[0.95rem] font-semibold tracking-tight text-white">Monterio</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-ink-800 text-white'
                  : 'text-stone-400 hover:bg-ink-800/60 hover:text-stone-100'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active && 'text-accent-500')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-800 px-3 py-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-stone-200">
            {fullName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{fullName}</p>
            <p className="truncate text-xs text-stone-500">{role === 'Dispatcher' ? 'Dyspozytor' : 'Instalator'}</p>
          </div>
          <button
            onClick={logout}
            title="Wyloguj"
            className="shrink-0 rounded-lg p-1.5 text-stone-500 hover:bg-ink-800 hover:text-stone-200"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
