import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDashboard, useChangeRequestStatus } from '@/hooks/useRequests';
import { useForegroundRefetch } from '@/hooks/useForegroundRefetch';
import { StarRating } from '@/components/star-rating';
import { formatLongDate, formatTime, formatWhen } from '@/lib/format';
import { formatAddressLine, openInMaps } from '@/lib/actions';
import { REQUEST_STATUS_COLORS, type RequestListFilter, type RequestListItem } from '@/types';

const ANTHRACITE = '#2c2a28';
const AMBER = '#854f0b';

const TILES: { filter: RequestListFilter; label: string; key: 'today' | 'inProgress' | 'toClaim' | 'thisWeek' | 'completedThisMonth' }[] = [
  { filter: 'today', label: 'Dziś', key: 'today' },
  { filter: 'inprogress', label: 'W trakcie', key: 'inProgress' },
  { filter: 'week', label: 'Ten tydzień', key: 'thisWeek' },
  { filter: 'pool', label: 'Do przejęcia', key: 'toClaim' },
  { filter: 'month', label: 'Wykonane w miesiącu', key: 'completedThisMonth' },
];

function NextRequestCard({ item }: { item: RequestListItem }) {
  const router = useRouter();
  const statusMut = useChangeRequestStatus();
  const addressLine = formatAddressLine(item.address);
  const open = () => router.push(`/(main)/zlecenia/${item.id}`);

  const start = () => {
    statusMut.mutate({ requestId: item.id, status: 3 }, {
      onSuccess: open,
      onError: () => Alert.alert('Nie udało się rozpocząć zlecenia', 'Spróbuj ponownie.'),
    });
  };

  return (
    <Pressable style={styles.next} onPress={open}>
      <View style={styles.rowBetween}>
        <Text style={styles.nextLabel}>{item.status === 3 ? 'W trakcie' : 'Następne zlecenie'}</Text>
        <Text style={styles.nextWhen}>{formatWhen(item.scheduledDate)}</Text>
      </View>
      <Text style={styles.nextTitle}>{item.number}</Text>
      <Text style={styles.nextMeta}>{item.customerName}{addressLine ? ` · ${addressLine}` : ''}</Text>
      <View style={styles.nextButtons}>
        {item.status === 3 ? (
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={open}>
            <Text style={styles.btnPrimaryText}>Otwórz</Text>
          </Pressable>
        ) : (
          <Pressable style={[styles.btn, styles.btnPrimary]} disabled={statusMut.isPending}
            onPress={(e) => { e.stopPropagation(); start(); }}>
            {statusMut.isPending
              ? <ActivityIndicator size="small" color="#faeeda" />
              : <Text style={styles.btnPrimaryText}>Rozpocznij</Text>}
          </Pressable>
        )}
        {item.address && addressLine && (
          <Pressable style={[styles.btn, styles.btnOutline]}
            onPress={(e) => { e.stopPropagation(); openInMaps(item.address!); }}>
            <Text style={styles.btnOutlineText}>Nawiguj</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, isFetching, refetch } = useDashboard();
  useForegroundRefetch(refetch);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={AMBER} /></View>;
  }
  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Nie udało się wczytać pulpitu.</Text>
        <Pressable style={[styles.btn, styles.btnOutline, { marginTop: 12 }]} onPress={() => refetch()}>
          <Text style={styles.btnOutlineText}>Spróbuj ponownie</Text>
        </Pressable>
      </View>
    );
  }

  const { counters, rating, nextRequest, todayPlan } = data;
  const firstName = data.fullName.split(' ')[0];

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerDate}>{formatLongDate(new Date())}</Text>
        <Text style={styles.headerGreeting}>Dzień dobry, {firstName}</Text>
        {data.contractorName && <Text style={styles.headerMeta}>{data.contractorName}</Text>}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
      >
        {nextRequest
          ? <NextRequestCard item={nextRequest} />
          : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Brak nadchodzących zleceń</Text>
              <Text style={styles.emptyMeta}>
                {counters.toClaim > 0 ? `W puli czeka ${counters.toClaim} do przejęcia.` : 'Dyspozytor jeszcze nic Ci nie przypisał.'}
              </Text>
            </View>
          )}

        <View style={styles.grid}>
          {TILES.map((t, i) => (
            <Pressable
              key={t.filter}
              style={[styles.tile, i === TILES.length - 1 && styles.tileWide]}
              onPress={() => router.navigate({ pathname: '/(main)/(tabs)/zlecenia', params: { filter: t.filter } })}
            >
              <Text style={styles.tileLabel}>{t.label}</Text>
              <Text style={styles.tileValue}>{counters[t.key]}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingScore}>
            <Text style={styles.ratingValue}>
              {rating.average != null ? rating.average.toFixed(1).replace('.', ',') : '—'}
            </Text>
            <Text style={styles.ratingCount}>
              {rating.count === 0 ? 'brak ocen' : `${rating.count} ${rating.count === 1 ? 'ocena' : rating.count < 5 ? 'oceny' : 'ocen'}`}
            </Text>
          </View>
          <View style={styles.grow}>
            <StarRating value={Math.round(rating.average ?? 0)} size={20} readOnly />
            <Text style={styles.ratingComment} numberOfLines={2}>
              {rating.lastComment
                ? `Ostatnia: „${rating.lastComment}”`
                : rating.count === 0 ? 'Oceny wystawiają klienci po zakończonym zleceniu.' : ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Plan na dziś</Text>
        {todayPlan.length === 0
          ? <Text style={styles.empty}>Na dziś nie masz zaplanowanych zleceń.</Text>
          : (
            <View style={styles.plan}>
              {todayPlan.map((r, i) => {
                const color = REQUEST_STATUS_COLORS[r.status] ?? '#78716c';
                return (
                  <Pressable
                    key={r.id}
                    style={[styles.planRow, i > 0 && styles.planRowBorder]}
                    onPress={() => router.push(`/(main)/zlecenia/${r.id}`)}
                  >
                    <Text style={styles.planTime}>{formatTime(r.scheduledDate)}</Text>
                    <View style={styles.grow}>
                      <Text style={styles.planNumber}>{r.number}</Text>
                      <Text style={styles.planMeta} numberOfLines={1}>
                        {r.customerName}{r.address?.street ? ` · ${r.address.street}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: `${color}1a` }]}>
                      <Text style={[styles.badgeText, { color }]}>{r.statusName}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafaf9' },
  grow: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf9', padding: 24 },
  errorText: { color: '#78716c', fontSize: 14 },
  header: { backgroundColor: ANTHRACITE, paddingHorizontal: 16, paddingBottom: 16 },
  headerDate: { fontSize: 12, color: '#d3d1c7' },
  headerGreeting: { fontSize: 20, fontWeight: '600', color: '#faeeda', marginTop: 2 },
  headerMeta: { fontSize: 12, color: '#b4b2a9', marginTop: 4 },
  content: { padding: 14, gap: 12, paddingBottom: 28 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  next: { backgroundColor: '#faeeda', borderColor: '#ba7517', borderWidth: 1.5, borderRadius: 12, padding: 14, gap: 4 },
  nextLabel: { fontSize: 12, fontWeight: '600', color: AMBER },
  nextWhen: { fontSize: 12, fontWeight: '600', color: '#633806' },
  nextTitle: { fontSize: 16, fontWeight: '700', color: '#412402', marginTop: 4 },
  nextMeta: { fontSize: 13, color: '#633806' },
  nextButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: AMBER },
  btnPrimaryText: { color: '#faeeda', fontSize: 14, fontWeight: '600' },
  btnOutline: { borderWidth: 1, borderColor: AMBER, paddingHorizontal: 16 },
  btnOutlineText: { color: '#633806', fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 12, padding: 14, gap: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#1c1917' },
  emptyMeta: { fontSize: 13, color: '#78716c' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', flexGrow: 1, backgroundColor: '#f5f5f4', borderRadius: 10, padding: 12 },
  tileWide: { width: '100%' },
  tileLabel: { fontSize: 12, color: '#78716c' },
  tileValue: { fontSize: 24, fontWeight: '600', color: '#1c1917', marginTop: 2 },
  ratingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff',
    borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 12, padding: 12,
  },
  ratingScore: { alignItems: 'center', minWidth: 56 },
  ratingValue: { fontSize: 24, fontWeight: '600', color: '#1c1917' },
  ratingCount: { fontSize: 11, color: '#78716c' },
  ratingComment: { fontSize: 12, color: '#78716c', marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#78716c', marginTop: 4 },
  empty: { fontSize: 13, color: '#a8a29e' },
  plan: { backgroundColor: '#fff', borderColor: '#e7e5e4', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  planRowBorder: { borderTopWidth: 1, borderTopColor: '#e7e5e4' },
  planTime: { fontSize: 13, fontWeight: '600', color: '#1c1917', minWidth: 42 },
  planNumber: { fontSize: 13, fontWeight: '600', color: '#1c1917' },
  planMeta: { fontSize: 12, color: '#78716c' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
});
