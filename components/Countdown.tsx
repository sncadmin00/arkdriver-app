import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { countdown, zoneShort } from '@/lib/appointment';

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  pill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  text: { fontSize: 12, fontWeight: '700' },
  clock: { color: '#6B7280', fontSize: 11, marginLeft: 8 },
});

export default function Countdown({ date, time, timezone, kind, showKind = true }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const c = countdown(date, time, timezone, now);
  if (!c) return null;

  const color = c.late ? '#EF4444' : c.due || c.soon ? '#EAB308' : '#10B981';
  const label = c.due
    ? t('home.apptNow')
    : c.late
    ? t('home.apptLate', { time: c.span })
    : t('home.apptIn', { time: c.span });

  const zone = zoneShort(timezone, now);

  return (
    <View style={s.wrap}>
      <View style={[s.pill, { backgroundColor: color + '22' }]}>
        <Text style={[s.text, { color }]}>
          {showKind && kind ? `${kind === 'pickup' ? t('home.pickupShort') : t('home.deliveryShort')} ` : ''}
          {label}
        </Text>
      </View>
      {time ? <Text style={s.clock}>{time}{zone ? ` ${zone}` : ''}</Text> : null}
    </View>
  );
}
