import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';
import { PDFDocument } from 'pdf-lib';
import { uploadDocument, ApiError } from '@/lib/api';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { id, stopIndex, docKey, kind } = useLocalSearchParams<{
    id: string; stopIndex: string; docKey: string; kind: string;
  }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  // A multi-page scan is filed as one PDF, not one document per sheet.
  const [pdf, setPdf] = useState<{ base64: string; pageCount: number } | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [notes, setNotes] = useState('');

  const label = String(docKey ?? 'doc').toUpperCase();

  async function capture(fromLibrary: boolean) {
    if (!fromLibrary) {
      try {
        // BOLs and PODs routinely run several pages. Scan them all, then bind
        // them into a single PDF so the office gets one document, not a pile.
        const { scannedImages } = await DocumentScanner.scanDocument({
          responseType: ResponseType.Base64,
          croppedImageQuality: 40,
        });
        if (!scannedImages?.length) return;

        const doc = await PDFDocument.create();
        for (const b64 of scannedImages) {
          const img = await doc.embedJpg(`data:image/jpeg;base64,${b64}`);
          const page = doc.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
        const base64 = await doc.saveAsBase64();

        setPdf({ base64, pageCount: scannedImages.length });
        setPhoto({ uri: `data:image/jpeg;base64,${scannedImages[0]}`, base64: scannedImages[0] });
      } catch (e: any) {
        Alert.alert(t('alerts.scanner'), String(e?.message ?? e));
      }
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('uploadDoc.permTitle'), t('uploadDoc.permBody'));
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.4,
      base64: true,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    setPdf(null);
    setPhoto({ uri: res.assets[0].uri, base64: res.assets[0].base64! });
  }

  const upload = useMutation({
    mutationFn: () =>
      uploadDocument(id!, {
        docKey: String(docKey),
        fileName: `${docKey}-${id}-${stopIndex}.${pdf ? 'pdf' : 'jpg'}`,
        mimeType: pdf ? 'application/pdf' : 'image/jpeg',
        contentBase64: pdf ? pdf.base64 : photo!.base64,
        signatureName: signatureName.trim() || undefined,
        notes: notes.trim() || undefined,
        stopIndex: Number(stopIndex),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['load', id] });
      qc.invalidateQueries({ queryKey: ['loads'] });
      Alert.alert(t('uploadDoc.doneTitle'), t('uploadDoc.doneBody', { label, stop: Number(stopIndex) + 1 }) + (pdf && pdf.pageCount > 1 ? t('uploadDoc.pages', { count: pdf.pageCount }) : ''), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (e: Error) => {
      const code = e instanceof ApiError ? e.code : undefined;
      Alert.alert(code ? code.replace('_', ' ') : t('alerts.upload'), e.message);
    },
  });

  const sizeKb = photo ? Math.round(((pdf ? pdf.base64 : photo.base64).length * 3) / 4 / 1024) : 0;
  const ready = !!photo && !upload.isPending;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>{t('uploadDoc.back')}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t('uploadDoc.title', { label })}</Text>
          <Text style={s.sub}>{t('uploadDoc.sub', { id, stop: Number(stopIndex) + 1, kind: kind === 'pickup' ? t('home.pickupShort') : t('home.deliveryShort') })}</Text>
        </View>

        <View style={s.body}>
          <Text style={s.section}>{t('uploadDoc.photo')}</Text>
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={s.preview} resizeMode="contain" />
              <Text style={s.size}>{sizeKb} KB</Text>
              <TouchableOpacity onPress={() => capture(false)}>
                <Text style={s.retake}>{t('uploadDoc.retake')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={s.pick} onPress={() => capture(false)}>
                <Text style={s.pickText}>{t('uploadDoc.takePhoto')}</Text>
                <Text style={s.pickHint}>{t('uploadDoc.captureHint', { label })}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => capture(true)}>
                <Text style={s.retake}>{t('uploadDoc.library')}</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={s.section}>{t('uploadDoc.signedBy')}</Text>
          <TextInput
            style={s.input}
            placeholder={t('uploadDoc.signedByPh')}
            placeholderTextColor="#6B7280"
            value={signatureName}
            onChangeText={setSignatureName}
          />
          <Text style={s.hint}>{t('uploadDoc.signedByHint')}</Text>

          <Text style={s.section}>{t('uploadDoc.notes')}</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder={t('uploadDoc.notesPh')}
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
                {photo ? t('uploadDoc.title', { label }) : t('uploadDoc.photoFirst')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
