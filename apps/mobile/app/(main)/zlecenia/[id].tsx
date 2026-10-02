import { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  useRequestById, useChangeRequestStatus, useUploadAttachment,
} from '@/hooks/useRequests';
import { useForegroundRefetch } from '@/hooks/useForegroundRefetch';
import { TaskRow } from '@/components/task-row';
import { StarRating } from '@/components/star-rating';
import { RatingQrModal } from '@/components/rating-qr-modal';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { callPhone, formatAddressLine, openInMaps } from '@/lib/actions';

const STATUS_OPTIONS = [1, 2, 3, 4, 5];

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: request, isLoading, refetch } = useRequestById(requestId);
  useForegroundRefetch(refetch);
  const statusMut = useChangeRequestStatus();
  const uploadMut = useUploadAttachment();
  const [qrVisible, setQrVisible] = useState(false);

  if (isLoading || !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const address = request.address;
  const addressLine = formatAddressLine(address);

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Brak uprawnień', 'Aplikacja potrzebuje dostępu, aby dodać zdjęcie.');
      return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    try {
      await uploadMut.mutateAsync({
        requestId,
        uri: asset.uri,
        name: asset.fileName ?? `zdjecie_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    } catch {
      Alert.alert('Błąd', 'Nie udało się przesłać załącznika.');
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.number}>{request.number}</Text>
          <View style={[styles.badge, { backgroundColor: `${REQUEST_STATUS_COLORS[request.status]}1a` }]}>
            <Text style={[styles.badgeText, { color: REQUEST_STATUS_COLORS[request.status] }]}>
              {request.statusName}
            </Text>
          </View>
        </View>
        <Text style={styles.customer}>{request.customerName}</Text>
        {request.customerPhone && (
          <Pressable onPress={() => callPhone(request.customerPhone!)}>
            <Text style={[styles.meta, styles.link]}>📞 {request.customerPhone}</Text>
          </Pressable>
        )}
        {addressLine && (
          <Pressable onPress={() => openInMaps(address!)}>
            <Text style={[styles.meta, styles.link]}>🧭 {addressLine}</Text>
          </Pressable>
        )}
        {request.locationName && <Text style={styles.meta}>Rejon: {request.locationName}</Text>}
        <Text style={styles.meta}>Termin: {formatDate(request.scheduledDate)}</Text>
        {request.completionDate && <Text style={styles.meta}>Wykonano: {formatDateTime(request.completionDate)}</Text>}
        {request.description && <Text style={styles.description}>{request.description}</Text>}
      </View>

      <Section title="Status zlecenia">
        <View style={styles.statusRow}>
          {STATUS_OPTIONS.map((s) => (
            <Pressable
              key={s}
              style={[styles.statusPill, request.status === s && { backgroundColor: REQUEST_STATUS_COLORS[s] }]}
              disabled={statusMut.isPending}
              onPress={() => statusMut.mutate({ requestId, status: s })}
            >
              <Text style={[styles.statusPillText, request.status === s && styles.statusPillTextActive]}>
                {REQUEST_STATUS_LABELS[s]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Czynności">
        {request.activities.length === 0 && <Text style={styles.emptyText}>Brak przypisanych usług.</Text>}
        {request.activities.map((activity) => (
          <View key={activity.id} style={styles.activityBlock}>
            <Text style={styles.activityName}>
              {activity.name}{activity.isFinished ? ' ✓' : ''}
            </Text>
            {activity.tasks.map((task) => (
              <TaskRow key={task.id} task={task} requestId={requestId} activityId={activity.id} />
            ))}
          </View>
        ))}
      </Section>

      <Section title="Załączniki">
        {request.attachments.map((a) => (
          <Text key={a.id} style={styles.attachment}>{a.fileName}</Text>
        ))}
        <View style={styles.attachmentButtons}>
          <Pressable style={styles.secondaryButton} onPress={() => pickImage(true)} disabled={uploadMut.isPending}>
            <Text style={styles.secondaryButtonText}>Zrób zdjęcie</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => pickImage(false)} disabled={uploadMut.isPending}>
            <Text style={styles.secondaryButtonText}>Wybierz z galerii</Text>
          </Pressable>
        </View>
        {uploadMut.isPending && <ActivityIndicator style={{ marginTop: 8 }} />}
      </Section>

      <Section title="Ocena klienta">
        {request.rating != null ? (
          <>
            <StarRating value={request.rating} readOnly />
            {request.ratingComment && <Text style={styles.description}>{request.ratingComment}</Text>}
          </>
        ) : (
          <Text style={styles.emptyText}>Klient jeszcze nie ocenił zlecenia.</Text>
        )}
        <Pressable style={styles.primaryButton} onPress={() => setQrVisible(true)}>
          <Text style={styles.primaryButtonText}>Pokaż kod QR do oceny</Text>
        </Pressable>
      </Section>

      <RatingQrModal visible={qrVisible} onClose={() => setQrVisible(false)} requestId={requestId} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafaf9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf9' },
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  headerCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e7e5e4', gap: 3,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { fontSize: 18, fontWeight: '700', color: '#1c1917' },
  customer: { fontSize: 15, fontWeight: '600', color: '#292524', marginTop: 4 },
  meta: { fontSize: 13, color: '#78716c' },
  link: { color: '#2563eb', fontWeight: '600' },
  description: { fontSize: 13, color: '#44403c', marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e7e5e4', gap: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#57534e', textTransform: 'uppercase', letterSpacing: 0.4 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: '#e7e5e4' },
  statusPillText: { fontSize: 12, fontWeight: '600', color: '#57534e' },
  statusPillTextActive: { color: '#fff' },
  activityBlock: { gap: 2 },
  activityName: { fontSize: 14, fontWeight: '700', color: '#1c1917', marginBottom: 2 },
  emptyText: { fontSize: 13, color: '#a8a29e' },
  attachment: { fontSize: 13, color: '#292524' },
  attachmentButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryButton: {
    flex: 1, borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center',
  },
  secondaryButtonText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  primaryButton: { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
