import { View, Text, Pressable, StyleSheet } from 'react-native';

export function StarRating({ value, onChange, size = 32, readOnly = false }: {
  value: number; onChange?: (v: number) => void; size?: number; readOnly?: boolean;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <Text style={[styles.star, { fontSize: size, color: n <= value ? '#f59e0b' : '#e7e5e4' }]}>★</Text>;
        return readOnly
          ? <View key={n}>{star}</View>
          : <Pressable key={n} onPress={() => onChange?.(n)} hitSlop={6}>{star}</Pressable>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  star: { fontWeight: '400' },
});
