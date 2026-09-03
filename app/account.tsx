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
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 10 },
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
  dutyBtn: { borderColor: '#F59E0B', borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  dutyBtnOn: { borderColor: '#10B981', backgroundColor: '#10B98115' },
  dutyText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  dutyTextOn: { color: '#10B981' },
  reportLoud: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 17, alignItems: 'center' },
  reportLoudText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  callQuiet: { borderColor: '#4B5563', borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  callQuietText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  item: { paddingVertical: 14, borderBottomColor: '#374151', borderBottomWidth: 1 },
  itemLast: { borderBottomWidth: 0 },
  itemTitle: { color: '#E5E7EB', fontSize: 15, fontWeight: '500' },
  itemSub: { color: '#6B7280', fontSize: 12, marginTop: 3, lineHeight: 17 },
  soon: { color: '#6B7280', fontSize: 10, fontWeight: '700', marginTop: 4 },
  report: { borderColor: '#DC2626', borderWidth: 1, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  reportText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  sos: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 17, alignItems: 'center', marginBottom: 20 },
  sosText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sosSub: { color: '#FCA5A5', fontSize: 12, marginTop: 3 },
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

  const profileData = profile;
  const driver = profile?.driver;
  const truck = profile?.truck;
  const carrier = profileData?.carrier;
  const emergency = profile?.support?.emergencyPhone;
  const isOff = driver?.status === 'off';

  const list = (v: any) => (Array.isArray(v) ? v : v?.services ?? v?.announcements ?? v?.items ?? []);
  const svc = list(services);
  const anns = list(announcements);


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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={s.title}>{t('home.account')}</Text>
        </View>

        <View style={s.body}>
          <Text style={s.section}>{t('more.profile')}</Text>
          <View style={s.card}>
            <Text style={s.name}>{driver?.driverName ?? '—'}</Text>
            <Text style={s.sub}>{driver?.email}</Text>
            <View style={s.divider} />

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
            <TouchableOpacity
              style={[s.dutyBtn, isOff && s.dutyBtnOn]}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={[s.dutyText, isOff && s.dutyTextOn]}>
                {isOff ? t('home.backOn') : t('home.setOff')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.section}>{t('home.work')}</Text>
          <View style={[s.card, { marginBottom: 20 }]}>

            <TouchableOpacity style={[s.item, s.itemLast]} onPress={() => router.push('/compliance')}>
              <Text style={s.itemTitle}>{t('more.compliance')}</Text>
              <Text style={s.itemSub}>{t('more.complianceSub')}</Text>
            </TouchableOpacity>
          </View>

          {emergency ? (
            <>
              <Text style={s.section}>{t('more.emergency')}</Text>
              <TouchableOpacity style={s.reportLoud} onPress={() => router.push('/report')}>
                <Text style={s.reportLoudText}>{t('home.reportIncident')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.callQuiet} onPress={callSupport}>
                <Text style={s.callQuietText}>{t('more.callDispatch')} · {emergency}</Text>
              </TouchableOpacity>
            </>
          ) : null}

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

          {carrier ? (
            <>
              <Text style={s.section}>CARRIER</Text>
              <View style={s.card}>
                {carrier.legalName ? <Text style={s.itemTitle}>{carrier.legalName}</Text> : null}
                {(carrier.mc || carrier.dot) ? (
                  <Text style={[s.itemSub, { marginTop: 6 }]}>
                    {[carrier.mc ? `MC ${carrier.mc}` : null, carrier.dot ? `DOT ${carrier.dot}` : null]
                      .filter(Boolean).join('  ·  ')}
                  </Text>
                ) : null}
                {carrier.address ? <Text style={s.itemSub}>{carrier.address}</Text> : null}
                {carrier.phone ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${String(carrier.phone).replace(/[^\d+]/g, '')}`)}>
                    <Text style={[s.itemSub, { color: '#F59E0B', marginTop: 6 }]}>{carrier.phone}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          ) : null}

          <TouchableOpacity style={s.out} onPress={signOut}>
            <Text style={s.outText}>{t('more.signOut')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
