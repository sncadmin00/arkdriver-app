import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import {
  fetchProfile, fetchLoads, fetchSettlement,
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
  when: { color: '#9CA3AF', fontSize: 12, marginTop: 6 },
  arrived: { color: '#10B981', fontSize: 11, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F59E0B' },
  btnText: { color: '#0B0F14', fontWeight: '700', fontSize: 14 },
  btnGhost: { backgroundColor: 'transparent', borderColor: '#F59E0B', borderWidth: 1 },
  btnGhostText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  empty: { color: '#9CA3AF', fontSize: 14 },
  emptySub: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
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
  report: { borderColor: '#DC2626', borderWidth: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  reportText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});

const STATUS_COLORS = {
  booked: '#3B82F6', dispatched: '#8B5CF6', at_pickup: '#EAB308',
  in_transit: '#F59E0B', at_delivery: '#EAB308', delivered: '#10B981',
};

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
  const emergency = profile.data?.support?.emergencyPhone;
  const comp = profile.data?.compliance;

  const activeLoads = loads.data ?? [];

  const st = settlement.data?.settlement;
  const rpm = st?.miles > 0 ? st.gross / st.miles : null;

  const list = (v) => (Array.isArray(v) ? v : v?.services ?? v?.announcements ?? v?.items ?? []);
  const svc = list(services.data);
  const anns = list(announcements.data).slice(0, 2);

  const today = new Date().toISOString().slice(0, 10);
  const inspectedToday = (inspections.data?.inspections ?? []).some(
    (i) => String(i.submittedAt ?? '').slice(0, 10) === today
  );

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

  const refreshing =
    profile.isFetching || loads.isFetching || settlement.isFetching;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header
        title={driver?.driverName ?? t('home.welcome')}
        subtitle={[
          truck?.unit ? t('home.unit', { unit: truck.unit }) : null,
          driver?.status ? t('home.status', { status: driver.status }) : null,
        ].filter(Boolean).join(' · ')}
      />

      <ScrollView
        style={s.container}
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#F59E0B"
            onRefresh={() => qc.invalidateQueries()}
          />
        }
      >
        <Text style={[s.section, { marginTop: 0 }]}>{t('home.activeLoad')}</Text>
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

              <Text style={s.kind}>{t('loads.delivery')}</Text>
              <Text style={s.addr}>{String(load.destination ?? '').split('\n').join(', ')}</Text>
              {load.deliverAt ? (
                <Text style={s.when}>{load.deliverAt} {load.deliverTime ?? ''}</Text>
              ) : null}

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
                  <Text style={s.payAmount}>{money(st.payable)}</Text>
                  <Text style={s.payMeta}>
                    {t('home.weekMeta', { count: st.loadCount ?? 0, miles: st.miles ?? 0 })}
                  </Text>
                </View>
                {rpm ? <Text style={s.payRpm}>${rpm.toFixed(2)}/mi</Text> : null}
              </View>
            </TouchableOpacity>
          </>
        ) : null}

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

        {anns.length ? (
          <>
            <Text style={s.section}>{t('home.announcements')}</Text>
            <View style={s.card}>
              {anns.map((a, i) => (
                <View key={a.id ?? i} style={[s.ann, i === anns.length - 1 && s.svcLast]}>
                  {a.title ? <Text style={s.annTitle}>{a.title}</Text> : null}
                  <Text style={s.annBody}>{a.body ?? a.message ?? a.text}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={s.section}>{t('home.emergency')}</Text>
        {emergency ? (
          <TouchableOpacity style={s.sos} onPress={callSupport}>
            <Text style={s.sosText}>{t('more.callDispatch')}</Text>
            <Text style={s.sosSub}>{emergency}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={s.report} onPress={() => router.push('/report')}>
          <Text style={s.reportText}>{t('home.reportIncident')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
