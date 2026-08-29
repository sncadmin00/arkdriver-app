import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { readMap, markRead, visible } from '@/lib/announcements';
import { useQuery } from '@tanstack/react-query';
import { fetchCompliance, fetchTruckDocuments, fetchAnnouncements } from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 14 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  body: { padding: 20, paddingBottom: 40 },
  section: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 10, marginTop: 16 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, borderColor: '#374151', borderWidth: 1, overflow: 'hidden' },
  row: { padding: 15, borderBottomColor: '#374151', borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  last: { borderBottomWidth: 0 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  label: { color: '#E5E7EB', fontSize: 14, flex: 1, paddingRight: 10 },
  state: { fontSize: 12, fontWeight: '600' },
  annTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: '600', flex: 1 },
  annHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pin: { fontSize: 12 },
  annDate: { color: '#6B7280', fontSize: 11 },
  annFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, width: '100%' },
  newDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F59E0B' },
  annBody: { color: '#9CA3AF', fontSize: 13, marginTop: 4, lineHeight: 18 },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 50, fontSize: 14 },
  link: { color: '#F59E0B', fontWeight: '600', fontSize: 14, textAlign: 'center', paddingVertical: 14 },
});

const COLOR = { expired: '#EF4444', soon: '#EAB308', missing: '#6B7280' };
const SEVERITY = { info: '#9CA3AF', warning: '#EAB308', critical: '#EF4444' };

export default function Notifications() {
  const router = useRouter();
  const { t } = useTranslation();

  const dq = useQuery({ queryKey: ['compliance'], queryFn: fetchCompliance });
  const truck = useQuery({ queryKey: ['truck-documents'], queryFn: fetchTruckDocuments });
  const ann = useQuery({ queryKey: ['announcements'], queryFn: fetchAnnouncements });

  const slots = [
    ...(dq.data?.slots ?? []),
    ...(truck.data?.slots ?? []),
  ].filter((x) => x.required !== false && ['expired', 'soon', 'missing'].includes(x.state));

  const all = ann.data?.announcements ?? (Array.isArray(ann.data) ? ann.data : []);
  // Pinned first, then newest — the office pins what must not be missed.
  const anns = visible([...all].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)), readAt).slice(0, 10);
  const nothing = !slots.length && !anns.length;

  const [readAt, setReadAt] = useState({});
  const [open, setOpen] = useState(null);

  useEffect(() => {
    readMap().then(setReadAt);
  }, []);

  async function toggle(a) {
    setOpen((cur) => (cur === a.id ? null : a.id));
    if (!readAt[a.id]) setReadAt(await markRead(a.id));
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t('notifications.title')}</Text>
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.body}>
        {nothing ? <Text style={s.empty}>{t('notifications.empty')}</Text> : null}

        {slots.length ? (
          <>
            <Text style={[s.section, { marginTop: 0 }]}>{t('notifications.docs')}</Text>
            <View style={s.card}>
              {slots.map((x, i) => (
                <View key={x.key} style={[s.row, i === slots.length - 1 && s.last]}>
                  <View style={[s.dot, { backgroundColor: COLOR[x.state] ?? '#6B7280' }]} />
                  <Text style={s.label}>{x.label}</Text>
                  <Text style={[s.state, { color: COLOR[x.state] ?? '#6B7280' }]}>
                    {x.state === 'soon' && typeof x.daysUntilExpiry === 'number'
                      ? t('notifications.expiring', { count: x.daysUntilExpiry })
                      : x.stateLabel ?? t(`notifications.${x.state}`)}
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/compliance')}>
              <Text style={s.link}>{t('notifications.viewDocs')}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {anns.length ? (
          <>
            <Text style={s.section}>{t('notifications.announcements')}</Text>
            <View style={s.card}>
              {anns.map((a, i) => {
                const tone = SEVERITY[a.severity] ?? SEVERITY.info;
                return (
                  <TouchableOpacity
                    key={a.id ?? i}
                    activeOpacity={0.7}
                    onPress={() => toggle(a)}
                    style={[
                      s.row,
                      { flexDirection: 'column', alignItems: 'flex-start' },
                      i === anns.length - 1 && s.last,
                      a.severity && a.severity !== 'info' ? { borderLeftColor: tone, borderLeftWidth: 3 } : null,
                    ]}
                  >
                    <View style={s.annHead}>
                      {a.pinned ? <Text style={s.pin}>📌</Text> : null}
                      {a.title ? (
                        <Text style={[s.annTitle, a.severity !== 'info' && { color: tone }]}>{a.title}</Text>
                      ) : null}
                    </View>
                    <Text style={s.annBody} numberOfLines={open === a.id ? undefined : 2}>
                      {a.body}
                    </Text>
                    <View style={s.annFoot}>
                      {a.published_at ? (
                        <Text style={s.annDate}>
                          {new Date(a.published_at).toLocaleDateString()}
                        </Text>
                      ) : <View />}
                      {!readAt[a.id] ? <View style={s.newDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
