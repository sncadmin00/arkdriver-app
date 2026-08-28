import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, fetchServices, fetchAnnouncements, setOffStatus } from '@/lib/api';
import supabase from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, setLanguage } from '@/i18n';
import { setDriverLanguage } from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 18 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  body: { padding: 20, paddingBottom: 50 },
  section: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.6, marginTop: 8 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 20, borderColor: '#374151', borderWidth: 1 },
  name: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
  sub: { color: '#9CA3AF', fontSize: 13, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  label: { color: '#9CA3AF', fontSize: 13 },
  value: { color: '#E5E7EB', fontSize: 13, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#374151', marginVertical: 12 },
  item: { paddingVertical: 14, borderBottomColor: '#374151', borderBottomWidth: 1 },
  itemLast: { borderBottomWidth: 0 },
  itemTitle: { color: '#E5E7EB', fontSize: 15, fontWeight: '500' },
  itemSub: { color: '#6B7280', fontSize: 12, marginTop: 3, lineHeight: 17 },
  soon: { color: '#6B7280', fontSize: 10, fontWeight: '700', marginTop: 4 },
  sos: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 17, alignItems: 'center', marginBottom: 20 },
  sosText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sosSub: { color: '#FCA5A5', fontSize: 12, marginTop: 3 },
  toggle: { borderRadius: 8, paddingVertical: 13, alignItems: 'center', borderWidth: 1 },
  toggleOff: { borderColor: '#F59E0B' },
  toggleOffText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  toggleOn: { borderColor: '#10B981', backgroundColor: '#10B98115' },
  toggleOnText: { color: '#10B981', fontWeight: '600', fontSize: 14 },
  ann: { paddingVertical: 12, borderBottomColor: '#374151', borderBottomWidth: 1 },
  annTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  annBody: { color: '#9CA3AF', fontSize: 13, marginTop: 4, lineHeight: 19 },
  annDate: { color: '#6B7280', fontSize: 11, marginTop: 5 },
  empty: { color: '#6B7280', fontSize: 13 },
  out: { borderColor: '#EF4444', borderWidth: 1, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  outText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});

export default function MoreScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { t, i18n } = useTranslation();

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: services } = useQuery({ queryKey: ['services'], queryFn: fetchServices });
  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements });

  const driver = profile?.driver;
  const truck = profile?.truck;
  const emergency = profile?.support?.emergencyPhone;
  const isOff = driver?.status === 'off';

  const list = (v: any) => (Array.isArray(v) ? v : v?.services ?? v?.announcements ?? v?.items ?? []);
  const svc = list(services);
  const anns = list(announcements);

  const toggleOff = useMutation({
    mutationFn: () => setOffStatus(isOff ? null : new Date().toISOString()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
    onError: (e: Error) => Alert.alert('Could not update status', e.message),
  });

  function callSupport() {
    if (!emergency) return;
    const digits = String(emergency).replace(/[^\d+]/g, '');
    Alert.alert(t('more.callDispatch'), t('more.callConfirm', { phone: emergency }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('more.call'), style: 'destructive', onPress: () => Linking.openURL(`tel:${digits}`) },
    ]);
  }

  async function openService(item: any) {
    const deep = item.deepLink;
    const web = item.webLink;
    if (deep) {
      const ok = await Linking.canOpenURL(deep).catch(() => false);
      if (ok) return Linking.openURL(deep);
    }
    if (web) return Linking.openURL(web);
    Alert.alert('Unavailable', 'No link for this service yet.');
  }

  function signOut() {
    Alert.alert(t('more.signOut'), t('more.signOutBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('more.signOut'),
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          qc.clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>More</Text>
        </View>

        <View style={s.body}>
          <Text style={s.section}>{t('more.profile')}</Text>
          <View style={s.card}>
            <Text style={s.name}>{driver?.driverName ?? '—'}</Text>
            <Text style={s.sub}>{driver?.email}</Text>
            <View style={s.divider} />
            <View style={s.row}>
              <Text style={s.label}>{t('more.driverId')}</Text>
              <Text style={s.value}>{driver?.driverRef ?? '—'}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>{t('more.truck')}</Text>
              <Text style={s.value}>{truck?.unit ? `Unit ${truck.unit}` : '—'}</Text>
            </View>
            {truck?.vin ? (
              <View style={s.row}>
                <Text style={s.label}>{t('more.vin')}</Text>
                <Text style={s.value}>{truck.vin}</Text>
              </View>
            ) : null}
            <View style={s.row}>
              <Text style={s.label}>{t('more.status')}</Text>
              <Text style={[s.value, { color: isOff ? '#9CA3AF' : '#10B981' }]}>
                {driver?.status ?? '—'}
              </Text>
            </View>
          </View>

          <Text style={s.section}>{t('more.availability')}</Text>
          <View style={s.card}>
            <Text style={s.itemSub}>
              {isOff
                ? t('more.offDuty')
                : t('more.onDuty')}
            </Text>
            <TouchableOpacity
              style={[s.toggle, isOff ? s.toggleOn : s.toggleOff, { marginTop: 14 }]}
              disabled={toggleOff.isPending}
              onPress={() => toggleOff.mutate()}
            >
              <Text style={isOff ? s.toggleOnText : s.toggleOffText}>
                {toggleOff.isPending ? '...' : isOff ? t('more.goOn') : t('more.goOff')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.section}>{t('more.pay')}</Text>
          <TouchableOpacity style={[s.card, { marginBottom: 20 }]} onPress={() => router.push('/pay')}>
            <Text style={s.itemTitle}>{t('more.payTitle')}</Text>
            <Text style={s.itemSub}>{t('more.paySub')}</Text>
          </TouchableOpacity>

          {emergency ? (
            <>
              <Text style={s.section}>{t('more.emergency')}</Text>
              <TouchableOpacity style={s.sos} onPress={callSupport}>
                <Text style={s.sosText}>{t('more.callDispatch')}</Text>
                <Text style={s.sosSub}>{emergency}</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {svc.length > 0 && (
            <>
              <Text style={s.section}>{t('more.services')}</Text>
              <View style={s.card}>
                {svc.map((item: any, i: number) => {
                  const soon = item.status && item.status !== 'live';
                  return (
                    <TouchableOpacity
                      key={item.handle ?? i}
                      style={[s.item, i === svc.length - 1 && s.itemLast]}
                      disabled={soon}
                      onPress={() => openService(item)}
                    >
                      <Text style={[s.itemTitle, soon && { color: '#6B7280' }]}>{item.name}</Text>
                      {item.description ? <Text style={s.itemSub}>{item.description}</Text> : null}
                      {soon ? <Text style={s.soon}>{t('more.comingSoon')}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={s.section}>{t('more.announcements')}</Text>
          <View style={s.card}>
            {anns.length === 0 ? (
              <Text style={s.empty}>{t('more.nothingNew')}</Text>
            ) : (
              anns.map((a: any, i: number) => (
                <View key={a.id ?? i} style={[s.ann, i === anns.length - 1 && s.itemLast]}>
                  {a.title ? <Text style={s.annTitle}>{a.title}</Text> : null}
                  <Text style={s.annBody}>{a.body ?? a.message ?? a.text}</Text>
                  {(a.publishedAt ?? a.created_at) ? (
                    <Text style={s.annDate}>
                      {new Date(a.publishedAt ?? a.created_at).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>

          <Text style={s.section}>{t('more.language')}</Text>
          <View style={s.card}>
            {LANGUAGES.map((lang, i) => {
              const on = i18n.language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[s.item, i === LANGUAGES.length - 1 && s.itemLast]}
                  onPress={async () => {
                    await setLanguage(lang.code);
                    setDriverLanguage(lang.code).catch(() => {});
                    qc.invalidateQueries();
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[s.itemTitle, on && { color: '#F59E0B', fontWeight: '700' }]}>
                      {lang.label}
                    </Text>
                    {on ? <Text style={{ color: '#F59E0B', fontSize: 16 }}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={s.out} onPress={signOut}>
            <Text style={s.outText}>{t('more.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
