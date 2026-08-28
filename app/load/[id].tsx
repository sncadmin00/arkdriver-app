import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLoadDetail, checkInStop, fetchSettlement, fetchNavigation, mondayOf, ApiError } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  booked: '#3B82F6', dispatched: '#8B5CF6', at_pickup: '#EAB308',
  in_transit: '#F59E0B', at_delivery: '#EAB308', delivered: '#10B981',
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 16 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  ref: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 40 },
  section: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.6, marginTop: 4 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 20, borderColor: '#374151', borderWidth: 1 },
  active: { borderColor: '#F59E0B', borderWidth: 2 },
  kind: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  addr: { color: '#FFFFFF', fontSize: 16, lineHeight: 23, marginTop: 6, fontWeight: '500' },
  when: { color: '#9CA3AF', fontSize: 12, marginTop: 6 },
  stamp: { color: '#10B981', fontSize: 11, marginTop: 4 },
  btn: { borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 14, backgroundColor: '#F59E0B' },
  btnOff: { backgroundColor: '#374151' },
  btnText: { color: '#0B0F14', fontWeight: '700', fontSize: 15 },
  btnOffText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  missing: { color: '#EAB308', fontSize: 12, marginTop: 12, lineHeight: 18 },
  note: { color: '#6B7280', fontSize: 12, marginTop: 12, lineHeight: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  label: { color: '#9CA3AF', fontSize: 13 },
  value: { color: '#E5E7EB', fontSize: 13, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  link: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  instructions: { color: '#E5E7EB', fontSize: 13, lineHeight: 21 },
  step: { flexDirection: 'row', marginBottom: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
  stepAddr: { color: '#E5E7EB', fontSize: 13, lineHeight: 19 },
  stepAddrOff: { color: '#4B5563' },
  done: { color: '#10B981', fontSize: 11, marginTop: 2 },
  upload: { borderColor: '#F59E0B', borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  uploadText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  err: { color: '#EF4444', fontSize: 13 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  nav: { backgroundColor: '#374151', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  navGo: { backgroundColor: '#F59E0B' },
  navGoText: { color: '#0B0F14', fontWeight: '700', fontSize: 15 },
  navText: { color: '#F59E0B', fontWeight: '700', fontSize: 15 },
  sheetWrap: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1F2937', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 36 },
  sheetTitle: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomColor: '#374151', borderBottomWidth: 1 },
  sheetName: { color: '#FFFFFF', fontSize: 16, flex: 1 },
  sheetTag: { color: '#10B981', fontSize: 9, fontWeight: '700', backgroundColor: '#10B98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sheetCancel: { paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  sheetCancelText: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
  closed: { color: '#10B981', fontSize: 14, fontWeight: '600', textAlign: 'center', paddingVertical: 20 },
});

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{String(value)}</Text>
    </View>
  );
}

export default function LoadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['load', id],
    queryFn: () => fetchLoadDetail(id!),
    enabled: !!id,
  });

  const load = data?.load ?? data;

  const { data: settle } = useQuery({
    queryKey: ['settlement', mondayOf(new Date())],
    queryFn: () => fetchSettlement(mondayOf(new Date())),
  });
  const payLine = (settle?.settlement?.loads ?? []).find(
    (l: any) => l.reference && l.reference === load?.reference
  );
  const stops: any[] = data?.stops ?? load?.stops ?? [];
  const idxOf = (stop: any, i: number) => stop.index ?? i;
  const current = stops.find((st: any) => st.current) ?? stops.find((st: any) => !st.complete);

  const [navApps, setNavApps] = useState(null);
  const [navBusy, setNavBusy] = useState(false);

  async function launch(app) {
    setNavApps(null);

    // ARK's own map is this app — open the screen instead of a deep link
    if (app.key === 'ark' || String(app.deepLink ?? '').startsWith('ark://')) {
      return router.push(`/load/map?id=${id}`);
    }

    if (app.deepLink) {
      const ok = await Linking.canOpenURL(app.deepLink).catch(() => false);
      if (ok) {
        try { return await Linking.openURL(app.deepLink); } catch {}
      }
    }
    if (app.fallbackKind === 'store') {
      const store = app.storeLinks?.ios ?? app.fallback;
      return Alert.alert(
        t('load.notInstalled', { app: app.name }),
        t('load.installPrompt', { app: app.name }),
        [
          { text: t('load.notNow'), style: 'cancel' },
          { text: t('load.install'), onPress: () => store && Linking.openURL(store) },
        ]
      );
    }
    if (app.fallback) return Linking.openURL(app.fallback);
    Alert.alert('Unavailable', `${app.name} could not be opened.`);
  }

  async function navigate() {
    setNavBusy(true);
    try {
      const res = await fetchNavigation(id);
      console.log('NAV RESPONSE:', JSON.stringify(res?.target?.apps, null, 2));
      const apps = res?.target?.apps ?? [];
      if (!apps.length) return Alert.alert('Unavailable', 'No navigation options for this stop.');
      setNavApps(apps);
    } catch (e) {
      Alert.alert('Could not load navigation', e.message);
    } finally {
      setNavBusy(false);
    }
  }

  const checkIn = useMutation({
    mutationFn: ({ index, event }: { index: number; event: 'arrived' | 'departed' }) =>
      checkInStop(id!, index, event),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['load', id] });
      qc.invalidateQueries({ queryKey: ['loads'] });
      if (res?.closed) Alert.alert(t('load.loadClosed'), t('load.loadClosedBody'));
    },
    onError: (e: Error) => {
      const code = e instanceof ApiError ? e.code : undefined;
      const titles: Record<string, string> = {
        docs_required: 'Documents required',
        pod_required: 'POD required',
        stop_locked: 'Finish the current stop first',
        arrival_required: 'Check in as arrived first',
        already_arrived: 'Already checked in',
        already_departed: 'Already departed',
      };
      Alert.alert(titles[code ?? ''] ?? 'Check-in failed', e.message);
    },
  });

  const missing: string[] = current?.missingDocs ?? [];
  const blocked = !!current?.arrivedAt && missing.length > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← {t('loads.title')}</Text>
          </TouchableOpacity>
          <View style={s.titleRow}>
            <Text style={s.title}>{id}</Text>
            {load?.status && (
              <View style={[s.badge, { backgroundColor: STATUS_COLORS[load.status] ?? '#4B5563' }]}>
                <Text style={s.badgeText}>{String(load.status).replace('_', ' ').toUpperCase()}</Text>
              </View>
            )}
          </View>
          {load?.reference && <Text style={s.ref}>{load.reference}</Text>}
        </View>

        <View style={s.body}>
          {isLoading && <ActivityIndicator color="#F59E0B" />}
          {error && <Text style={s.err}>{(error as Error).message}</Text>}

          {current ? (
            <>
              <Text style={s.section}>{t('load.currentStop', { index: idxOf(current, 0) + 1, total: stops.length })}</Text>
              <View style={[s.card, s.active]}>
                <Text style={s.kind}>{String(current.kind ?? '').toUpperCase()}</Text>
                <Text style={s.addr}>{current.address}</Text>
                {current.date && <Text style={s.when}>{current.date} {current.time ?? ''}</Text>}
                {current.arrivedAt && (
                  <Text style={s.stamp}>✓ Arrived {new Date(current.arrivedAt).toLocaleString()}</Text>
                )}

                {blocked && (
                  <Text style={s.missing}>
                    {t('load.uploadDocs', { docs: missing.join(', ').toUpperCase() })}
                  </Text>
                )}
                {current.arrivedAt && !missing.length && current.podRequired === false && (
                  <Text style={s.note}>{t('load.noPaperwork')}</Text>
                )}

                <View style={s.navRow}>
                  <TouchableOpacity
                    style={[s.nav, { flex: 1 }]}
                    onPress={() => router.push(`/load/map?id=${id}`)}
                  >
                    <Text style={s.navText}>{t('load.map')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.nav, s.navGo, { flex: 1 }]} onPress={navigate} disabled={navBusy}>
                    {navBusy ? <ActivityIndicator color="#0B0F14" /> : <Text style={s.navGoText}>{t('load.navigate')}</Text>}
                  </TouchableOpacity>
                </View>

                {current.arrivedAt && (missing.length > 0 || (current.recommendedDocs ?? []).length > 0) && (
                  <View style={{ marginTop: 14 }}>
                    {[...new Set([...(missing ?? []), ...(current.recommendedDocs ?? [])])].map((doc: string) => {
                      const req = missing.includes(doc);
                      return (
                        <TouchableOpacity
                          key={doc}
                          style={s.upload}
                          onPress={() => router.push({
                            pathname: '/load/upload',
                            params: { id: String(id), stopIndex: String(idxOf(current, 0)), docKey: doc, kind: current.kind },
                          })}
                        >
                          <Text style={s.uploadText}>
                            {req ? t('load.upload', { doc: doc.toUpperCase() }) : t('load.uploadOptional', { doc: doc.toUpperCase() })}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {!current.arrivedAt ? (
                  <TouchableOpacity
                    style={s.btn}
                    disabled={checkIn.isPending}
                    onPress={() => checkIn.mutate({ index: idxOf(current, 0), event: 'arrived' })}
                  >
                    <Text style={s.btnText}>{checkIn.isPending ? '…' : t('load.arrived')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.btn, blocked && s.btnOff]}
                    disabled={checkIn.isPending || blocked}
                    onPress={() => checkIn.mutate({ index: idxOf(current, 0), event: 'departed' })}
                  >
                    <Text style={blocked ? s.btnOffText : s.btnText}>
                      {checkIn.isPending ? '…' : blocked ? t('load.departedBlocked') : t('load.departed')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : stops.length > 0 ? (
            <Text style={s.closed}>✓ {t('load.allComplete')}</Text>
          ) : null}

          {stops.length > 0 && (
            <>
              <Text style={s.section}>{t('load.allStops')}</Text>
              <View style={s.card}>
                {stops.map((stop: any, i: number) => {
                  const color = stop.complete ? '#10B981' : stop.current ? '#F59E0B' : '#374151';
                  return (
                    <View key={i} style={s.step}>
                      <View style={[s.dot, { backgroundColor: color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.kind}>
                          {idxOf(stop, i) + 1} · {String(stop.kind ?? '').toUpperCase()}
                        </Text>
                        <Text style={[s.stepAddr, stop.locked && s.stepAddrOff]}>{stop.address}</Text>
                        {stop.departedAt && (
                          <Text style={s.done}>✓ Departed {new Date(stop.departedAt).toLocaleString()}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {load?.driverInstructions ? (
            <>
              <Text style={s.section}>{t('load.instructions')}</Text>
              <View style={s.card}>
                <Text style={s.instructions}>{load.driverInstructions}</Text>
              </View>
            </>
          ) : null}

          <Text style={s.section}>{t('load.details')}</Text>
          <View style={s.card}>
            <Row label={t("load.milesLabel")} value={load?.miles ? `${load.miles} mi` : null} />
            {payLine ? (
              <View style={s.row}>
                <Text style={s.label}>{t('load.payEstimate')}</Text>
                <Text style={[s.value, { color: '#EAB308' }]}>
                  ${payLine.pay?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ) : null}
            <Row label={t("load.equipment")} value={load?.equipmentType?.replace('_', ' ')} />
            <Row label={t("load.commodity")} value={load?.commodity} />
            <Row label={t("load.weight")} value={load?.weightLbs ? `${load.weightLbs} lbs` : null} />
            <Row label={t("load.billing")} value={load?.selfBill ? t('load.selfBill') : null} />
            <Row label={t("load.customer")} value={load?.customer?.name} />
            {load?.customer?.phone ? (
              <View style={s.row}>
                <Text style={s.label}>{t('load.phone')}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${String(load.customer.phone).replace(/[^\d+]/g, '')}`)}>
                  <Text style={s.link}>{load.customer.phone}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!navApps} transparent animationType="fade" onRequestClose={() => setNavApps(null)}>
        <View style={s.sheetWrap}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{t('load.openIn')}</Text>
            {(navApps ?? []).map((app) => (
              <TouchableOpacity key={app.key} style={s.sheetItem} onPress={() => launch(app)}>
                <Text style={s.sheetName}>{app.name}</Text>
                {app.truckAware ? <Text style={s.sheetTag}>{t('load.truckBadge')}</Text> : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.sheetCancel} onPress={() => setNavApps(null)}>
              <Text style={s.sheetCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
