'use client';
import { useState } from 'react';
import { useToggleTask, useCompleteMeasurement } from '@/hooks/useRequests';
import { Input } from '@/components/ui/input';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { RequestActivityTask } from '@/types';

function parseOptions(options: string | null): string[] {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function TaskRow({ task, requestId, activityId }: {
  task: RequestActivityTask; requestId: number; activityId: number;
}) {
  const toggleMut = useToggleTask();
  const measureMut = useCompleteMeasurement();
  const [value, setValue] = useState('');
  const [outOfRange, setOutOfRange] = useState(false);

  const isMeasurement = task.measurementAttributeId != null;
  const dataType = task.measurementAttributeDataType;
  const rangeLabel = task.minValue != null || task.maxValue != null
    ? `${task.minValue ?? '—'}–${task.maxValue ?? '—'}${task.unit ? ` ${task.unit}` : ''}`
    : task.unit;

  if (!isMeasurement) {
    return (
      <label className="group flex items-center gap-2.5 py-1.5">
        <input
          type="checkbox"
          checked={task.isDone}
          disabled={toggleMut.isPending}
          onChange={() => toggleMut.mutate({ requestId, activityId, taskId: task.id })}
          className="h-4 w-4 shrink-0 rounded border-stone-300 text-accent-600 focus:ring-accent-500"
        />
        <span className={cn('text-sm', task.isDone ? 'text-stone-400 line-through' : 'text-stone-700')}>
          {task.description}
        </span>
      </label>
    );
  }

  const options = parseOptions(task.options);

  const currentValue =
    dataType === 3 ? (task.measuredValueBoolean == null ? null : (task.measuredValueBoolean ? 'Tak' : 'Nie')) :
    dataType === 4 ? (task.measuredValueDate ? formatDate(task.measuredValueDate) : null) :
    dataType === 2 || dataType === 5 ? task.measuredValueText :
    task.measuredValueDecimal;

  const submit = async () => {
    if (!value) return;
    const body =
      dataType === 3 ? { valueBoolean: value === 'true' } :
      dataType === 4 ? { valueDate: value } :
      dataType === 2 || dataType === 5 ? { valueText: value } :
      { valueDecimal: Number(value) };
    const res = await measureMut.mutateAsync({ requestId, activityId, taskId: task.id, ...body });
    setOutOfRange(res.isOutOfRange);
    setValue('');
  };

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
        task.isDone ? 'border-green-500 bg-green-500' : 'border-stone-300')}>
        {task.isDone && <Check className="h-2.5 w-2.5 text-white" />}
      </span>
      <span className="flex-1 text-sm text-stone-700">
        {task.description}
        {rangeLabel && dataType === 1 && <span className="ml-1.5 text-xs text-stone-400">({rangeLabel})</span>}
      </span>
      {currentValue != null && !toggleMut.isPending && (
        <span className="text-sm font-medium text-stone-900">
          {currentValue}{dataType === 1 && task.unit ? ` ${task.unit}` : ''}
        </span>
      )}

      {dataType === 5 ? (
        <select
          value={value}
          onChange={e => setValue(e.target.value)}
          className="h-8 w-32 rounded-lg border border-stone-300 bg-white px-2 text-xs focus:border-accent-500 focus:outline-none"
        >
          <option value="">{currentValue != null ? 'zmień' : 'wybierz'}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : dataType === 3 ? (
        <select
          value={value}
          onChange={e => setValue(e.target.value)}
          className="h-8 w-24 rounded-lg border border-stone-300 bg-white px-2 text-xs focus:border-accent-500 focus:outline-none"
        >
          <option value="">{currentValue != null ? 'zmień' : 'wybierz'}</option>
          <option value="true">Tak</option>
          <option value="false">Nie</option>
        </select>
      ) : dataType === 4 ? (
        <input
          type="date"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="h-8 w-36 rounded-lg border border-stone-300 bg-white px-2 text-xs focus:border-accent-500 focus:outline-none"
        />
      ) : dataType === 2 ? (
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={currentValue != null ? 'nowa wartość' : 'wartość'}
          className="h-8 w-32 text-xs"
        />
      ) : (
        <Input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={currentValue != null ? 'nowy odczyt' : 'wartość'}
          type="number" step="any"
          className="h-8 w-28 text-xs"
        />
      )}

      <button
        disabled={!value || measureMut.isPending}
        onClick={submit}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent-600 hover:bg-accent-50 disabled:opacity-30"
      >
        {measureMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
      {outOfRange && dataType === 1 && (
        <span title="Wartość poza zakresem">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        </span>
      )}
    </div>
  );
}
