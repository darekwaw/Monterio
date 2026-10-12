import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMyRequests, useClaimRequest } from '@/hooks/useRequests';
import { useForegroundRefetch } from '@/hooks/useForegroundRefetch';
import { useAuth } from '@/context/auth-context';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, type RequestListItem } from '@/types';
import { formatDate } from '@/lib/format';
import { callPhone, formatAddressLine, openInMaps } from '@/lib/actions';

const STATUS_FILTERS: { label: string; value: number | undefined }[] = [
  { label: 'Wszystkie', value: undefined },
  { label: 'Nowe', value: 1 },
  { label: 'Przypisane', value: 2 },
  { label: 'W trakcie', value: 3 },
  { label: 'Wykonane', value: 4 },
];

function StatusBadge({ status, label }: { status: number; label: string }) {
  const color = REQUEST_STATUS_COLORS[status] ?? '#78716c';
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1a` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function RequestCard({ item, onPress }: { item: RequestListItem; onPress: () => void }) {
  const addressLine = formatAddressLine(item.address);
  const claimMut = useClaimRequest();

  const claim = () => {
    claimMut.mutate(item.id, {
      onError: () => Alert.alert('Nie udało się przejąć', 'Ktoś mógł już przejąć to zlecenie przed Tobą.'),
    });
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardNumber}>{item.number}</Text>
        <View style={styles.cardHeaderRight}>
          {item.canClaim
            ? <View style={[styles.badge, styles.poolBadge]}><Text style={[styles.badgeText, styles.poolBadgeText]}>Do przejęcia</Text></View>
            : <StatusBadge status={item.status} label={item.statusName} />}
          {(addressLine || item.customerPhone) && (
            <View style={styles.iconRow}>
              {addressLine && (
                <Pressable
                  style={styles.iconButton}
                  hitSlop={8}
                  onPress={(e) => { e.stopPropagation(); openInMaps(item.address!); }}
                >
                  <Text style={styles.iconButtonText}>🧭</Text>
                </Pressable>
              )}
              {item.customerPhone && (
                <Pressable
                  style={styles.iconButton}
                  hitSlop={8}
                  onPress={(e) => { e.stopPropagation(); callPhone(item.customerPhone!); }}
                >
                  <Text style={styles.iconButtonText}>📞</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
      <Text style={styles.cardCustomer}>{item.customerName}</Text>
      {item.serviceGroupName && !item.contractorName && (
        <Text style={styles.cardMeta}>Grupa: {item.serviceGroupName}</Text>
      )}
      {addressLine && <Text style={styles.cardMeta}>🧭 {addressLine}</Text>}
      <Text style={styles.cardDate}>
        Termin: {item.scheduledDate ? formatDate(item.scheduledDate) : 'nieustalony'}
      </Text>
      {item.canClaim && (
        <Pressable
          style={[styles.cardActionButton, styles.claimButton]}
          disabled={claimMut.isPending}
          onPress={(e) => { e.stopPropagation(); claim(); }}
        >
          {claimMut.isPending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[styles.cardActionText, styles.claimButtonText]}>Przejmij</Text>}
        </Pressable>
      )}
    </Pressable>
  );
}

export default function RequestListScreen() {
  const router = useRouter();
  const { logout, session } = useAuth();
  const [status, setStatus] = useState<number | undefined>(undefined);
  const { requests, isLoading, isFetching, refetch } = useMyRequests(status);
  useForegroundRefetch(refetch);

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => { void logout(); }} hitSlop={12}>
              <Text style={styles.logout}>Wyloguj</Text>
            </Pressable>
          ),
        }}
      />

      <Text style={styles.greeting}>Cześć, {session?.fullName}</Text>

      <View style={styles.filters}>
        <FlatList
          data={STATUS_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(f) => f.label}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item: f }) => (
            <Pressable
              style={[styles.chip, status === f.value && styles.chipActive]}
              onPress={() => setStatus(f.value)}
            >
              <Text style={[styles.chipText, status === f.value && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <RequestCard item={item} onPress={() => router.push(`/(main)/zlecenia/${item.id}`)} />
        )}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>Brak zleceń w tej kategorii.</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafaf9' },
  greeting: { fontSize: 14, color: '#78716c', paddingHorizontal: 16, paddingTop: 12 },
  logout: { color: '#2563eb', fontSize: 15, fontWeight: '500' },
  filters: { paddingVertical: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#e7e5e4',
  },
  chipActive: { backgroundColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#57534e', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#e7e5e4', gap: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardNumber: { fontSize: 15, fontWeight: '700', color: '#1c1917' },
  cardHeaderRight: { alignItems: 'flex-end', gap: 5 },
  iconRow: { flexDirection: 'row', gap: 6 },
  iconButton: {
    width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#e7e5e4',
    backgroundColor: '#fafaf9', alignItems: 'center', justifyContent: 'center',
  },
  iconButtonText: { fontSize: 14 },
  cardCustomer: { fontSize: 14, color: '#292524' },
  cardMeta: { fontSize: 12, color: '#78716c' },
  cardDate: { fontSize: 12, color: '#78716c' },
  cardActionButton: {
    borderWidth: 1, borderColor: '#2563eb', borderRadius: 8, paddingVertical: 7, alignItems: 'center', marginTop: 6,
  },
  cardActionText: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
  claimButton: { backgroundColor: '#15803d', borderColor: '#15803d' },
  claimButtonText: { color: '#fff' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  poolBadge: { backgroundColor: '#15803d1a' },
  poolBadgeText: { color: '#15803d' },
  empty: { textAlign: 'center', color: '#a8a29e', marginTop: 60, fontSize: 14 },
});
