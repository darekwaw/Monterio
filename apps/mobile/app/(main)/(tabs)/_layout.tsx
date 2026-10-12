import { Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';

const AMBER = '#854f0b';

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: AMBER,
        tabBarInactiveTintColor: '#78716c',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#1c1917',
      }}
    >
      <Tabs.Screen
        name="pulpit"
        options={{
          title: 'Pulpit', headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon glyph="▦" color={color} />,
        }}
      />
      <Tabs.Screen
        name="zlecenia"
        options={{
          title: 'Zlecenia', headerTitle: 'Moje zlecenia',
          tabBarIcon: ({ color }) => <TabIcon glyph="☑" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil', headerTitle: 'Profil',
          tabBarIcon: ({ color }) => <TabIcon glyph="●" color={color} />,
        }}
      />
    </Tabs>
  );
}
