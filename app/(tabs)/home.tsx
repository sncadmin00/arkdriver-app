import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import Countdown from '@/components/Countdown';
import { readMap, visible } from '@/lib/announcements';
import {
  fetchProfile, fetchLoads, fetchSettlement, setOffStatus,
  fetchServices, fetchAnnouncements, fetchInspections, mondayOf,
} from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  body: { padding: 20, paddingBottom: 40 },
  section: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10, marginTop: 20 },
  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 18, borderColor: '#374151', borderWidth: 1 },
  cardActive: { borderColor: '#F59E0B' },
  loadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  loadId: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  kind: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  addr: { color: '#FFFFFF', fontSize: 15, lineHeight: 21, marginTop: 5 },
  lane: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', lineHeight: 23 },
  arrow: { color: '#F59E0B', fontWeight: '700' },
  when: { color: '#9CA3AF', fontSize: 12, marginTop: 6 },
  arrived: { color: '#10B981', fontSize: 11, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F59E0B' },
  btnText: { color: '#0B0F14', fontWeight: '700', fontSize: 14 },
  btnGhost: { backgroundColor: 'transparent', borderColor: '#F59E0B', borderWidth: 1 },
  btnGhostText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  empty: { color: '#9CA3AF', fontSize: 14 },
  emptySub: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  divider: { height: 1, backgroundColor: '#374151' },
  carrierName: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginBottom: 3 },
  carrier: { color: '#6B7280', fontSize: 11, lineHeight: 16 },
  sheetWrap: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheetBox: { backgroundColor: '#1F2937', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 36 },
  sheetTitle: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  sheetItem: { paddingVertical: 15, borderBottomColor: '#374151', borderBottomWidth: 1 },
  sheetName: { color: '#FFFFFF', fontSize: 16 },
  sheetCancel: { paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  kvLabel: { color: '#9CA3AF', fontSize: 13 },
  kvValue: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  payLabel: { color: '#6B7280', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  payAmount: { color: '#F59E0B', fontSize: 28, fontWeight: '800' },
  payMeta: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  payRpm: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  alert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 10, padding: 14, marginBottom: 8, borderLeftColor: '#EAB308', borderLeftWidth: 3 },
  alertText: { color: '#E5E7EB', fontSize: 13, flex: 1 },
  chev: { color: '#6B7280', fontSize: 18 },
  svc: { paddingVertical: 13, borderBottomColor: '#374151', borderBottomWidth: 1 },
  svcLast: { borderBottomWidth: 0 },
  svcName: { color: '#E5E7EB', fontSize: 15, fontWeight: '500' },
  svcSub: { color: '#6B7280', fontSize: 12, marginTop: 3, lineHeight: 17 },
  soon: { color: '#6B7280', fontSize: 10, fontWeight: '700', marginTop: 4 },
  ann: { paddingVertical: 11, borderBottomColor: '#374151', borderBottomWidth: 1 },
  annTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  annBody: { color: '#9CA3AF', fontSize: 13, marginTop: 4, lineHeight: 18 },
  sos: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  sosText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sosSub: { color: '#FCA5A5', fontSize: 12, marginTop: 3 },
  report: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 17, alignItems: 'center', marginTop: 10 },
  reportText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  callGhost: { borderColor: '#4B5563', borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  callGhostText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
});

const STATUS_COLORS = {
  booked: '#3B82F6', dispatched: '#8B5CF6', at_pickup: '#EAB308',
  in_transit: '#F59E0B', at_delivery: '#EAB308', delivered: '#10B981',
};

// "MDT5\n200 Goodman Dr\nLEWISBERRY, PA 17339" -> "Lewisberry, PA"
function cityState(addr) {
  const lines = String(addr ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? '';
  const m = last.match(/^(.+?),\s*([A-Za-z]{2})\b/);
  if (!m) return last;
  const city = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return `${city}, ${m[2].toUpperCase()}`;
}

const money = (n) =>
  typeof n === 'number' ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const week = mondayOf(new Date());

  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const loads = useQuery({ queryKey: ['loads', 'active'], queryFn: () => fetchLoads() });
  const settlement = useQuery({ queryKey: ['settlement', week], queryFn: () => fetchSettlement(week) });
  const services = useQuery({ queryKey: ['services'], queryFn: fetchServices });
  const announcements = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements });
  const inspections = useQuery({ queryKey: ['inspections'], queryFn: () => fetchInspections(5) });

  const driver = profile.data?.driver;
  const truck = profile.data?.truck;
  const trailer = profile.data?.trailer;
  const equipment = profile.data?.equipment;
  const carrier = profile.data?.carrier;
  const isOff = driver?.status === 'off';
  const emergency = profile.data?.support?.emergencyPhone;
  const comp = profile.data?.compliance;

  const activeLoads = loads.data ?? [];

  const st = settlement.data?.settlement;
  // Until a statement is dispatched the only number anyone knows is freight gross.
  // The 85% split and weekly deductions land later, so a net figure here would move.
  const loadGross = st?.freightGross ?? (st?.loads ?? []).reduce((sum, l) => sum + (l.rate ?? l.pay ?? 0), 0);
  const rpm = st?.miles > 0 && loadGross > 0 ? loadGross / st.miles : null;

  const list = (v) => (Array.isArray(v) ? v : v?.services ?? v?.announcements ?? v?.items ?? []);
  const svc = list(services.data);
  const annsAll = announcements.data?.announcements ?? list(announcements.data);
  const anns = visible([...annsAll].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)), readAt).slice(0, 2);

  const today = new Date().toISOString().slice(0, 10);
  const inspectedToday = (inspections.data?.inspections ?? []).some(
    (i) => String(i.submittedAt ?? '').slice(0, 10) === today
  );

  const [readAt, setReadAt] = useState({});
  useEffect(() => { readMap().then(setReadAt); }, []);
  const [askOff, setAskOff] = useState(false);
  const [dutyBusy, setDutyBusy] = useState(false);

  const OFF_OPTIONS = [
    { key: 'hours2', hours: 2 },
    { key: 'hours4', hours: 4 },
    { key: 'hours8', hours: 8 },
    { key: 'hours10', hours: 10 },
    { key: 'tomorrow', hours: null },
  ];

  async function goOff(hours) {
    setAskOff(false);
    setDutyBusy(true);
    try {
      let readyAt;
      if (hours) {
        readyAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(6, 0, 0, 0);
        readyAt = d.toISOString();
      }
      await setOffStatus(readyAt);
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setDutyBusy(false);
    }
  }

  async function goOnDuty() {
    setDutyBusy(true);
    try {
      await setOffStatus(null);
      qc.invalidateQueries({ queryKey: ['profile'] });
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setDutyBusy(false);
    }
  }

  function callSupport() {
    if (!emergency) return;
    Alert.alert(t('more.callDispatch'), t('more.callConfirm', { phone: emergency }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('more.call'), style: 'destructive', onPress: () => Linking.openURL(`tel:${String(emergency).replace(/[^\d+]/g, '')}`) },
    ]);
  }

  async function openService(item) {
    if (item.deepLink) {
      const ok = await Linking.canOpenURL(item.deepLink).catch(() => false);
      if (ok) return Linking.openURL(item.deepLink);
    }
    if (item.webLink) Linking.openURL(item.webLink);
  }

  // Only spin when the driver actually pulled to refresh —
  // background refetches shouldn't look like the app is stuck.
  const [pulling, setPulling] = useState(false);

  async function refresh() {
    setPulling(true);
    try {
      await qc.refetchQueries({ type: 'active' });
    } finally {
      setPulling(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title="" />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl refreshing={pulling} tintColor="#F59E0B" onRefresh={refresh} />
        }
      >
        {anns.length ? (
          <>
            <Text style={[s.section, { marginTop: 0 }]}>{t('home.announcements')}</Text>
            <View style={s.card}>
              {anns.map((a, i) => (
                <TouchableOpacity
                  key={a.id ?? i}
                  onPress={() => router.push('/notifications')}
                  style={[
                    s.ann,
                    i === anns.length - 1 && s.svcLast,
                    a.severity === 'critical' ? { borderLeftColor: '#EF4444', borderLeftWidth: 3, paddingLeft: 10 }
                      : a.severity === 'warning' ? { borderLeftColor: '#EAB308', borderLeftWidth: 3, paddingLeft: 10 } : null,
                  ]}
                >
                  {a.title ? (
                    <Text style={[
                      s.annTitle,
                      a.severity === 'critical' && { color: '#EF4444' },
                      a.severity === 'warning' && { color: '#EAB308' },
                    ]}>
                      {a.pinned ? '📌 ' : ''}{a.title}
                    </Text>
                  ) : null}
                  <Text style={s.annBody} numberOfLines={2}>{a.body}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        <Text style={[s.section, {}]}>{t('home.driverCard')}</Text>
        <View style={[s.card, { marginBottom: 4 }]}>
          <Text style={s.loadId}>{driver?.driverName ?? '—'}</Text>
          <View style={[s.divider, { marginVertical: 12 }]} />
          <View style={s.kv}>
            <Text style={s.kvLabel}>{t('home.truck')}</Text>
            <Text style={s.kvValue}>{truck?.unit ?? '—'}</Text>
          </View>
          <View style={s.kv}>
            <Text style={s.kvLabel}>{t('home.trailer')}</Text>
            <Text style={s.kvValue}>
              {equipment?.code === 'PO' || (!trailer && equipment?.code === 'PO')
                ? t('home.powerOnly')
                : trailer?.unit ?? trailer ?? '—'}
            </Text>
          </View>
          <View style={s.kv}>
            <Text style={s.kvLabel}>{t('more.status')}</Text>
            <Text style={[s.kvValue, { color: isOff ? '#9CA3AF' : '#10B981' }]}>
              {isOff && driver?.readyAt
                ? t('home.offUntil', { time: new Date(driver.readyAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) })
                : driver?.status ?? '—'}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.btn, s.btnGhost, { marginTop: 14 }]}
            onPress={() => (isOff ? goOnDuty() : setAskOff(true))}
            disabled={dutyBusy}
          >
            <Text style={s.btnGhostText}>
              {dutyBusy ? '…' : isOff ? t('home.backOn') : t('home.setOff')}
            </Text>
          </TouchableOpacity>

        </View>

        <Text style={s.section}>{t('home.activeLoad')}</Text>
        {activeLoads.length ? (
          activeLoads.map((load) => (
            <View key={load.id} style={[s.card, s.cardActive, { marginBottom: 12 }]}>
              <View style={s.loadTop}>
                <Text style={s.loadId}>{load.id}</Text>
                {load.status ? (
                  <View style={[s.badge, { backgroundColor: STATUS_COLORS[load.status] ?? '#4B5563' }]}>
                    <Text style={s.badgeText}>{String(load.status).replace('_', ' ').toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={s.lane}>
                {cityState(load.origin)}
                <Text style={s.arrow}>  →  </Text>
                {cityState(load.destination)}
              </Text>
              <Text style={s.when}>
                {[load.pickupAt, load.deliverAt].filter(Boolean).join('  →  ')}
              </Text>
              {(() => {
                // Before the truck rolls, the next appointment is the pickup.
                const beforeTransit = ['booked', 'dispatched', 'at_pickup'].includes(load.status);
                return (
                  <Countdown
                    date={beforeTransit ? load.pickupAt : load.deliverAt}
                    time={beforeTransit ? load.pickupTime : load.deliverTime}
                    timezone={beforeTransit ? load.pickupTimezone : load.deliverTimezone}
                    kind={beforeTransit ? 'pickup' : 'delivery'}
                  />
                );
              })()}

              <View style={s.btnRow}>
                <TouchableOpacity style={s.btn} onPress={() => router.push(`/load/${load.id}`)}>
                  <Text style={s.btnText}>{t('home.openLoad')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btn, s.btnGhost]}
                  onPress={() => router.push({ pathname: '/chat', params: { loadRef: load.id } })}
                >
                  <Text style={s.btnGhostText}>{t('tabs.chat')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={s.card}>
            <Text style={s.empty}>{t('home.noLoad')}</Text>
            <Text style={s.emptySub}>{t('home.noLoadSub')}</Text>
            <TouchableOpacity
              style={[s.btn, s.btnGhost, { marginTop: 14 }]}
              onPress={() => router.push('/chat')}
            >
              <Text style={s.btnGhostText}>{t('home.openChat')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {st ? (
          <>
            <Text style={s.section}>{t('home.thisWeek')}</Text>
            <TouchableOpacity style={s.card} onPress={() => router.push('/(tabs)/pay')}>
              <View style={s.payRow}>
                <View>
                  <Text style={s.payLabel}>{t('home.grossLabel')}</Text>
                  <Text style={s.payAmount}>{money(loadGross)}</Text>
                  <Text style={s.payMeta}>
                    {t('home.weekMeta', { count: st.loadCount ?? 0, miles: st.miles ?? 0 })}
                  </Text>
                </View>
                {rpm ? <Text style={s.payRpm}>${rpm.toFixed(2)}/mi</Text> : null}
              </View>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          style={[s.card, { marginTop: 20 }]}
          onPress={() => router.push({ pathname: '/(tabs)/compliance', params: { tab: 'truck' } })}
        >
          <View style={s.payRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={s.svcName}>{t('home.truckFolder')}</Text>
              <Text style={s.svcSub}>{t('home.truckFolderSub')}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </View>
        </TouchableOpacity>

        <Text style={s.section}>{t('home.pti')}</Text>
        <TouchableOpacity
          style={[s.card, !inspectedToday && { borderColor: '#EAB308' }]}
          onPress={() => router.push('/inspection')}
        >
          <View style={s.payRow}>
            <Text style={[s.alertText, { color: inspectedToday ? '#10B981' : '#EAB308', fontWeight: '600' }]}>
              {inspectedToday ? `✓ ${t('home.ptiDone')}` : t('home.inspectionDue')}
            </Text>
            {!inspectedToday ? <Text style={s.btnGhostText}>{t('home.ptiDo')} ›</Text> : null}
          </View>
        </TouchableOpacity>

        {svc.length ? (
          <>
            <Text style={s.section}>{t('home.services')}</Text>
            <View style={s.card}>
              {svc.map((item, i) => {
                const soon = item.status && item.status !== 'live';
                return (
                  <TouchableOpacity
                    key={item.handle ?? i}
                    style={[s.svc, i === svc.length - 1 && s.svcLast]}
                    disabled={soon}
                    onPress={() => openService(item)}
                  >
                    <Text style={[s.svcName, soon && { color: '#6B7280' }]}>{item.name}</Text>
                    {item.description ? <Text style={s.svcSub}>{item.description}</Text> : null}
                    {soon ? <Text style={s.soon}>{t('more.comingSoon')}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={s.section}>{t('home.emergency')}</Text>
        <TouchableOpacity style={s.report} onPress={() => router.push('/report')}>
          <Text style={s.reportText}>{t('home.reportIncident')}</Text>
        </TouchableOpacity>

        {emergency ? (
          <TouchableOpacity style={s.callGhost} onPress={callSupport}>
            <Text style={s.callGhostText}>{t('more.callDispatch')} · {emergency}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal visible={askOff} transparent animationType="fade" onRequestClose={() => setAskOff(false)}>
        <View style={s.sheetWrap}>
          <View style={s.sheetBox}>
            <Text style={s.sheetTitle}>{t('home.howLong')}</Text>
            {OFF_OPTIONS.map((o) => (
              <TouchableOpacity key={o.key} style={s.sheetItem} onPress={() => goOff(o.hours)}>
                <Text style={s.sheetName}>{t(`home.${o.key}`)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.sheetCancel} onPress={() => setAskOff(false)}>
              <Text style={s.btnGhostText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
