import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { uploadDocument, ApiError } from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 16 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  sub: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  body: { padding: 20, paddingBottom: 60 },
  section: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.6, marginTop: 8 },
  pick: { backgroundColor: '#1F2937', borderRadius: 12, borderColor: '#374151', borderWidth: 1, borderStyle: 'dashed', paddingVertical: 30, alignItems: 'center' },
  pickText: { color: '#F59E0B', fontWeight: '600', fontSize: 15 },
  pickHint: { color: '#6B7280', fontSize: 12, marginTop: 6 },
  preview: { width: '100%', height: 260, borderRadius: 12, backgroundColor: '#1F2937' },
  retake: { color: '#F59E0B', fontSize: 13, textAlign: 'center', marginTop: 10, fontWeight: '600' },
  input: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1, borderRadius: 8, padding: 13, color: '#FFFFFF', fontSize: 15 },
  hint: { color: '#6B7280', fontSize: 11, marginTop: 6 },
  btn: { backgroundColor: '#F59E0B', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 26 },
  btnOff: { backgroundColor: '#374151' },
  btnText: { color: '#0B0F14', fontWeight: '700', fontSize: 15 },
  btnOffText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  size: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 8 },
});

export default function UploadDoc() {
  const { id, stopIndex, docKey, kind } = useLocalSearchParams<{
    id: string; stopIndex: string; docKey: string; kind: string;
  }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [notes, setNotes] = useState('');

  const label = String(docKey ?? 'doc').toUpperCase();

  async function capture(fromLibrary: boolean) {
    const perm = fromLibrary
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to continue.');
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.4,
      base64: true,
      allowsEditing: false,
    };
    const res = fromLibrary
      ? await ImagePicker.launchImageLibraryAsync(opts)
      : await ImagePicker.launchCameraAsync(opts);

    if (res.canceled || !res.assets?.[0]?.base64) return;
    setPhoto({ uri: res.assets[0].uri, base64: res.assets[0].base64! });
  }

  const upload = useMutation({
    mutationFn: () =>
      uploadDocument(id!, {
        docKey: String(docKey),
        fileName: `${docKey}-${id}-${stopIndex}.jpg`,
        mimeType: 'image/jpeg',
        contentBase64: photo!.base64,
        signatureName: signatureName.trim() || undefined,
        notes: notes.trim() || undefined,
        stopIndex: Number(stopIndex),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['load', id] });
      qc.invalidateQueries({ queryKey: ['loads'] });
      Alert.alert('Uploaded', `${label} filed to stop ${Number(stopIndex) + 1}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e: Error) => {
      const code = e instanceof ApiError ? e.code : undefined;
      Alert.alert(code ? code.replace('_', ' ') : 'Upload failed', e.message);
    },
  });

  const sizeKb = photo ? Math.round((photo.base64.length * 3) / 4 / 1024) : 0;
  const ready = !!photo && !upload.isPending;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>Upload {label}</Text>
          <Text style={s.sub}>{id} · stop {Number(stopIndex) + 1} · {kind}</Text>
        </View>

        <View style={s.body}>
          <Text style={s.section}>PHOTO</Text>
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={s.preview} resizeMode="contain" />
              <Text style={s.size}>{sizeKb} KB</Text>
              <TouchableOpacity onPress={() => capture(false)}>
                <Text style={s.retake}>Retake</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={s.pick} onPress={() => capture(false)}>
                <Text style={s.pickText}>Take photo</Text>
                <Text style={s.pickHint}>Capture the signed {label}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => capture(true)}>
                <Text style={s.retake}>Choose from library</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={s.section}>SIGNED BY</Text>
          <TextInput
            style={s.input}
            placeholder="Name of person who signed"
            placeholderTextColor="#6B7280"
            value={signatureName}
            onChangeText={setSignatureName}
          />
          <Text style={s.hint}>Optional — receiver or shipper name</Text>

          <Text style={s.section}>NOTES</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="e.g. Receiver signed at dock 4"
            placeholderTextColor="#6B7280"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            style={[s.btn, !ready && s.btnOff]}
            disabled={!ready}
            onPress={() => upload.mutate()}
          >
            {upload.isPending ? (
              <ActivityIndicator color="#0B0F14" />
            ) : (
              <Text style={ready ? s.btnText : s.btnOffText}>
                {photo ? `Upload ${label}` : 'Take a photo first'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
