import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchStatements, fetchYTDIncome } from '@/lib/api';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  
  summaryContainer: { backgroundColor: '#111827', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryBox: { flex: 1, backgroundColor: '#1F2937', borderRadius: 8, padding: 12, marginRight: 8 },
  summaryLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  summaryValue: { color: '#10B981', fontSize: 16, fontWeight: '700' },
  
  content: { flex: 1, padding: 24 },
  statement: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 12, borderColor: '#374151', borderWidth: 1 },
  statementWeek: { color: '#F59E0B', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  statementValue: { color: '#E5E7EB', fontSize: 13, marginBottom: 4 },
  
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
});

export default function IncomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: statements, isLoading } = useQuery({
    queryKey: ['statements'],
    queryFn: () => fetchStatements(),
  });

  const { data: ytdData } = useQuery({
    queryKey: ['ytd-income'],
    queryFn: () => fetchYTDIncome(),
  });

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScrollView style={styles.header} scrollEnabled={false}>
          <Text style={styles.title}>{t('tabs.income')}</Text>
          
          {ytdData && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Gross YTD</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(ytdData.gross)}</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Net YTD</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(ytdData.net)}</Text>
                </View>
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Deductions</Text>
                <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '700' }}>-{formatCurrency(ytdData.deductions)}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {!statements || statements.length === 0 ? (
            <Text style={styles.empty}>No statements yet</Text>
          ) : (
            statements.map((s: any) => (
              <TouchableOpacity key={s.week} style={styles.statement} onPress={() => router.push(`/income/${s.week}`)}>
                <Text style={styles.statementWeek}>{s.week}</Text>
                <Text style={styles.statementValue}>Gross: {formatCurrency(s.gross)}</Text>
                <Text style={styles.statementValue}>Net: {formatCurrency(s.net)}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
