import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from '@/lib/supabase';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14', padding: 24 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 24, marginTop: 12 },
  button: { backgroundColor: '#1F2937', borderRadius: 8, padding: 16, marginBottom: 12, borderColor: '#374151', borderWidth: 1 },
  buttonText: { color: '#E5E7EB', fontSize: 16 },
  logoutButton: { backgroundColor: '#EF4444', borderRadius: 8, padding: 16, marginTop: 24 },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});

export default function MoreScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>More</Text>
      <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Settings</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Profile</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Announcements</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Accounting</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.button]}><Text style={[styles.buttonText, { color: '#F59E0B' }]}>Emergency SOS</Text></TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
    </View>
  );
}
