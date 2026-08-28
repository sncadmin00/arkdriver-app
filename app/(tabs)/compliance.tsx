import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, RefreshControl } from 'react-native';
import { WebView } from 'react-native-webview';
import { Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCompliance, fetchTruckDocuments, fetchDocumentUrl } from '@/lib/api';

const STATE: Record<string, { color: string; bg: string }> = {
  ok:      { color: '#10B981', bg: '#10B98118' },
  soon:    { color: '#EAB308', bg: '#EAB30818' },
  expired: { color: '#EF4444', bg: '#EF444418' },
  missing: { color: '#6B7280', bg: '#37415155' },
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  tabs: { flexDirection: 'row', marginTop: 14 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  tabOn: { backgroundColor: '#F59E0B' },
  tabText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  tabOnText: { color: '#0B0F14' },
  body: { padding: 20, paddingBottom: 50 },
  banner: { borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1 },
  bannerText: { fontSize: 13, fontWeight: '600', lineHeight: 19 },
  unit: { color: '#6B7280', fontSize: 12, marginBottom: 14 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, marginBottom: 12, borderColor: '#374151', borderWidth: 1, padding: 15 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', flex: 1, paddingRight: 10 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '700' },
  rule: { color: '#6B7280', fontSize: 11, marginTop: 4 },
  hint: { color: '#9CA3AF', fontSize: 12, marginTop: 8, lineHeight: 17 },
  meta: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },
  days: { fontWeight: '600' },
  view: { borderColor: '#F59E0B', borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  viewText: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },
  note: { color: '#6B7280', fontSize: 12, marginTop: 16, lineHeight: 18, textAlign: 'center' },
  err: { color: '#EF4444', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  share: { paddingHorizontal: 22, marginTop: 0 },
  modal: { flex: 1, backgroundColor: '#0B0F14' },
  modalBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 58, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: '#1F2937' },
  modalTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', flex: 1, paddingRight: 16 },
  modalClose: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
  modalLoad: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F14' },
});

function Pill({ state, label }: { state: string; label?: string }) {
  const c = STATE[state] ?? STATE.missing;
  return (
    <View style={[s.pill, { backgroundColor: c.bg }]}>
      <Text style={[s.pillText, { color: c.color }]}>
        {(label ?? state).toUpperCase()}
      </Text>
    </View>
  );
}

function Slot({ slot, shareable }: { slot: any; shareable?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);

  async function open() {
    if (!slot.documentId) return;
    setBusy(true);
    try {
      const res = await fetchDocumentUrl(slot.documentId);
      if (res?.url) setViewer(res.url);
      else Alert.alert('Unavailable', 'No file link returned.');
    } catch (e: any) {
      Alert.alert('Could not open', e.message);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!slot.documentId) return;
    setBusy(true);
    try {
      const res = await fetchDocumentUrl(slot.documentId);
      if (!res?.url) return Alert.alert('Unavailable', 'No file link returned.');
      await Share.share({
        message: `${slot.label}${res.fileName ? ` (${res.fileName})` : ''}\n${res.url}\n\nLink expires in 10 minutes.`,
      });
    } catch (e: any) {
      Alert.alert('Could not share', e.message);
    } finally {
      setBusy(false);
    }
  }

  const c = STATE[slot.state] ?? STATE.missing;

  return (
    <View style={[s.card, slot.state !== 'ok' && slot.state !== 'missing' && { borderColor: c.color }]}>
      <View style={s.top}>
        <Text style={s.label}>{slot.label}</Text>
        <Pill state={slot.state} label={slot.stateLabel} />
      </View>

      {slot.rule ? <Text style={s.rule}>{slot.rule}</Text> : null}
      {slot.hint ? <Text style={s.hint}>{slot.hint}</Text> : null}

      {slot.expiresAt ? (
        <Text style={s.meta}>
          Expires {new Date(slot.expiresAt).toLocaleDateString()}
          {typeof slot.daysUntilExpiry === 'number' && slot.daysUntilExpiry >= 0 ? (
            <Text style={[s.days, { color: c.color }]}> · {slot.daysUntilExpiry}d left</Text>
          ) : null}
        </Text>
      ) : null}

      {slot.uploadedAt && !slot.expiresAt ? (
        <Text style={s.meta}>Uploaded {new Date(slot.uploadedAt).toLocaleDateString()}</Text>
      ) : null}

      {slot.documentId ? (
        <View style={s.actions}>
          <TouchableOpacity style={[s.view, { flex: 1 }]} onPress={open} disabled={busy}>
            {busy ? <ActivityIndicator color="#F59E0B" /> : <Text style={s.viewText}>View</Text>}
          </TouchableOpacity>
          {shareable ? (
            <TouchableOpacity style={[s.view, s.share]} onPress={share} disabled={busy}>
              <Text style={s.viewText}>Share</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <Modal visible={!!viewer} animationType="slide" onRequestClose={() => setViewer(null)}>
        <View style={s.modal}>
          <View style={s.modalBar}>
            <Text style={s.modalTitle} numberOfLines={1}>{slot.label}</Text>
            <TouchableOpacity onPress={() => setViewer(null)} hitSlop={12}>
              <Text style={s.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          {viewer ? (
            <WebView
              source={{ uri: viewer }}
              style={{ flex: 1, backgroundColor: '#FFFFFF' }}
              startInLoadingState
              renderLoading={() => (
                <View style={s.modalLoad}>
                  <ActivityIndicator color="#F59E0B" size="large" />
                </View>
              )}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function Banner({ summary }: { summary: any }) {
  const gaps = summary?.gaps ?? 0;
  const soon = summary?.expiringSoon ?? 0;
  if (!gaps && !soon) {
    return (
      <View style={[s.banner, { borderColor: '#10B981', backgroundColor: '#10B98112' }]}>
        <Text style={[s.bannerText, { color: '#10B981' }]}>All documents in order.</Text>
      </View>
    );
  }
  const bad = gaps > 0;
  const color = bad ? '#EF4444' : '#EAB308';
  const parts = [];
  if (gaps) parts.push(`${gaps} missing or expired`);
  if (soon) parts.push(`${soon} expiring soon`);
  return (
    <View style={[s.banner, { borderColor: color, backgroundColor: color + '12' }]}>
      <Text style={[s.bannerText, { color }]}>{parts.join(' · ')}</Text>
    </View>
  );
}

export default function ComplianceScreen() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'dq' | 'truck'>('dq');

  const dq = useQuery({ queryKey: ['compliance'], queryFn: fetchCompliance });
  const truck = useQuery({ queryKey: ['truck-documents'], queryFn: fetchTruckDocuments });

  const active = tab === 'dq' ? dq : truck;
  const slots: any[] = active.data?.slots ?? [];
  const shown = slots.filter((x: any) => x.required !== false || x.documentId);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Compliance</Text>
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, tab === 'dq' && s.tabOn]} onPress={() => setTab('dq')}>
            <Text style={[s.tabText, tab === 'dq' && s.tabOnText]}>My documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, tab === 'truck' && s.tabOn]} onPress={() => setTab('truck')}>
            <Text style={[s.tabText, tab === 'truck' && s.tabOnText]}>Truck folder</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl
            refreshing={active.isFetching}
            tintColor="#F59E0B"
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ['compliance'] });
              qc.invalidateQueries({ queryKey: ['truck-documents'] });
            }}
          />
        }
      >
        {active.isLoading && <ActivityIndicator color="#F59E0B" style={{ marginTop: 30 }} />}
        {active.error && <Text style={s.err}>{(active.error as Error).message}</Text>}

        {active.data?.summary && <Banner summary={active.data.summary} />}

        {tab === 'truck' && truck.data?.truck ? (
          <Text style={s.unit}>
            Unit {truck.data.truck.unit}
            {truck.data.truck.vin ? ` · VIN ${truck.data.truck.vin}` : ''}
          </Text>
        ) : null}

        {shown.map((slot: any) => (
          <Slot key={slot.key} slot={slot} shareable={tab === 'truck'} />
        ))}

        <Text style={s.note}>
          Documents are managed by the office. To update one, send it to dispatch.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
