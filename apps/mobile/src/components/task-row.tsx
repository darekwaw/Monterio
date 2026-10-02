import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToggleTask, useCompleteMeasurement } from '@/hooks/useRequests';
import type { RequestActivityTask } from '@/types';
import { formatDate } from '@/lib/format';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [outOfRange, setOutOfRange] = useState(false);

  const isMeasurement = task.measurementAttributeId != null;
  const dataType = task.measurementAttributeDataType;

  if (!isMeasurement) {
    return (
      <Pressable
        style={styles.checkboxRow}
        disabled={toggleMut.isPending}
        onPress={() => toggleMut.mutate({ requestId, activityId, taskId: task.id })}
      >
        <View style={[styles.checkbox, task.isDone && styles.checkboxChecked]}>
          {task.isDone && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.taskText, task.isDone && styles.taskTextDone]}>{task.description}</Text>
      </Pressable>
    );
  }

  const options = parseOptions(task.options);
  const rangeLabel = task.minValue != null || task.maxValue != null
    ? `${task.minValue ?? '—'}–${task.maxValue ?? '—'}${task.unit ? ` ${task.unit}` : ''}`
    : task.unit;

  const currentValue =
    dataType === 3 ? (task.measuredValueBoolean == null ? null : (task.measuredValueBoolean ? 'Tak' : 'Nie')) :
    dataType === 4 ? (task.measuredValueDate ? formatDate(task.measuredValueDate) : null) :
    dataType === 2 || dataType === 5 ? task.measuredValueText :
    task.measuredValueDecimal;

  const submit = async (overrideValue?: string) => {
    const v = overrideValue ?? value;
    if (!v) return;
    const body =
      dataType === 3 ? { valueBoolean: v === 'true' } :
      dataType === 4 ? { valueDate: v } :
      dataType === 2 || dataType === 5 ? { valueText: v } :
      { valueDecimal: Number(v) };
    const res = await measureMut.mutateAsync({ requestId, activityId, taskId: task.id, ...body });
    setOutOfRange(res.isOutOfRange);
    setValue('');
  };

  // Pola tekstowe/liczbowe zapisują się same 900ms po ostatnim wpisanym znaku,
  // żeby nie wymagać osobnego "Zapisz" przy każdym wymiarze (bool/select/data
  // zapisują się od razu po wyborze, patrz submit(...) niżej).
  useEffect(() => {
    if (dataType === 3 || dataType === 4 || dataType === 5) return;
    if (!value) return;
    const t = setTimeout(() => submit(value), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, dataType]);

  return (
    <View style={styles.measurementRow}>
      <View style={styles.measurementHeader}>
        <Text style={styles.taskText}>
          {task.description}
          {rangeLabel && dataType === 1 ? <Text style={styles.rangeLabel}> ({rangeLabel})</Text> : null}
        </Text>
        {currentValue != null && (
          <Text style={styles.currentValue}>
            {currentValue}{dataType === 1 && task.unit ? ` ${task.unit}` : ''}
          </Text>
        )}
        {outOfRange && dataType === 1 && <Text style={styles.warning}>⚠ poza zakresem</Text>}
      </View>

      {dataType === 5 ? (
        <View style={styles.pickerWrap}>
          <Picker selectedValue={value} onValueChange={(v) => { setValue(String(v)); if (v) submit(String(v)); }}>
            <Picker.Item label="wybierz…" value="" />
            {options.map((o) => <Picker.Item key={o} label={o} value={o} />)}
          </Picker>
        </View>
      ) : dataType === 3 ? (
        <View style={styles.boolRow}>
          <Pressable
            style={[styles.boolButton, value === 'true' && styles.boolButtonActive]}
            onPress={() => { setValue('true'); submit('true'); }}
          >
            <Text style={[styles.boolButtonText, value === 'true' && styles.boolButtonTextActive]}>Tak</Text>
          </Pressable>
          <Pressable
            style={[styles.boolButton, value === 'false' && styles.boolButtonActive]}
            onPress={() => { setValue('false'); submit('false'); }}
          >
            <Text style={[styles.boolButtonText, value === 'false' && styles.boolButtonTextActive]}>Nie</Text>
          </Pressable>
        </View>
      ) : dataType === 4 ? (
        <>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{value || 'wybierz datę'}</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={value ? new Date(value) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) {
                  const iso = selected.toISOString().slice(0, 10);
                  setValue(iso);
                  submit(iso);
                }
              }}
            />
          )}
        </>
      ) : (
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={() => submit()}
          onBlur={() => value && submit()}
          placeholder={currentValue != null ? 'nowa wartość' : 'wartość'}
          keyboardType={dataType === 1 ? 'numeric' : 'default'}
          returnKeyType="done"
          style={styles.input}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#d6d3d1',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  taskText: { fontSize: 14, color: '#292524', flexShrink: 1 },
  taskTextDone: { color: '#a8a29e', textDecorationLine: 'line-through' },
  rangeLabel: { fontSize: 12, color: '#a8a29e' },
  measurementRow: { paddingVertical: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#f0efee' },
  measurementHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  currentValue: { fontSize: 14, fontWeight: '600', color: '#1c1917' },
  warning: { fontSize: 12, color: '#b45309' },
  input: {
    borderWidth: 1, borderColor: '#d6d3d1', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 14,
  },
  pickerWrap: { borderWidth: 1, borderColor: '#d6d3d1', borderRadius: 8, overflow: 'hidden' },
  boolRow: { flexDirection: 'row', gap: 8 },
  boolButton: {
    flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d6d3d1',
    alignItems: 'center',
  },
  boolButtonActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  boolButtonText: { fontSize: 14, color: '#57534e', fontWeight: '500' },
  boolButtonTextActive: { color: '#fff' },
  dateButton: {
    borderWidth: 1, borderColor: '#d6d3d1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
  },
  dateButtonText: { fontSize: 14, color: '#292524' },
});
