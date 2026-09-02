import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchMaintenance, fetchMaintenanceYTD } from '@/lib/api';
import type { MaintenanceRecord } from '@/types';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  summaryContainer: { backgroundColor: '#111827', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginBottom: 8 },
  unitsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  unitSummary: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, flex: 1, marginRight: 8 },
  unitLabel: { color: '#6B7280', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  unitAmount: { color: '#F59E0B', fontSize: 16, fontWeight: '700' },
  totalBox: { backgroundColor: '#374151', borderRadius: 8, padding: 12 },
  totalLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  totalAmount: { color: '#10B981', fontSize: 18, fontWeight: '700' },
  
  tabsContainer: { paddingHorizontal: 24, marginBottom: 12 },
  tabs: { flexDirection: 'row' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  tabOn: { backgroundColor: '#F59E0B' },
  tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  tabOnText: { color: '#0B0F14' },
  
  list: { padding: 24 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 14, borderColor: '#374151', borderWidth: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#4B5563' },
  openBadge: { backgroundColor: '#F59E0B' },
  closedBadge: { backgroundColor: '#10B981' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  
  detail: { marginBottom: 10 },
  detailLabel: { color: '#6B7280', fontSize: 10, fontWeight: '600', marginBottom: 2 },
  detailText: { color: '#E5E7EB', fontSize: 13 },
  
  cost: { color: '#F59E0B', fontWeight: '600', fontSize: 14, marginBottom: 6 },
  date: { color: '#9CA3AF', fontSize: 11 },
  mileage: { color: '#9CA3AF', fontSize: 11 },
  
  issues: { borderTopColor: '#374151', borderTopWidth: 1, marginTop: 10, paddingTop: 10 },
  issueText: { color: '#FCA5A5', fontSize: 12, marginLeft: 8 },
  issueIcon: { color: '#EF4444', marginRight: 4 },
  
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
  createBtn: { margin: 24, paddingVertical: 14, backgroundColor: '#F59E0B', borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: '#0B0F14', fontWeight: '700', fontSize: 16 },
});

function StatusBadge({ status }: { status?: string }) {
  const isOpen = status === 'open';
  return (
    <View style={[styles.statusBadge, isOpen ? styles.openBadge : styles.closedBadge]}>
      <Text style={styles.badgeText}>{isOpen ? 'OPEN' : 'CLOSED'}</Text>
    </View>
  );
}

export default function MaintenanceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'open'>('all');

  const { data: maintenance, isLoading: maintenanceLoading, error: maintenanceError } = useQuery({
    queryKey: ['maintenance', filter],
    queryFn: () => fetchMaintenance(),
  });

  const { data: ytdSummary } = useQuery({
    queryKey: ['maintenance-ytd'],
    queryFn: () => fetchMaintenanceYTD(),
  });

  const filteredRecords = maintenance?.filter((m: MaintenanceRecord) => 
    filter === 'open' ? m.status === 'open' : true
  ) ?? [];

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScrollView style={styles.header} scrollEnabled={false}>
          <Text style={styles.title}>{t('maintenance.title')}</Text>
          
          {ytdSummary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>{t('maintenance.ytdSpending')}</Text>
              
              <View style={styles.unitsRow}>
                {ytdSummary.units?.slice(0, 2).map((unit: any) => (
                  <View key={unit.unitId} style={styles.unitSummary}>
                    <Text style={styles.unitLabel}>{unit.unitId}</Text>
                    <Text style={styles.unitAmount}>{formatCurrency(unit.spent)}</Text>
                  </View>
                ))}
                {ytdSummary.units && ytdSummary.units.length > 2 && (
                  <View style={styles.unitSummary}>
                    <Text style={styles.unitLabel}>+{ytdSummary.units.length - 2} more</Text>
                    <Text style={styles.unitAmount}>-</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>{t('maintenance.total')}</Text>
                <Text style={styles.totalAmount}>{formatCurrency(ytdSummary.total)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, filter === 'all' && styles.tabOn]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.tabText, filter === 'all' && styles.tabOnText]}>
                {t('maintenance.allRecords')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, filter === 'open' && styles.tabOn]}
              onPress={() => setFilter('open')}
            >
              <Text style={[styles.tabText, filter === 'open' && styles.tabOnText]}>
                {t('maintenance.openIssues')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {maintenanceLoading ? (
          <Text style={styles.empty}>{t('common.loading')}</Text>
        ) : maintenanceError ? (
          <Text style={[styles.empty, { color: '#EF4444' }]}>{maintenanceError.message}</Text>
        ) : !filteredRecords.length ? (
          <Text style={styles.empty}>{t('maintenance.noRecords')}</Text>
        ) : (
          <FlatList
            data={filteredRecords}
            keyExtractor={(item: MaintenanceRecord) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: MaintenanceRecord }) => (
              <TouchableOpacity 
                style={styles.card} 
                activeOpacity={0.7}
                onPress={() => router.push(`/maintenance/${item.id}`)}
              >
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.serviceType?.replace(/_/g, ' ').toUpperCase()}</Text>
                    <Text style={styles.mileage}>Unit: {item.unitId}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text style={styles.cost}>{formatCurrency(item.cost)}</Text>
                
                <View style={styles.detail}>
                  <Text style={styles.detailLabel}>{t('maintenance.date')}</Text>
                  <Text style={styles.detailText}>
                    {new Date(item.serviceDate).toLocaleDateString()} · {item.mileageAtService?.toLocaleString()} mi
                  </Text>
                </View>

                {item.description && (
                  <View style={styles.detail}>
                    <Text style={styles.detailLabel}>{t('maintenance.notes')}</Text>
                    <Text style={styles.detailText} numberOfLines={2}>{item.description}</Text>
                  </View>
                )}

                {item.issuesFound && item.issuesFound.length > 0 && (
                  <View style={styles.issues}>
                    {item.issuesFound.map((issue: string, idx: number) => (
                      <Text key={idx} style={styles.issueText}>
                        <Text style={styles.issueIcon}>⚠️</Text> {issue}
                      </Text>
                    ))}
                  </View>
                )}

                {item.nextServiceMileage && (
                  <View style={[styles.detail, { marginTop: 10 }]}>
                    <Text style={styles.detailLabel}>{t('maintenance.nextDue')}</Text>
                    <Text style={styles.detailText}>{item.nextServiceMileage.toLocaleString()} miles</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}

        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/maintenance/create')}>
          <Text style={styles.createBtnText}>+ {t('maintenance.createRecord')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
