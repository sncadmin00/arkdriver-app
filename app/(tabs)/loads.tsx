import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter } from 'expo-router';
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
  tabs: { flexDirection: 'row', marginTop: 14 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  tabOn: { backgroundColor: '#F59E0B' },
  tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  tabOnText: { color: '#0B0F14' },
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
  const router = useRouter();
  const { t } = useTranslation();
  const [scope, setScope] = useState('active');
  const { data: loads, isLoading, error } = useQuery({
    queryKey: ['loads', scope],
    queryFn: () => fetchLoads(scope === 'history' ? 'history' : undefined),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('loads.title')}</Text>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, scope === 'active' && styles.tabOn]}
              onPress={() => setScope('active')}
            >
              <Text style={[styles.tabText, scope === 'active' && styles.tabOnText]}>{t('loads.active')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, scope === 'history' && styles.tabOn]}
              onPress={() => setScope('history')}
            >
              <Text style={[styles.tabText, scope === 'history' && styles.tabOnText]}>{t('loads.history')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {isLoading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : error ? (
          <Text style={[styles.empty, { color: '#EF4444' }]}>{error.message}</Text>
        ) : !loads?.length ? (
          <Text style={styles.empty}>{scope === 'history' ? t('loads.noHistory') : t('loads.noActive')}</Text>
        ) : (
          <FlatList
            data={loads}
            keyExtractor={(item: Load) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: Load }) => (
              <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push(`/load/${item.id}`)}>
                <View style={styles.topRow}>
                  <Text style={styles.loadId}>{item.id}</Text>
                  <StatusBadge status={item.status} />
                </View>
                {item.reference && <Text style={styles.ref}>{item.reference}</Text>}
                <View style={styles.leg}>
                  <Text style={styles.legLabel}>{t('loads.pickup')}</Text>
                  <Text style={styles.legText}>{item.origin}</Text>
                  {item.pickupAt && <Text style={styles.legTime}>{item.pickupAt} · {item.pickupTime}</Text>}
                </View>
                <View style={styles.leg}>
                  <Text style={styles.legLabel}>{t('loads.delivery')}</Text>
                  <Text style={styles.legText}>{item.destination}</Text>
                  {item.deliverAt && <Text style={styles.legTime}>{item.deliverAt} · {item.deliverTime}</Text>}
                </View>
                <View style={styles.footer}>
                  <Text style={styles.miles}>{t('loads.miles', { count: item.miles })}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
