import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchProfile, fetchLoads } from '@/lib/api';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  content: { padding: 24 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 20, marginBottom: 16, borderColor: '#374151', borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  button: { backgroundColor: '#F59E0B', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#0B0F14', fontSize: 14, fontWeight: '600' },
  error: { color: '#EF4444', fontSize: 12 },
});

export default function HomeScreen() {
  const router = useRouter();
  const { data: profile, error, isLoading } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: loads } = useQuery({ queryKey: ['loads'], queryFn: fetchLoads });


  const driver = profile?.driver;
  const truck = profile?.truck;
  const activeCount = Array.isArray(loads) ? loads.length : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} bounces={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{driver?.driverName ?? (isLoading ? 'Loading…' : 'Welcome')}</Text>
          {driver?.status && <Text style={styles.subtitle}>Status: {driver.status}</Text>}
        </View>
        <View style={styles.content}>
          {error && <Text style={styles.error}>{error.message}</Text>}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Assigned Truck</Text>
            <Text style={styles.cardValue}>{truck?.unit ? `Unit ${truck.unit}` : '—'}</Text>
            {truck?.vin && <Text style={styles.cardMeta}>VIN {truck.vin}</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active Loads</Text>
            <Text style={styles.cardValue}>{activeCount}</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/loads')}>
              <Text style={styles.buttonText}>View Loads</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
