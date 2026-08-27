import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchLoads } from '@/lib/api';
import type { Load } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  booked: '#3B82F6',
  dispatched: '#8B5CF6',
  in_transit: '#F59E0B',
  delivered: '#10B981',
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  list: { padding: 24 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 14, borderColor: '#374151', borderWidth: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loadId: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  ref: { color: '#6B7280', fontSize: 11, marginBottom: 12 },
  leg: { marginBottom: 10 },
  legLabel: { color: '#6B7280', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  legText: { color: '#E5E7EB', fontSize: 13, lineHeight: 18 },
  legTime: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },
  footer: { borderTopColor: '#374151', borderTopWidth: 1, marginTop: 6, paddingTop: 10 },
  miles: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
});

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] ?? '#4B5563' }]}>
      <Text style={styles.badgeText}>{status.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
}

export default function LoadsScreen() {
  const { data: loads, isLoading, error } = useQuery({ queryKey: ['loads'], queryFn: () => fetchLoads() });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Loads</Text>
        </View>
        {isLoading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : error ? (
          <Text style={[styles.empty, { color: '#EF4444' }]}>{error.message}</Text>
        ) : !loads?.length ? (
          <Text style={styles.empty}>No active loads</Text>
        ) : (
          <FlatList
            data={loads}
            keyExtractor={(item: Load) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: Load }) => (
              <TouchableOpacity style={styles.card} activeOpacity={0.7}>
                <View style={styles.topRow}>
                  <Text style={styles.loadId}>{item.id}</Text>
                  <StatusBadge status={item.status} />
                </View>
                {item.reference && <Text style={styles.ref}>{item.reference}</Text>}
                <View style={styles.leg}>
                  <Text style={styles.legLabel}>PICKUP</Text>
                  <Text style={styles.legText}>{item.origin}</Text>
                  {item.pickupAt && <Text style={styles.legTime}>{item.pickupAt} · {item.pickupTime}</Text>}
                </View>
                <View style={styles.leg}>
                  <Text style={styles.legLabel}>DELIVERY</Text>
                  <Text style={styles.legText}>{item.destination}</Text>
                  {item.deliverAt && <Text style={styles.legTime}>{item.deliverAt} · {item.deliverTime}</Text>}
                </View>
                <View style={styles.footer}>
                  <Text style={styles.miles}>{item.miles} mi</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
