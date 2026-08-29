import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchProfile, fetchLoads, fetchLoadDetail } from '@/lib/api';
import Logo from './Logo';

const s = StyleSheet.create({
  bar: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { paddingRight: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  logoA: { color: '#FFFFFF', fontSize: 21, fontWeight: '300', letterSpacing: 2 },
  tri: {
    width: 0, height: 0, backgroundColor: 'transparent',
    borderLeftWidth: 3.5, borderRightWidth: 3.5, borderBottomWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#F59E0B',
    position: 'absolute', left: 5.5, bottom: 1,
  },
  logo: { color: '#FFFFFF', fontSize: 21, fontWeight: '300', letterSpacing: 2 },
  logoSub: { color: '#9CA3AF', fontSize: 12, fontWeight: '400', marginLeft: 6, letterSpacing: 0.5 },
  middle: { flex: 1, alignItems: 'center' },
  clock: { color: '#E5E7EB', fontSize: 15, fontWeight: '600' },
  date: { color: '#6B7280', fontSize: 11, marginTop: 1 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold' },
  sub: { color: '#9CA3AF', fontSize: 12, marginTop: 3 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bell: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  bellText: { fontSize: 20 },
  dot: { position: 'absolute', top: 4, right: 4, width: 9, height: 9, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#1F2937' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', borderColor: '#F59E0B', borderWidth: 1 },
  initials: { color: '#F59E0B', fontSize: 15, fontWeight: '700' },
});

function initials(name) {
  if (!name) return '·';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function Header({ title, subtitle }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: loads } = useQuery({ queryKey: ['loads', 'active'], queryFn: () => fetchLoads() });
  const activeId = loads?.[0]?.id;
  const { data: detail } = useQuery({
    queryKey: ['load', activeId, 'plain'],
    queryFn: () => fetchLoadDetail(activeId),
    enabled: !!activeId,
  });

  const stops = detail?.stops ?? [];
  const next = stops.find((x) => x.current) ?? stops.find((x) => !x.complete);
  const tz = next?.timezone;

  const zoneLabel = (() => {
    if (!tz) return null;
    try {
      return new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? null;
    } catch {
      return null;
    }
  })();

  const clockText = (() => {
    try {
      return now.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit',
        ...(tz ? { timeZone: tz } : {}),
      });
    } catch {
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  })();
  const driver = data?.driver;
  const comp = data?.compliance;
  const unread = (comp?.gaps ?? 0) + (comp?.expiringSoon ?? 0) > 0;

  return (
    <View style={s.bar}>
      <View style={s.left}>
        <Logo />
        {title ? <Text style={s.title} numberOfLines={1}>{title}</Text> : null}
        {subtitle ? <Text style={s.sub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      <View style={s.middle}>
        <Text style={s.clock}>
          {clockText}{zoneLabel ? ` ${zoneLabel}` : ''}
        </Text>
        <Text style={s.date}>
          {tz
            ? String(next?.address ?? '').split('\n').slice(-1)[0].split(',')[0]
            : now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
      </View>
      <View style={s.right}>
        <TouchableOpacity style={s.bell} onPress={() => router.push('/notifications')} hitSlop={8}>
          <Text style={s.bellText}>🔔</Text>
          {unread ? <View style={s.dot} /> : null}
        </TouchableOpacity>
        <TouchableOpacity style={s.avatar} onPress={() => router.push('/account')} hitSlop={8}>
          <Text style={s.initials}>{initials(driver?.driverName)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
