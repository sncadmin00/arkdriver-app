import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '@/lib/api';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  content: { padding: 24 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 20, marginBottom: 16, borderColor: '#374151', borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 },
  cardValue: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  button: { backgroundColor: '#F59E0B', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#0B0F14', fontSize: 14, fontWeight: '600' },
});

export default function HomeScreen() {
  const router = useRouter();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.header}>
        <Text style={styles.title}>{profile?.name ? `Welcome, ${profile.name}` : 'Welcome'}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Truck</Text>
          <Text style={styles.cardValue}>{profile?.assigned_truck_id || 'TBD'}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Loads</Text>
          <Text style={styles.cardValue}>0</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/loads')}>
            <Text style={styles.buttonText}>View Loads</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
