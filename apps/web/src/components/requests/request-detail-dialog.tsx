'use client';
import { useEffect, useRef, useState } from 'react';
import {
  useRequestById, useAddRequestActivity, useAssignRequest, useChangeRequestStatus,
  useSetScheduledDate, useSetCompletionDate, useSetRequestAddress, useUploadAttachment,
} from '@/hooks/useRequests';
import { useServiceGroups, useServiceGroupMembers } from '@/hooks/useServiceGroups';
import { useEmployees } from '@/hooks/useEmployees';
import { useServiceCatalog } from '@/hooks/useServiceCatalog';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Stars } from '@/components/ui/stars';
import { openAuthenticatedFile, downloadAuthenticatedFile } from '@/lib/download';
import { AddressFields, addressDtoToForm, addressFormToDto, emptyAddress, type AddressFormValue } from '@/components/common/address-fields';
import { TaskRow } from './task-row';
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/types';
import { formatDateTime, formatDayDifference } from '@/lib/utils';
import {
  MapPin, Calendar, User, Phone, Paperclip, Plus, Loader2, FileText, Download, Printer,
} from 'lucide-react';

export function RequestDetailDialog({ requestId, onClose }: { requestId: number | null; onClose: () => void }) {
  const { data: request } = useRequestById(requestId);
  const { data: catalog } = useServiceCatalog();
  const { data: groups } = useServiceGroups();
  const addActivityMut = useAddRequestActivity();
  const assignMut = useAssignRequest();
  const statusMut = useChangeRequestStatus();
  const dateMut = useSetScheduledDate();
  const completionDateMut = useSetCompletionDate();
  const addressMut = useSetRequestAddress();
  const uploadMut = useUploadAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceGroupId, setServiceGroupId] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [addingService, setAddingService] = useState('');
  const [address, setAddress] = useState<AddressFormValue>(emptyAddress);

  const { data: members } = useServiceGroupMembers(serviceGroupId ? Number(serviceGroupId) : null);
  const { data: contractorEmployees } = useEmployees({ contractorId: contractorId ? Number(contractorId) : undefined });

  useEffect(() => {
    if (!request) return;
    setServiceGroupId(request.serviceGroupId?.toString() ?? '');
    setContractorId(request.contractorId?.toString() ?? '');
    setEmployeeId(request.employeeId?.toString() ?? '');
    setAddress(addressDtoToForm(request.address));
  }, [request]);

  if (!request) return null;

  const handleAssign = () => {
    assignMut.mutate({
      requestId: request.id,
      serviceGroupId: serviceGroupId ? Number(serviceGroupId) : null,
      contractorId: contractorId ? Number(contractorId) : null,
      employeeId: employeeId ? Number(employeeId) : null,
    });
  };

  const availableCatalogItems = catalog ?? [];

  const activityNameCounts = new Map<string, number>();
  request.activities.forEach(a => activityNameCounts.set(a.name, (activityNameCounts.get(a.name) ?? 0) + 1));
  const activityNameSeen = new Map<string, number>();

  return (
    <Dialog open={!!requestId} onClose={onClose} title={request.number} className="max-w-2xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={REQUEST_STATUS_COLORS[request.status]}>{REQUEST_STATUS_LABELS[request.status]}</Badge>
          <select
            value={request.status}
            onChange={e => statusMut.mutate({ requestId: request.id, status: Number(e.target.value) })}
            className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs focus:border-accent-500 focus:outline-none"
          >
            {Object.entries(REQUEST_STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          {request.rating != null && <Stars value={request.rating} />}
          <button
            onClick={() => openAuthenticatedFile(`/api/requests/${request.id}/protocol.pdf`)}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            <Printer className="h-3.5 w-3.5" /> Drukuj protokół
          </button>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
            <User className="h-4 w-4 shrink-0 text-stone-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-800">{request.customerName}</p>
              {request.customerPhone && <p className="flex items-center gap-1 text-xs text-stone-400"><Phone className="h-3 w-3" />{request.customerPhone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0 text-stone-400" />
            <span className="text-sm text-stone-700">{request.locationName ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
            <Calendar className="h-4 w-4 shrink-0 text-stone-400" />
            <div className="flex-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-stone-400">Planowana realizacja</p>
              <input
                type="date"
                defaultValue={request.scheduledDate ? request.scheduledDate.slice(0, 10) : ''}
                onBlur={e => dateMut.mutate({ requestId: request.id, scheduledDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full bg-transparent text-sm text-stone-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2">
            <Calendar className="h-4 w-4 shrink-0 text-stone-400" />
            <div className="flex-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-wide text-stone-400">Faktyczna realizacja</p>
              <input
                type="date"
                defaultValue={request.completionDate ? request.completionDate.slice(0, 10) : ''}
                onBlur={e => completionDateMut.mutate({ requestId: request.id, completionDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full bg-transparent text-sm text-stone-700 focus:outline-none"
              />
            </div>
          </div>
          {request.scheduledDate && request.completionDate && (
            <div className="col-span-2 flex justify-end">
              <Badge tone={
                request.scheduledDate.slice(0, 10) === request.completionDate.slice(0, 10) ? 'success'
                  : new Date(request.completionDate) > new Date(request.scheduledDate) ? 'danger' : 'success'
              }>
                {formatDayDifference(request.scheduledDate, request.completionDate)}
              </Badge>
            </div>
          )}
        </div>

        {request.description && (
          <p className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">{request.description}</p>
        )}

        {request.ratingComment && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <span className="font-medium">Komentarz klienta:</span> {request.ratingComment}
          </p>
        )}

        {/* Adres wykonania */}
        <div>
          <AddressFields value={address} onChange={setAddress} label="Adres wykonania" />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm" variant="outline" disabled={addressMut.isPending}
              onClick={() => addressMut.mutate({ requestId: request.id, address: addressFormToDto(address) })}
            >
              Zapisz adres
            </Button>
          </div>
        </div>

        {/* Przypisanie */}
        <div className="rounded-xl border border-stone-200 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Przypisanie</p>
          <div className="grid grid-cols-3 gap-2">
            <Select value={serviceGroupId} onChange={e => { setServiceGroupId(e.target.value); setContractorId(''); setEmployeeId(''); }} className="text-xs">
              <option value="">— Grupa —</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
            <Select value={contractorId} onChange={e => { setContractorId(e.target.value); setEmployeeId(''); }} disabled={!serviceGroupId} className="text-xs">
              <option value="">— Firma —</option>
              {members?.map(m => <option key={m.id} value={m.id}>{m.name}{m.averageRating != null ? ` (★${m.averageRating.toFixed(1)})` : ''}</option>)}
            </Select>
            <Select value={employeeId} onChange={e => setEmployeeId(e.target.value)} disabled={!contractorId} className="text-xs">
              <option value="">— Instalator —</option>
              {contractorEmployees?.map(e => <option key={e.id} value={e.id}>{e.fullName}{e.averageRating != null ? ` (★${e.averageRating.toFixed(1)})` : ''}</option>)}
            </Select>
          </div>
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="outline" onClick={handleAssign} disabled={assignMut.isPending}>Zapisz przypisanie</Button>
          </div>
        </div>

        <Tabs defaultValue="services">
          <TabsList>
            <TabsTrigger value="services">Usługi</TabsTrigger>
            <TabsTrigger value="attachments">Załączniki{request.attachments.length > 0 ? ` (${request.attachments.length})` : ''}</TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            <div className="space-y-3">
              {request.activities.map(activity => {
                const total = activityNameCounts.get(activity.name) ?? 1;
                const idx = (activityNameSeen.get(activity.name) ?? 0) + 1;
                activityNameSeen.set(activity.name, idx);
                const label = total > 1 ? `${activity.name} #${idx}` : activity.name;
                return (
                  <div key={activity.id} className="rounded-xl border border-stone-200 p-3">
                    <p className="mb-1.5 text-sm font-semibold text-stone-900">{label}</p>
                    <div className="divide-y divide-stone-50">
                      {activity.tasks.map(task => (
                        <TaskRow key={task.id} task={task} requestId={request.id} activityId={activity.id} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {availableCatalogItems.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Select value={addingService} onChange={e => setAddingService(e.target.value)} className="h-8 flex-1 text-xs">
                  <option value="">— Dodaj usługę z katalogu —</option>
                  {availableCatalogItems.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Button size="sm" disabled={!addingService || addActivityMut.isPending} onClick={async () => {
                  await addActivityMut.mutateAsync({ requestId: request.id, serviceCatalogItemId: Number(addingService) });
                  setAddingService('');
                }}>
                  <Plus className="h-3.5 w-3.5" /> Dodaj
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attachments">
            <div className="mb-2 flex items-center justify-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
                disabled={uploadMut.isPending}
              >
                {uploadMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                Dodaj plik
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) uploadMut.mutate({ requestId: request.id, file });
                  e.target.value = '';
                }}
              />
            </div>
            {request.attachments.length === 0 ? (
              <p className="text-sm text-stone-400">Brak załączników.</p>
            ) : (
              <div className="space-y-1">
                {request.attachments.map(a => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-stone-400" />
                    <span className="flex-1 truncate text-stone-700">{a.fileName}</span>
                    <span className="shrink-0 text-xs text-stone-400">{(a.fileSize / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={() => downloadAuthenticatedFile(`/api/requests/${request.id}/attachments/${a.id}`, a.fileName)}
                      className="shrink-0 text-stone-300 hover:text-accent-600"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <p className="text-right text-xs text-stone-300">Utworzono {formatDateTime(request.createdAt)}</p>
      </div>
    </Dialog>
  );
}
