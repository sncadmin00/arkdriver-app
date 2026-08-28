import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { submitIncident, fetchIncidents } from '@/lib/api';
import { enqueue, flush, pendingCount } from '@/lib/incidentQueue';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 14 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  body: { padding: 20, paddingBottom: 50 },
  pick: { backgroundColor: '#1F2937', borderRadius: 12, padding: 18, marginBottom: 12, borderColor: '#374151', borderWidth: 1 },
  pickAccident: { borderColor: '#EF4444' },
  pickTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  pickSub: { color: '#9CA3AF', fontSize: 13, marginTop: 4, lineHeight: 18 },
  urgent: { color: '#EF4444', fontSize: 12, marginBottom: 16, lineHeight: 18 },
  label: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: { width: 78, height: 78, borderRadius: 8 },
  add: { width: 78, height: 78, borderRadius: 8, borderColor: '#F59E0B', borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#F59E0B', fontSize: 26 },
  input: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1, borderRadius: 8, padding: 13, color: '#FFFFFF', fontSize: 15, minHeight: 90, textAlignVertical: 'top' },
  hint: { color: '#6B7280', fontSize: 12, marginTop: 8, lineHeight: 17 },
  geo: { color: '#6B7280', fontSize: 12, marginTop: 14 },
  submit: { backgroundColor: '#F59E0B', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#0B0F14', fontWeight: '700', fontSize: 16 },
  banner: { backgroundColor: '#EAB30815', borderColor: '#EAB308', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  bannerText: { color: '#EAB308', fontSize: 12 },
  card: { backgroundColor: '#1F2937', borderRadius: 10, padding: 14, marginBottom: 10, borderColor: '#374151', borderWidth: 1 },
  ref: { color: '#F59E0B', fontSize: 14, fontWeight: '700' },
  meta: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  note: { color: '#E5E7EB', fontSize: 13, marginTop: 8, lineHeight: 18 },
  status: { color: '#10B981', fontSize: 11, marginTop: 8 },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
  tabs: { flexDirection: 'row', marginTop: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  tabOn: { backgroundColor: '#F59E0B' },
  tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  tabOnText: { color: '#0B0F14' },
});

const KINDS = [
  { key: 'accident', urgent: true },
  { key: 'dot_inspection', i18n: 'dot' },
  { key: 'citation' },
];

function Form({ kind, onDone }) {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [note, setNote] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(true);
  const [busy, setBusy] = useState(false);

  const label = kind === 'dot_inspection' ? 'dot' : kind;

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return setLocating(false);
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch {}
      setLocating(false);
    })();
  }, []);

  async function addPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    const a = res.assets[0];
    if (photos.length >= 12) return;
    setPhotos((p) => [...p, {
      uri: a.uri,
      fileName: `${kind}-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      contentBase64: a.base64,
      capturedAt: new Date().toISOString(),
    }]);
  }

  async function send() {
    if (!photos.length) return Alert.alert(t('incident.photoRequired'));
    setBusy(true);

    const payload = {
      kind,
      note: note.trim() || undefined,
      clientKey: `incident-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      clientReportedAt: new Date().toISOString(),
      ...(coords ?? {}),
      photos: photos.map(({ fileName, mimeType, contentBase64, capturedAt }) => ({
        fileName, mimeType, contentBase64, capturedAt,
      })),
    };

    try {
      const res = await submitIncident(payload);
      const ref = res?.report?.reference ?? '';
      Alert.alert(t('incident.sent'), t('incident.sentBody', { ref }), [
        { text: t('common.done'), onPress: onDone },
      ]);
    } catch {
      await enqueue(payload);
      Alert.alert(t('incident.queued'), t('incident.queuedBody'), [
        { text: t('common.done'), onPress: onDone },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View>
      {kind === 'accident' ? <Text style={s.urgent}>{t('incident.urgentNote')}</Text> : null}

      <Text style={s.label}>{t('incident.photos')}</Text>
      <View style={s.photoRow}>
        {photos.map((p, i) => (
          <Image key={i} source={{ uri: p.uri }} style={s.thumb} />
        ))}
        {photos.length < 12 ? (
          <TouchableOpacity style={s.add} onPress={addPhoto}>
            <Text style={s.addText}>+</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={s.label}>{t('incident.note')}</Text>
      <TextInput
        style={s.input}
        multiline
        placeholder={t('incident.notePlaceholder')}
        placeholderTextColor="#6B7280"
        value={note}
        onChangeText={setNote}
      />
      <Text style={s.hint}>{t('incident.noteHint')}</Text>

      <Text style={s.geo}>
        {locating ? t('incident.locating') : coords ? `📍 ${t('incident.location')}` : t('incident.noLocation')}
      </Text>

      <TouchableOpacity style={s.submit} onPress={send} disabled={busy}>
        {busy ? <ActivityIndicator color="#0B0F14" /> : <Text style={s.submitText}>{t('incident.submit')}</Text>}
      </TouchableOpacity>
    </View>
  );
}

function History() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['incidents'], queryFn: () => fetchIncidents(20) });
  const rows = data?.reports ?? data?.incidents ?? [];

  if (isLoading) return <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />;
  if (!rows.length) return <Text style={s.empty}>{t('incident.noHistory')}</Text>;

  return (
    <View>
      {rows.map((r) => (
        <View key={r.id} style={s.card}>
          <Text style={s.ref}>{r.reference}</Text>
          <Text style={s.meta}>
            {t(`incident.${r.kind === 'dot_inspection' ? 'dot' : r.kind}`)}
            {' · '}{new Date(r.submittedAt).toLocaleString()}
          </Text>
          {r.locationLabel ? <Text style={s.meta}>{r.locationLabel}</Text> : null}
          {r.note ? <Text style={s.note}>{r.note}</Text> : null}
          {r.photoCount ? <Text style={s.meta}>{t('inspection.photos', { count: r.photoCount })}</Text> : null}
          {r.notifiedAt ? (
            <Text style={s.status}>
              ✓ {t('inspection.notifiedAt', { time: new Date(r.notifiedAt).toLocaleTimeString() })}
            </Text>
          ) : null}
          <Text style={s.meta}>
            {r.status === 'unconfirmed' ? t('incident.unconfirmed') : t('incident.reviewed')}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { kind: initial } = useLocalSearchParams();

  const [kind, setKind] = useState(typeof initial === 'string' ? initial : null);
  const [tab, setTab] = useState('new');
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    (async () => {
      const { sent } = await flush();
      if (sent) qc.invalidateQueries({ queryKey: ['incidents'] });
      setWaiting(await pendingCount());
    })();
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (kind ? setKind(null) : router.back())}>
          <Text style={s.back}>← {kind ? t('incident.title') : t('more.title')}</Text>
        </TouchableOpacity>
        <Text style={s.title}>
          {kind ? t(`incident.${kind === 'dot_inspection' ? 'dot' : kind}`) : t('incident.title')}
        </Text>
        {!kind ? (
          <View style={s.tabs}>
            <TouchableOpacity style={[s.tab, tab === 'new' && s.tabOn]} onPress={() => setTab('new')}>
              <Text style={[s.tabText, tab === 'new' && s.tabOnText]}>{t('incident.title')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, tab === 'history' && s.tabOn]} onPress={() => setTab('history')}>
              <Text style={[s.tabText, tab === 'history' && s.tabOnText]}>{t('incident.history')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {waiting > 0 ? (
          <View style={s.banner}>
            <Text style={s.bannerText}>{t('incident.pending', { count: waiting })}</Text>
          </View>
        ) : null}

        {kind ? (
          <Form kind={kind} onDone={() => { setKind(null); setTab('history'); qc.invalidateQueries({ queryKey: ['incidents'] }); }} />
        ) : tab === 'history' ? (
          <History />
        ) : (
          KINDS.map((k) => (
            <TouchableOpacity
              key={k.key}
              style={[s.pick, k.urgent && s.pickAccident]}
              onPress={() => setKind(k.key)}
            >
              <Text style={s.pickTitle}>{t(`incident.${k.i18n ?? k.key}`)}</Text>
              <Text style={s.pickSub}>{t(`incident.${k.i18n ?? k.key}Sub`)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
