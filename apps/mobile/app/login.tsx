import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import { getServerUrl, saveServerUrl } from '@/lib/auth-storage';
import { API_URL } from '@/lib/constants';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getServerUrl().then((u) => setServerUrl(u ?? API_URL));
  }, []);

  const canSubmit =
    /^https?:\/\/.+/i.test(serverUrl.trim()) && loginIdentifier.trim().length > 0 && pin.length >= 4 && !isSubmitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await saveServerUrl(serverUrl);
      await login(loginIdentifier.trim(), pin);
      router.replace('/(main)/zlecenia');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Nie udało się zalogować. Sprawdź połączenie z serwerem.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Monterio</Text>
        <Text style={styles.subtitle}>Logowanie instalatora</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Adres serwera</Text>
          <TextInput
            value={serverUrl}
            onChangeText={setServerUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="http://192.168.1.10:5020"
            style={styles.input}
          />

          <Text style={styles.label}>Login</Text>
          <TextInput
            value={loginIdentifier}
            onChangeText={setLoginIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="np. jkowalski"
            style={styles.input}
          />

          <Text style={styles.label}>PIN</Text>
          <TextInput
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            placeholder="••••"
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            disabled={!canSubmit}
            onPress={onSubmit}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Zaloguj</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 32, fontWeight: '700', color: '#1c1917', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#78716c', textAlign: 'center', marginTop: 4, marginBottom: 40 },
  form: { gap: 6 },
  label: { fontSize: 13, color: '#57534e', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#d6d3d1', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: '#1c1917',
  },
  error: { color: '#b91c1c', fontSize: 13, marginTop: 12 },
  button: {
    marginTop: 24, backgroundColor: '#2563eb', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
