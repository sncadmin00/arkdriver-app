import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchLoads } from '@/lib/api';
import type { Load } from '@/types';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  loadCard: { backgroundColor: '#1F2937', borderRadius: 8, padding: 16, marginBottom: 12, borderColor: '#374151', borderWidth: 1 },
  loadTitle: { color: '#E5E7EB', fontWeight: '600', marginBottom: 4 },
  loadRoute: { color: '#9CA3AF', fontSize: 12 },
  loadPay: { color: '#F59E0B', marginTop: 8 },
});

export default function LoadsScreen() {
  const { data: loads, isLoading } = useQuery({ queryKey: ['loads'], queryFn: fetchLoads });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loads</Text>
      </View>
      <View style={styles.content}>
        {isLoading ? (
          <Text style={{ color: '#9CA3AF' }}>Loading...</Text>
        ) : !loads || loads.length === 0 ? (
          <Text style={{ color: '#9CA3AF' }}>No loads available</Text>
        ) : (
          <FlatList
            data={loads}
            keyExtractor={(item: Load) => item.id}
            renderItem={({ item }: { item: Load }) => (
              <TouchableOpacity style={styles.loadCard}>
                <Text style={styles.loadTitle}>Load #{item.load_number}</Text>
                <Text style={styles.loadRoute}>{item.pickup_location} → {item.delivery_location}</Text>
                <Text style={styles.loadPay}>${item.pay_rate} • {item.distance}mi</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
}
