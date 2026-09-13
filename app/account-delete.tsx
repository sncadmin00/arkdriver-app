import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDeletionRequest, requestAccountDeletion } from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  back: { color: '#F59E0B', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  body: { padding: 20 },
  para: { color: '#E5E7EB', fontSize: 14, lineHeight: 21, marginBottom: 14 },
  keep: { backgroundColor: '#1F2937', borderRadius: 10, padding: 14, borderColor: '#374151', borderWidth: 1, marginBottom: 18 },
  keepTitle: { color: '#F59E0B', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  keepItem: { color: '#9CA3AF', fontSize: 13, lineHeight: 20 },
  label: { color: '#9CA3AF', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, color: '#FFFFFF', borderColor: '#374151', borderWidth: 1, height: 90, textAlignVertical: 'top', marginBottom: 20 },
  danger: { backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  dangerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  pending: { backgroundColor: '#EAB30818', borderColor: '#EAB308', borderWidth: 1, borderRadius: 10, padding: 16 },
  pendingTitle: { color: '#EAB308', fontWeight: '700', fontSize: 15, marginBottom: 8 },
  pendingText: { color: '#E5E7EB', fontSize: 13, lineHeight: 20 },
});

export default function AccountDeleteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const existing = useQuery({
    queryKey: ['deletion-request'],
    queryFn: fetchDeletionRequest,
  });

  const submit = useMutation({
    mutationFn: () => requestAccountDeletion(reason.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deletion-request'] });
    },
    onError: (e: any) => Alert.alert(t('common.error'), e?.message ?? ''),
  });

  const confirm = () => {
    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('deleteAccount.confirmAction'), style: 'destructive', onPress: () => submit.mutate() },
    ]);
  };

  const pending = existing.data?.request;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t('deleteAccount.title')}</Text>
        </View>

        <ScrollView style={s.body}>
          {pending ? (
            <View style={s.pending}>
              <Text style={s.pendingTitle}>{t('deleteAccount.pendingTitle')}</Text>
              <Text style={s.pendingText}>
                {t('deleteAccount.pendingBody', {
                  date: new Date(pending.requestedAt).toLocaleDateString(),
                })}
              </Text>
            </View>
          ) : (
            <>
              <Text style={s.para}>{t('deleteAccount.intro')}</Text>

              <View style={s.keep}>
                <Text style={s.keepTitle}>{t('deleteAccount.keptTitle')}</Text>
                <Text style={s.keepItem}>• {t('deleteAccount.keptInspections')}</Text>
                <Text style={s.keepItem}>• {t('deleteAccount.keptDocs')}</Text>
                <Text style={s.keepItem}>• {t('deleteAccount.keptPay')}</Text>
              </View>

              <Text style={s.label}>{t('deleteAccount.reasonLabel')}</Text>
              <TextInput
                style={s.input}
                placeholder={t('deleteAccount.reasonHint')}
                placeholderTextColor="#6B7280"
                multiline
                maxLength={1000}
                value={reason}
                onChangeText={setReason}
              />

              <TouchableOpacity style={s.danger} onPress={confirm} disabled={submit.isPending}>
                <Text style={s.dangerText}>
                  {submit.isPending ? t('common.loading') : t('deleteAccount.action')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
