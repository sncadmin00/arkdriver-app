import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createMaintenance, fetchProfile } from '@/lib/api';
import { useState } from 'react';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  back: { fontSize: 24, color: '#F59E0B', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  
  content: { flex: 1, padding: 24 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 },
  input: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, color: '#FFFFFF', borderColor: '#374151', borderWidth: 1, marginBottom: 8 },
  picker: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, borderColor: '#374151', borderWidth: 1, marginBottom: 8 },
  pickerText: { color: '#E5E7EB', fontSize: 14 },
  
  button: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  primaryBtn: { backgroundColor: '#F59E0B' },
  btnText: { fontWeight: '700', fontSize: 16, color: '#0B0F14' },
  
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
});

const serviceTypes = [
  { label: 'Oil Change', value: 'oil_change' },
  { label: 'Tire Replacement', value: 'tire_replacement' },
  { label: 'Brake Service', value: 'brake_service' },
  { label: 'Engine Work', value: 'engine_work' },
  { label: 'Transmission Service', value: 'transmission_service' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Other', value: 'other' },
];

export default function MaintenanceCreateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [serviceType, setServiceType] = useState('oil_change');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [issues, setIssues] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => fetchProfile(),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => createMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-ytd'] });
      Alert.alert(t('common.success'), t('maintenance.recordCreated'));
      router.back();
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.message);
    },
  });

  const handleSubmit = () => {
    if (!cost || !mileage) {
      Alert.alert(t('common.error'), 'Cost and mileage are required');
      return;
    }

    createMut.mutate({
      unitId: profile?.truck?.unit || 'unknown',
      serviceType,
      cost: parseFloat(cost),
      mileageAtService: parseInt(mileage),
      description: description || undefined,
      issuesFound: issues ? issues.split(',').map(i => i.trim()) : undefined,
      nextServiceMileage: nextServiceMileage ? parseInt(nextServiceMileage) : undefined,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('maintenance.createRecord')}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>{t('maintenance.serviceType')}</Text>
            <View style={styles.picker}>
              {serviceTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  onPress={() => setServiceType(type.value)}
                  style={{ paddingVertical: 8 }}
                >
                  <Text style={[styles.pickerText, serviceType === type.value && { color: '#F59E0B', fontWeight: '700' }]}>
                    {serviceType === type.value ? '✓ ' : '  '}{type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('maintenance.cost')} *</Text>
            <TextInput
              style={styles.input}
              placeholder="150.00"
              placeholderTextColor="#6B7280"
              keyboardType="decimal-pad"
              value={cost}
              onChangeText={setCost}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('maintenance.mileage')} *</Text>
            <TextInput
              style={styles.input}
              placeholder="50000"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              value={mileage}
              onChangeText={setMileage}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('maintenance.description')}</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="What was done..."
              placeholderTextColor="#6B7280"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('maintenance.issuesFound')}</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Separate with commas: brake pads worn, exhaust loose"
              placeholderTextColor="#6B7280"
              multiline
              value={issues}
              onChangeText={setIssues}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>{t('maintenance.nextDue')}</Text>
            <TextInput
              style={styles.input}
              placeholder="55000"
              placeholderTextColor="#6B7280"
              keyboardType="number-pad"
              value={nextServiceMileage}
              onChangeText={setNextServiceMileage}
            />
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryBtn]} 
            onPress={handleSubmit}
            disabled={createMut.isPending}
          >
            <Text style={styles.btnText}>
              {createMut.isPending ? t('common.loading') : t('maintenance.createRecord')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
