import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { session, logout } = useAuth();

  return (
    <View style={styles.flex}>
      <View style={styles.card}>
        <Text style={styles.name}>{session?.fullName}</Text>
        <Text style={styles.meta}>Instalator</Text>
      </View>
      <Pressable style={styles.logout} onPress={() => { void logout(); }}>
        <Text style={styles.logoutText}>Wyloguj</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafaf9', padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e7e5e4', padding: 16, gap: 2 },
  name: { fontSize: 17, fontWeight: '700', color: '#1c1917' },
  meta: { fontSize: 13, color: '#78716c' },
  logout: { borderWidth: 1, borderColor: '#b91c1c', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  logoutText: { color: '#b91c1c', fontSize: 15, fontWeight: '600' },
});
