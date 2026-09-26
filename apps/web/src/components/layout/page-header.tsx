import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50">
          <Icon className="h-4.5 w-4.5 text-accent-600" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-stone-900">{title}</h1>
          {subtitle && <p className="text-sm text-stone-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
