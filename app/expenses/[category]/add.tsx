import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  back: { fontSize: 24, color: '#F59E0B', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  content: { flex: 1, padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#E5E7EB', marginBottom: 8 },
  input: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, color: '#FFFFFF', borderColor: '#374151', borderWidth: 1, marginBottom: 16 },
  docSection: { marginBottom: 20 },
  docButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  docBtn: { flex: 1, minWidth: '45%', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#374151', borderRadius: 8, alignItems: 'center' },
  docBtnText: { color: '#E5E7EB', fontSize: 12, fontWeight: '600' },
  docPreview: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, marginTop: 12, borderColor: '#374151', borderWidth: 1 },
  docName: { color: '#F59E0B', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  docSize: { color: '#9CA3AF', fontSize: 11 },
  removeBtn: { marginTop: 8, paddingVertical: 6, backgroundColor: '#EF4444', borderRadius: 6, alignItems: 'center' },
  removeBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  photo: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
  button: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  primaryBtn: { backgroundColor: '#F59E0B' },
  btnText: { fontWeight: '700', fontSize: 16, color: '#0B0F14' },
});

export default function AddExpenseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { category } = useLocalSearchParams<{ category: string }>();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [document, setDocument] = useState<{ name: string; uri: string; size: number } | null>(null);

  const handleScanDocument = async () => {
    // Используем камеру в режиме "документа"
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [8.5, 11], // A4 документ
      quality: 0.9,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (result.type === 'success') {
        const sizeInMB = (result.size || 0) / 1024 / 1024;
        setDocument({
          name: result.name,
          uri: result.uri,
          size: result.size || 0,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = () => {
    if (!amount) {
      Alert.alert('Error', 'Amount is required');
      return;
    }
    if (!photo && !document) {
      Alert.alert('Warning', 'No receipt/document attached');
    }
    Alert.alert('Success', `${category} expense added: $${amount}`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add {category?.toUpperCase()}</Text>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.label}>Amount *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#6B7280"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="What was this for?"
            placeholderTextColor="#6B7280"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.docSection}>
            <Text style={styles.label}>Receipt / Document</Text>
            <View style={styles.docButtons}>
              <TouchableOpacity style={styles.docBtn} onPress={handleScanDocument}>
                <Text style={styles.docBtnText}>📷 Scan Doc</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.docBtn} onPress={handlePickPhoto}>
                <Text style={styles.docBtnText}>🖼️ Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.docBtn} onPress={handlePickDocument}>
                <Text style={styles.docBtnText}>📄 File</Text>
              </TouchableOpacity>
            </View>

            {photo && (
              <>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => setPhoto(null)}>
                  <Text style={styles.removeBtnText}>Remove Photo</Text>
                </TouchableOpacity>
              </>
            )}

            {document && (
              <>
                <View style={styles.docPreview}>
                  <Text style={styles.docName}>📎 {document.name}</Text>
                  <Text style={styles.docSize}>{(document.size / 1024).toFixed(1)} KB</Text>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => setDocument(null)}>
                  <Text style={styles.removeBtnText}>Remove Document</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <TouchableOpacity style={[styles.button, styles.primaryBtn]} onPress={handleSubmit}>
            <Text style={styles.btnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
