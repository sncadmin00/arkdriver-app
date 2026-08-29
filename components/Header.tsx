import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { fetchProfile, fetchLoads, fetchLoadDetail } from '@/lib/api';
import Logo from './Logo';

const s = StyleSheet.create({
  bar: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { paddingRight: 12 },
  middle: { flex: 1, alignItems: 'center' },
  clock: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  date: { color: '#6B7280', fontSize: 11, marginTop: 2 },
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

export default function Header() {
  const router = useRouter();
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const { data } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const { data: loads } = useQuery({ queryKey: ['loads', 'active'], queryFn: () => fetchLoads() });

  const activeId = loads?.[0]?.id;
  const { data: detail } = useQuery({
    queryKey: ['load', activeId, 'plain'],
    queryFn: () => fetchLoadDetail(activeId),
    enabled: !!activeId,
  });

  const driver = data?.driver;
  const comp = data?.compliance;
  const chatUnread = data?.chat?.unread ?? 0;
  const unread = chatUnread > 0 || (comp?.gaps ?? 0) + (comp?.expiringSoon ?? 0) > 0;

  const stops = detail?.stops ?? [];
  const next = stops.find((x) => x.current) ?? stops.find((x) => !x.complete);
  const tz = next?.timezone;

  let zoneShort = null;
  if (tz) {
    try {
      zoneShort = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? null;
    } catch {}
  }

  // Appointment times are wall-clock in the stop's own zone,
  // so compare them against "now" as seen in that same zone.
  let appt = null;
  if (next?.date) {
    const timeStr = next.time || '00:00';
    const target = new Date(`${next.date}T${timeStr}:00`);
    if (!isNaN(target)) {
      let nowThere = now;
      if (tz) {
        try { nowThere = new Date(now.toLocaleString('en-US', { timeZone: tz })); } catch {}
      }
      const diffMin = Math.round((target - nowThere) / 60000);
      const abs = Math.abs(diffMin);
      const h = Math.floor(abs / 60);
      const m = abs % 60;
      const span = h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;

      appt = {
        kind: next.kind === 'pickup' ? t('home.pickupShort') : t('home.deliveryShort'),
        text: abs < 5 ? t('home.apptNow') : diffMin > 0 ? t('home.apptIn', { time: span }) : t('home.apptLate', { time: span }),
        late: diffMin < -5,
        clock: `${timeStr}${zoneShort ? ` ${zoneShort}` : ''}`,
      };
    }
  }

  return (
    <View style={s.bar}>
      <View style={s.left}>
        <Logo />
      </View>

      <View style={s.middle}>
        {appt ? (
          <>
            <Text style={[s.clock, appt.late && { color: '#EF4444' }]} numberOfLines={1}>
              {appt.kind} {appt.text}
            </Text>
            <Text style={s.date}>{appt.clock}</Text>
          </>
        ) : (
          <Text style={s.date}>
            {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        )}
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
