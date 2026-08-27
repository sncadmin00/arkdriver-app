import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F14', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 8 },
});

export default function ComplianceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compliance & Documents</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
    </View>
  );
}
