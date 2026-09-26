'use client';
import { useState } from 'react';
import {
  useEmployees, useCreateEmployee, useUpdateEmployee, useSetEmployeePassword,
} from '@/hooks/useEmployees';
import { COMPANY_ID } from '@/lib/constants';
import { toast } from '@/lib/toast';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Plus, Pencil, KeyRound } from 'lucide-react';
import type { Employee } from '@/types';

export default function EmployeesPage() {
  const { data: employees, isLoading } = useEmployees({ companyId: COMPANY_ID });
  const createMut = useCreateEmployee();
  const updateMut = useUpdateEmployee();
  const passwordMut = useSetEmployeePassword();

  const [dialog, setDialog] = useState<{ open: boolean; edit?: Employee | null }>({ open: false });
  const [fullName, setFullName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  const openAdd = () => {
    setDialog({ open: true, edit: null });
    setFullName(''); setLogin(''); setPassword(''); setPhone(''); setEmail(''); setIsActive(true); setNewPassword('');
  };
  const openEdit = (e: Employee) => {
    setDialog({ open: true, edit: e });
    setFullName(e.fullName); setLogin(e.loginIdentifier); setPhone(e.phone ?? ''); setEmail(e.email ?? '');
    setIsActive(e.isActive); setNewPassword('');
  };

  const handleSave = async () => {
    if (!fullName.trim()) return;
    if (dialog.edit) {
      await updateMut.mutateAsync({
        id: dialog.edit.id, fullName: fullName.trim(), phone: phone.trim() || null, email: email.trim() || null, isActive,
      });
    } else {
      if (!login.trim() || !password) return;
      await createMut.mutateAsync({
        companyId: COMPANY_ID, contractorId: null, fullName: fullName.trim(), loginIdentifier: login.trim(),
        password, phone: phone.trim() || null, email: email.trim() || null,
      });
    }
    setDialog({ open: false });
  };

  const handleResetPassword = async () => {
    if (!dialog.edit || newPassword.length < 6) return;
    await passwordMut.mutateAsync({ id: dialog.edit.id, newPassword });
    toast('Hasło zostało zmienione.', 'success');
    setNewPassword('');
  };

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Pracownicy"
        subtitle={`${employees?.length ?? 0} kont dyspozytorów`}
        action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Nowy pracownik</Button>}
      />

      <div className="p-8">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-stone-400">Wczytywanie…</p>
        ) : !employees || employees.length === 0 ? (
          <EmptyState icon={Users} title="Brak kont" description="Dodaj pierwsze konto dyspozytora."
            action={<Button onClick={openAdd}><Plus className="h-4 w-4" /> Nowy pracownik</Button>} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th className="px-5 py-3 text-left">Imię i nazwisko</th>
                  <th className="px-5 py-3 text-left">Login</th>
                  <th className="px-5 py-3 text-left">Kontakt</th>
                  <th className="px-5 py-3 text-left">Stan</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {employees.map(e => (
                  <tr key={e.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3 font-medium text-stone-900">{e.fullName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-stone-500">{e.loginIdentifier}</td>
                    <td className="px-5 py-3 text-stone-500">{e.phone ?? e.email ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={e.isActive ? 'success' : 'neutral'}>{e.isActive ? 'Aktywny' : 'Nieaktywny'}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openEdit(e)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={dialog.open} onClose={() => setDialog({ open: false })}
        title={dialog.edit ? `Edytuj: ${dialog.edit.fullName}` : 'Nowy pracownik'}
      >
        <div className="space-y-4">
          <Input label="Imię i nazwisko *" value={fullName} onChange={e => setFullName(e.target.value)} autoFocus />
          {dialog.edit ? (
            <p className="text-xs text-stone-400">Login: <span className="font-mono">{login}</span> (nie do zmiany)</p>
          ) : (
            <Input label="Login *" value={login} onChange={e => setLogin(e.target.value)} placeholder="np. jkowalski" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefon" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="E-mail" value={email} onChange={e => setEmail(e.target.value)} type="email" />
          </div>
          {!dialog.edit && (
            <Input label="Hasło *" value={password} onChange={e => setPassword(e.target.value)} type="password" />
          )}
          {dialog.edit && (
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-500" />
              Aktywny
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDialog({ open: false })}>Anuluj</Button>
            <Button
              onClick={handleSave}
              disabled={!fullName.trim() || (!dialog.edit && (!login.trim() || !password)) || createMut.isPending || updateMut.isPending}
            >
              {dialog.edit ? 'Zapisz zmiany' : 'Utwórz'}
            </Button>
          </div>

          {dialog.edit && (
            <div className="rounded-xl border border-stone-200 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                <KeyRound className="h-3.5 w-3.5" /> Zresetuj hasło
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  type="password" placeholder="Nowe hasło (min. 6 znaków)" className="flex-1"
                />
                <Button
                  variant="outline" disabled={newPassword.length < 6 || passwordMut.isPending}
                  onClick={handleResetPassword}
                >
                  Ustaw hasło
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
