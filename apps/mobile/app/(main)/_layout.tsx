import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function MainLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) return null;
  if (!session) return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#fff' }, headerTintColor: '#1c1917' }}>
      <Stack.Screen name="zlecenia/index" options={{ title: 'Moje zlecenia' }} />
      <Stack.Screen name="zlecenia/[id]" options={{ title: 'Zlecenie' }} />
    </Stack>
  );
}
