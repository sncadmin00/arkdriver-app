import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchProfile } from '@/lib/api';

const s = StyleSheet.create({
  bar: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flex: 1, paddingRight: 12 },
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
  const router = useRouter();
  const { data } = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const driver = data?.driver;
  const comp = data?.compliance;
  const unread = (comp?.gaps ?? 0) + (comp?.expiringSoon ?? 0) > 0;

  return (
    <View style={s.bar}>
      <View style={s.left}>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={s.sub} numberOfLines={1}>{subtitle}</Text> : null}
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
