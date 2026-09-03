import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchMaintenance, fetchMaintenanceYTD } from '@/lib/api';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  summaryContainer: { backgroundColor: '#111827', borderRadius: 12, padding: 16, marginBottom: 16 },
  summaryTitle: { fontSize: 14, color: '#9CA3AF', fontWeight: '600', marginBottom: 12 },
  totalBox: { backgroundColor: '#374151', borderRadius: 8, padding: 12 },
  totalLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  totalAmount: { color: '#10B981', fontSize: 18, fontWeight: '700' },
  
  categoriesContainer: { paddingHorizontal: 24, marginBottom: 12 },
  categories: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryBtn: { width: '30%', marginRight: '5%', marginBottom: 12, paddingVertical: 12, backgroundColor: '#1F2937', borderRadius: 8, alignItems: 'center', borderColor: '#374151', borderWidth: 1 },
  categoryBtnActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  categoryIcon: { fontSize: 20, marginBottom: 4 },
  categoryText: { color: '#E5E7EB', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#0B0F14' },
  
  content: { flex: 1, padding: 24 },
  addBtn: { paddingVertical: 14, backgroundColor: '#F59E0B', borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  addBtnText: { color: '#0B0F14', fontWeight: '700', fontSize: 16 },
  
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
});

const categories = [
  { id: 'repair', label: 'Repair', icon: '🔧' },
  { id: 'food', label: 'Food', icon: '🍔' },
  { id: 'parking', label: 'Parking', icon: '🅿️' },
  { id: 'fuel', label: 'Fuel', icon: '⛽' },
  { id: 'other', label: 'Other', icon: '📌' },
];

export default function ExpensesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('repair');

  const { data: ytdSummary } = useQuery({
    queryKey: ['expenses-ytd'],
    queryFn: async () => {
      // TODO: replace with actual expenses API
      return { total: 0, breakdown: {} };
    },
  });

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <ScrollView style={styles.header} scrollEnabled={false}>
          <Text style={styles.title}>{t('tabs.expenses')}</Text>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>YTD Expenses</Text>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(ytdSummary?.total)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.categoriesContainer}>
          <View style={styles.categories}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push(`/expenses/${selectedCategory}/add`)}>
            <Text style={styles.addBtnText}>+ Add {categories.find(c => c.id === selectedCategory)?.label}</Text>
          </TouchableOpacity>
          
          <Text style={styles.empty}>No expenses yet</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
