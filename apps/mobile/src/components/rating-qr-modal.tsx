import { Modal, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useRatingLink } from '@/hooks/useRequests';

/** Kod QR do publicznej strony oceny (patrz apps/web/src/app/ocena/[id]) — instalator tylko
 * WYŚWIETLA kod na swoim ekranie, klient skanuje WŁASNYM telefonem i ocenia sam. Świadoma
 * decyzja biznesowa: ocena wpisywana na urządzeniu instalatora byłaby niewiarygodna. */
export function RatingQrModal({ visible, onClose, requestId }: {
  visible: boolean; onClose: () => void; requestId: number;
}) {
  const { data: url, isLoading, isError } = useRatingLink(visible ? requestId : null);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Poproś klienta o zeskanowanie</Text>
          <Text style={styles.subtitle}>Klient sam oceni zlecenie na swoim telefonie.</Text>

          <View style={styles.qrBox}>
            {isLoading && <ActivityIndicator size="large" color="#2563eb" />}
            {isError && <Text style={styles.error}>Nie udało się wygenerować kodu.</Text>}
            {url && <QRCode value={url} size={220} />}
          </View>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Zamknij</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1c1917', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#78716c', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  qrBox: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, color: '#b91c1c', textAlign: 'center' },
  closeButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 24 },
  closeButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
