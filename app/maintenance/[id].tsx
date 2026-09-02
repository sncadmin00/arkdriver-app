import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMaintenanceDetail, updateMaintenance } from '@/lib/api';
import type { MaintenanceRecord } from '@/types';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  back: { fontSize: 24, color: '#F59E0B' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', flex: 1, marginLeft: 12 },
  
  content: { flex: 1, padding: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#F59E0B', marginBottom: 12 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomColor: '#374151', borderBottomWidth: 1 },
  label: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  value: { fontSize: 14, color: '#E5E7EB', fontWeight: '500' },
  valueHighlight: { color: '#F59E0B', fontWeight: '700', fontSize: 16 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  openBadge: { backgroundColor: '#F59E0B' },
  closedBadge: { backgroundColor: '#10B981' },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  
  descriptionBox: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, marginBottom: 12 },
  descriptionText: { color: '#E5E7EB', fontSize: 13, lineHeight: 18 },
  
  issueList: { marginBottom: 12 },
  issueItem: { backgroundColor: '#2D1F16', borderLeftColor: '#EF4444', borderLeftWidth: 3, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6, borderRadius: 4 },
  issueText: { color: '#FECACA', fontSize: 13 },
  
  invoicesSection: { marginBottom: 12 },
  invoiceCard: { backgroundColor: '#1F2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceIcon: { fontSize: 16, marginRight: 8 },
  invoiceName: { flex: 1, color: '#E5E7EB', fontSize: 12 },
  downloadIcon: { fontSize: 14, color: '#F59E0B' },
  
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primaryBtn: { backgroundColor: '#F59E0B' },
  secondaryBtn: { backgroundColor: '#374151' },
  btnText: { fontWeight: '700', fontSize: 14 },
  primaryBtnText: { color: '#0B0F14' },
  secondaryBtnText: { color: '#E5E7EB' },
  
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#1F2937', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 20, paddingBottom: 30, paddingHorizontal: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  option: { paddingVertical: 14, borderBottomColor: '#374151', borderBottomWidth: 1 },
  optionText: { fontSize: 15, color: '#E5E7EB' },
  cancelOption: { paddingVertical: 14, marginTop: 8, alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#9CA3AF', fontWeight: '600' },
});

export default function MaintenanceDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data: record, isLoading, error } = useQuery({
    queryKey: ['maintenance-detail', id],
    queryFn: () => fetchMaintenanceDetail(id!),
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: (data: any) => updateMaintenance(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-ytd'] });
      setShowStatusModal(false);
      Alert.alert(t('common.success'), t('maintenance.recordUpdated'));
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const toggleStatus = (newStatus: 'open' | 'closed') => {
    updateMut.mutate({ status: newStatus });
  };

  if (isLoading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={[styles.title, { textAlign: 'center', marginTop: 40 }]}>{t('common.loading')}</Text>
      </View>
    </SafeAreaView>
  );

  if (error || !record) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={[styles.title, { textAlign: 'center', marginTop: 40, color: '#EF4444' }]}>
          {error?.message || t('common.error')}
        </Text>
      </View>
    </SafeAreaView>
  );

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← {t('common.back')}</Text>
            </TouchableOpacity>
            <View style={[styles.statusBadge, record.status === 'open' ? styles.openBadge : styles.closedBadge]}>
              <Text style={styles.badgeText}>{record.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.title}>{record.serviceType?.replace(/_/g, ' ')}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>{t('maintenance.cost')}</Text>
              <Text style={styles.valueHighlight}>{formatCurrency(record.cost)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('maintenance.unit')}</Text>
              <Text style={styles.value}>{record.unitId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('maintenance.date')}</Text>
              <Text style={styles.value}>{new Date(record.serviceDate).toLocaleDateString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('maintenance.mileage')}</Text>
              <Text style={styles.value}>{record.mileageAtService?.toLocaleString()} mi</Text>
            </View>
          </View>

          {record.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('maintenance.description')}</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{record.description}</Text>
              </View>
            </View>
          )}

          {record.issuesFound && record.issuesFound.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('maintenance.issuesFound')}</Text>
              <View style={styles.issueList}>
                {record.issuesFound.map((issue: string, idx: number) => (
                  <View key={idx} style={styles.issueItem}>
                    <Text style={styles.issueText}>• {issue}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {record.invoiceUrl && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('maintenance.invoices')}</Text>
              <View style={styles.invoicesSection}>
                <View style={styles.invoiceCard}>
                  <Text style={styles.invoiceIcon}>📄</Text>
                  <Text style={styles.invoiceName}>Invoice</Text>
                  <TouchableOpacity>
                    <Text style={styles.downloadIcon}>⬇️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {record.nextServiceMileage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('maintenance.nextDue')}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Next service at</Text>
                <Text style={styles.value}>{record.nextServiceMileage.toLocaleString()} miles</Text>
              </View>
            </View>
          )}

          {record.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>{record.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryBtn]}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={[styles.btnText, styles.primaryBtnText]}>
              {record.status === 'open' ? t('maintenance.closeRecord') : t('maintenance.openIssue')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryBtn]}
            onPress={() => router.back()}
          >
            <Text style={[styles.btnText, styles.secondaryBtnText]}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {record.status === 'open' ? t('maintenance.closeRecord') : t('maintenance.openIssue')}?
            </Text>
            <TouchableOpacity
              style={styles.option}
              onPress={() => toggleStatus(record.status === 'open' ? 'closed' : 'open')}
              disabled={updateMut.isPending}
            >
              <Text style={styles.optionText}>
                {updateMut.isPending ? t('common.loading') : 'Yes, confirm'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, { borderBottomWidth: 0 }]}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.optionText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelOption}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelText}>{t('common.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
