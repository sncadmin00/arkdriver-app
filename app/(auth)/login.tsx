import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from '@/lib/supabase';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14', paddingHorizontal: 24, justifyContent: 'center' },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 48, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 12, marginBottom: 16, color: '#FFFFFF', backgroundColor: '#1F2937' },
  button: { backgroundColor: '#F59E0B', borderRadius: 8, padding: 14, alignItems: 'center' },
  buttonText: { color: '#0B0F14', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#EF4444', marginTop: 8 },
});

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>ARK Driver</Text>
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#6B7280" value={email} onChangeText={setEmail} keyboardType="email-address" editable={!loading} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#6B7280" value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#0B0F14" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  );
}
