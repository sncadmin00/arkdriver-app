import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { fetchInspectionTemplate, submitInspection, fetchInspections } from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 12 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  tabs: { flexDirection: 'row', marginTop: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  tabOn: { backgroundColor: '#F59E0B' },
  tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  tabOnText: { color: '#0B0F14' },
  body: { padding: 20, paddingBottom: 50 },
  why: { color: '#6B7280', fontSize: 12, lineHeight: 18, marginBottom: 18 },
  label: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1, borderRadius: 8, padding: 13, color: '#FFFFFF', fontSize: 16 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  item: { backgroundColor: '#1F2937', borderRadius: 10, padding: 14, marginBottom: 10, borderColor: '#374151', borderWidth: 1 },
  itemBad: { borderColor: '#EF4444' },
  itemTop: { flexDirection: 'row', alignItems: 'center' },
  itemLabel: { color: '#E5E7EB', fontSize: 14, flex: 1, paddingRight: 10, lineHeight: 19 },
  rule: { color: '#4B5563', fontSize: 10, marginTop: 3 },
  toggle: { flexDirection: 'row', backgroundColor: '#0B0F14', borderRadius: 8, padding: 3 },
  tg: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
  tgOk: { backgroundColor: '#10B981' },
  tgBad: { backgroundColor: '#EF4444' },
  tgText: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  tgTextOn: { color: '#FFFFFF' },
  noteInput: { backgroundColor: '#0B0F14', borderColor: '#374151', borderWidth: 1, borderRadius: 8, padding: 11, color: '#FFFFFF', fontSize: 14, marginTop: 12, minHeight: 60, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  thumb: { width: 60, height: 60, borderRadius: 6 },
  addPhoto: { width: 60, height: 60, borderRadius: 6, borderColor: '#F59E0B', borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { color: '#F59E0B', fontSize: 22 },
  submit: { backgroundColor: '#F59E0B', borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#0B0F14', fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 12, borderColor: '#374151', borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardDate: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cardMeta: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '700' },
  defect: { backgroundColor: '#0B0F14', borderRadius: 8, padding: 11, marginTop: 10 },
  defectLabel: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  defectNote: { color: '#9CA3AF', fontSize: 12, marginTop: 4, lineHeight: 17 },
  seal: { color: '#4B5563', fontSize: 10, marginTop: 10, fontFamily: 'Courier' },
  review: { color: '#10B981', fontSize: 11, marginTop: 6 },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
});

const CAT_KEY = { vehicle: 'catVehicle', trailer: 'catTrailer', emergency: 'catEmergency' };

function NewInspection({ onDone }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: tpl, isLoading } = useQuery({ queryKey: ['inspection-template'], queryFn: fetchInspectionTemplate });
  const [state, setState] = useState({});
  const [odometer, setOdometer] = useState(null);
  const [type, setType] = useState('pre_trip');

  const items = tpl?.items ?? [];
  const ctx = tpl?.context ?? {};
  const odo = ctx.lastOdometer ?? {};
  const editable = odo.editable !== false;
  const odoValue = odometer ?? (odo.value != null ? String(odo.value) : '');

  function setItem(key, patch) {
    setState((st) => ({ ...st, [key]: { ok: true, note: '', photos: [], ...(st[key] ?? {}), ...patch } }));
  }

  async function addPhoto(key) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (res.canceled || !res.assets?.[0]?.base64) return;
    const a = res.assets[0];
    const cur = state[key]?.photos ?? [];
    if (cur.length >= 6) return;
    setItem(key, {
      photos: [...cur, {
        uri: a.uri,
        fileName: `${key}-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        contentBase64: a.base64,
        capturedAt: new Date().toISOString(),
      }],
    });
  }

  const submit = useMutation({
    mutationFn: () => {
      const payload = {
        inspectionType: type,
        clientReportedAt: new Date().toISOString(),
        ...(editable && odometer ? { odometer: parseInt(odometer, 10) } : {}),
        items: items.map((it) => {
          const st = state[it.key] ?? { ok: true };
          const row = { key: it.key, ok: st.ok !== false, note: st.ok === false ? st.note || null : null };
          if (st.ok === false && st.photos?.length) {
            row.photos = st.photos.map(({ fileName, mimeType, contentBase64, capturedAt }) => ({ fileName, mimeType, contentBase64, capturedAt }));
          }
          return row;
        }),
      };
      return submitInspection(payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['inspections'] });
      const insp = res?.inspection;
      Alert.alert(
        t('inspection.doneTitle'),
        insp?.hasDefects ? t('inspection.doneDefects') : t('inspection.doneClean'),
        [{ text: t('common.done'), onPress: onDone }]
      );
    },
    onError: (e) => Alert.alert(t('common.error'), e.message),
  });

  function validate() {
    if (editable && (!odoValue || isNaN(parseInt(odoValue, 10)))) return Alert.alert(t('inspection.odometerRequired'));
    const bad = items.filter((it) => state[it.key]?.ok === false);
    if (bad.some((it) => !state[it.key]?.note?.trim())) return Alert.alert(t('inspection.notesRequired'));
    submit.mutate();
  }

  if (isLoading) return <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />;

  let lastCat = null;

  return (
    <View>
      <Text style={s.why}>{t('inspection.why')}</Text>

      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, type === 'pre_trip' && s.tabOn]} onPress={() => setType('pre_trip')}>
          <Text style={[s.tabText, type === 'pre_trip' && s.tabOnText]}>{t('inspection.preTrip')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, type === 'post_trip' && s.tabOn]} onPress={() => setType('post_trip')}>
          <Text style={[s.tabText, type === 'post_trip' && s.tabOnText]}>{t('inspection.postTrip')}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.fieldRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>{t('inspection.odometer').toUpperCase()}</Text>
          {editable ? (
            <TextInput
              style={s.input}
              keyboardType="number-pad"
              value={odoValue}
              onChangeText={setOdometer}
              placeholder="0"
              placeholderTextColor="#6B7280"
            />
          ) : (
            <View style={[s.input, { justifyContent: 'center' }]}>
              <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
                {odo.value?.toLocaleString() ?? '—'}
              </Text>
            </View>
          )}
          {odo.source === 'eld' && !editable ? <Text style={s.rule}>ELD</Text> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>{t('inspection.trailer').toUpperCase()}</Text>
          <View style={[s.input, { justifyContent: 'center' }]}>
            <Text style={{ color: '#9CA3AF', fontSize: 16 }}>{ctx.trailerUnit ?? '—'}</Text>
          </View>
        </View>
      </View>
      {ctx.truckUnit ? (
        <Text style={s.rule}>{t('inspection.truck')} {ctx.truckUnit}</Text>
      ) : null}

      {items.map((it) => {
        const st = state[it.key] ?? { ok: true };
        const bad = st.ok === false;
        const showCat = it.category !== lastCat;
        lastCat = it.category;
        return (
          <View key={it.key}>
            {showCat ? <Text style={s.label}>{t(`inspection.${CAT_KEY[it.category] ?? 'catVehicle'}`)}</Text> : null}
            <View style={[s.item, bad && s.itemBad]}>
              <View style={s.itemTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemLabel}>{it.label}</Text>
                  {it.rule ? <Text style={s.rule}>{it.rule}</Text> : null}
                </View>
                <View style={s.toggle}>
                  <TouchableOpacity style={[s.tg, !bad && s.tgOk]} onPress={() => setItem(it.key, { ok: true })}>
                    <Text style={[s.tgText, !bad && s.tgTextOn]}>{t('inspection.ok')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.tg, bad && s.tgBad]} onPress={() => setItem(it.key, { ok: false })}>
                    <Text style={[s.tgText, bad && s.tgTextOn]}>{t('inspection.defect')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {bad ? (
                <>
                  <TextInput
                    style={s.noteInput}
                    multiline
                    placeholder={t('inspection.noteHint')}
                    placeholderTextColor="#6B7280"
                    value={st.note}
                    onChangeText={(v) => setItem(it.key, { note: v })}
                  />
                  <View style={s.photoRow}>
                    {(st.photos ?? []).map((p, i) => (
                      <Image key={i} source={{ uri: p.uri }} style={s.thumb} />
                    ))}
                    {(st.photos ?? []).length < 6 ? (
                      <TouchableOpacity style={s.addPhoto} onPress={() => addPhoto(it.key)}>
                        <Text style={s.addPhotoText}>+</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={s.submit} onPress={validate} disabled={submit.isPending}>
        {submit.isPending ? <ActivityIndicator color="#0B0F14" /> : <Text style={s.submitText}>{t('inspection.submit')}</Text>}
      </TouchableOpacity>
    </View>
  );
}

function History() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['inspections'], queryFn: () => fetchInspections(20) });
  const rows = data?.inspections ?? [];

  if (isLoading) return <ActivityIndicator color="#F59E0B" style={{ marginTop: 40 }} />;
  if (!rows.length) return <Text style={s.empty}>{t('inspection.noHistory')}</Text>;

  return (
    <View>
      {rows.map((r) => (
        <View key={r.id} style={s.card}>
          <View style={s.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardDate}>{new Date(r.submittedAt).toLocaleString()}</Text>
              <Text style={s.cardMeta}>
                {r.inspectionType === 'post_trip' ? t('inspection.postTrip') : t('inspection.preTrip')}
                {r.truckUnit ? ` · ${t('inspection.truck')} ${r.truckUnit}` : ''}
                {r.odometer ? ` · ${r.odometer.toLocaleString()}` : ''}
              </Text>
            </View>
            <View style={[s.pill, { backgroundColor: r.hasDefects ? '#EF444420' : '#10B98120' }]}>
              <Text style={[s.pillText, { color: r.hasDefects ? '#EF4444' : '#10B981' }]}>
                {r.hasDefects ? t('inspection.defectCount', { count: r.defectCount }) : t('inspection.clean')}
              </Text>
            </View>
          </View>

          {(r.defects ?? []).map((d) => (
            <View key={d.id} style={s.defect}>
              <Text style={s.defectLabel}>{d.itemLabel}</Text>
              {d.note ? <Text style={s.defectNote}>{d.note}</Text> : null}
              {d.photoCount ? (
                <Text style={s.cardMeta}>{t('inspection.photos', { count: d.photoCount })}</Text>
              ) : null}
            </View>
          ))}

          {r.notifiedAt ? (
            <Text style={s.review}>
              ✓ {t('inspection.notifiedAt', { time: new Date(r.notifiedAt).toLocaleTimeString() })}
            </Text>
          ) : null}
          {r.reviewStatus === 'reviewed' ? (
            <Text style={s.review}>
              ✓ {t('inspection.reviewReviewed')}
              {r.reviewNotes ? ` — ${r.reviewNotes}` : ''}
            </Text>
          ) : r.hasDefects ? (
            <Text style={s.cardMeta}>{t('inspection.reviewNew')}</Text>
          ) : null}

          {r.evidenceHash ? (
            <Text style={s.seal}>{t('inspection.record', { hash: String(r.evidenceHash).slice(0, 16) })}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export default function InspectionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [tab, setTab] = useState('new');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← {t('more.title')}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t('inspection.title')}</Text>
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'new' && s.tabOn]} onPress={() => setTab('new')}>
            <Text style={[s.tabText, tab === 'new' && s.tabOnText]}>{t('inspection.new')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'history' && s.tabOn]} onPress={() => setTab('history')}>
            <Text style={[s.tabText, tab === 'history' && s.tabOnText]}>{t('inspection.history')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {tab === 'new' ? <NewInspection onDone={() => setTab('history')} /> : <History />}
      </ScrollView>
    </SafeAreaView>
  );
}
