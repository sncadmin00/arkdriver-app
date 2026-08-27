import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLoadDetail, checkInLoad, ApiError } from '@/lib/api';

const FLOW = [
  { key: 'at_pickup', label: 'Arrived at Pickup' },
  { key: 'in_transit', label: 'Start Transit' },
  { key: 'at_delivery', label: 'Arrived at Delivery' },
  { key: 'delivered', label: 'Mark Delivered' },
];

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
  stop: { flexDirection: 'row', marginBottom: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: 12 },
  stopKind: { color: '#6B7280', fontSize: 10, fontWeight: '700', marginBottom: 3 },
  stopAddr: { color: '#E5E7EB', fontSize: 14, lineHeight: 20 },
  stopDate: { color: '#9CA3AF', fontSize: 12, marginTop: 3 },
  arrived: { color: '#10B981', fontSize: 11, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  label: { color: '#9CA3AF', fontSize: 13 },
  value: { color: '#E5E7EB', fontSize: 13, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  link: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  instructions: { color: '#E5E7EB', fontSize: 13, lineHeight: 21 },
  btn: { borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 10, backgroundColor: '#F59E0B' },
  btnDone: { backgroundColor: '#1F2937', borderColor: '#10B981', borderWidth: 1 },
  btnText: { color: '#0B0F14', fontWeight: '700', fontSize: 14 },
  btnDoneText: { color: '#10B981', fontWeight: '600', fontSize: 14 },
  warn: { color: '#EAB308', fontSize: 12, marginBottom: 12, lineHeight: 18 },
  note: { color: '#6B7280', fontSize: 12, marginBottom: 12, lineHeight: 18 },
  err: { color: '#EF4444', fontSize: 13 },
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['load', id],
    queryFn: () => fetchLoadDetail(id!),
    enabled: !!id,
  });

  const load = data?.load ?? data;

  const checkIn = useMutation({
    mutationFn: (status: string) => checkInLoad(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['load', id] });
      qc.invalidateQueries({ queryKey: ['loads'] });
    },
    onError: (e: Error) => {
      const code = e instanceof ApiError ? e.code : undefined;
      if (code === 'pod_required') {
        Alert.alert('POD required', e.message);
      } else {
        Alert.alert('Check-in failed', e.message);
      }
    },
  });

  const doneMap: Record<string, boolean> = {
    at_pickup: !!load?.arrivedPickupAt,
    in_transit: !!load?.arrivedPickupAt && load?.status !== 'at_pickup',
    at_delivery: !!load?.arrivedDeliveryAt,
    delivered: !!load?.deliveredAt,
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Loads</Text>
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

          {load?.driverInstructions ? (
            <>
              <Text style={s.section}>DRIVER INSTRUCTIONS</Text>
              <View style={s.card}>
                <Text style={s.instructions}>{load.driverInstructions}</Text>
              </View>
            </>
          ) : null}

          {Array.isArray(load?.stops) && load.stops.length > 0 && (
            <>
              <Text style={s.section}>STOPS</Text>
              <View style={s.card}>
                {load.stops.map((stop: any, i: number) => (
                  <View key={i} style={s.stop}>
                    <View style={[s.dot, { backgroundColor: stop.kind === 'pickup' ? '#3B82F6' : '#10B981' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.stopKind}>{String(stop.kind ?? '').toUpperCase()}</Text>
                      <Text style={s.stopAddr}>{stop.address}</Text>
                      {stop.date && <Text style={s.stopDate}>{stop.date} {stop.time ?? ''}</Text>}
                      {stop.kind === 'pickup' && load.arrivedPickupAt && (
                        <Text style={s.arrived}>✓ Arrived {new Date(load.arrivedPickupAt).toLocaleString()}</Text>
                      )}
                      {stop.kind !== 'pickup' && load.arrivedDeliveryAt && (
                        <Text style={s.arrived}>✓ Arrived {new Date(load.arrivedDeliveryAt).toLocaleString()}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={s.section}>DETAILS</Text>
          <View style={s.card}>
            <Row label="Miles" value={load?.miles ? `${load.miles} mi` : null} />
            <Row label="Equipment" value={load?.equipmentType?.replace('_', ' ')} />
            <Row label="Commodity" value={load?.commodity} />
            <Row label="Weight" value={load?.weightLbs ? `${load.weightLbs} lbs` : null} />
            <Row label="Customer" value={load?.customer?.name} />
            {load?.customer?.phone ? (
              <View style={s.row}>
                <Text style={s.label}>Phone</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${String(load.customer.phone).replace(/[^\d+]/g, '')}`)}>
                  <Text style={s.link}>{load.customer.phone}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <Row label="Billing" value={load?.selfBill ? 'Self bill' : null} />
            <Row
              label="POD on file"
              value={load?.podOnFile ? 'Yes' : load?.podRequired === false ? 'No (not required)' : 'No'}
            />
          </View>

          <Text style={s.section}>CHECK IN</Text>
          {load?.podRequired && !load?.podOnFile && (
            <Text style={s.warn}>
              POD not uploaded — "Mark Delivered" will be blocked.
              {Array.isArray(load?.requiredDocs) && load.requiredDocs.length > 0
                ? ` Required: ${load.requiredDocs.join(', ').toUpperCase()}.`
                : ''}
            </Text>
          )}
          {load?.podRequired === false && (
            <Text style={s.note}>
              Self-bill load — no POD needed to close it.
              {Array.isArray(load?.recommendedDocs) && load.recommendedDocs.length > 0
                ? ` Recommended: ${load.recommendedDocs.join(', ').toUpperCase()}.`
                : ''}
            </Text>
          )}
          {FLOW.map((st) => {
            const done = doneMap[st.key];
            return (
              <TouchableOpacity
                key={st.key}
                style={[s.btn, done && s.btnDone]}
                disabled={checkIn.isPending}
                onPress={() => checkIn.mutate(st.key)}
              >
                <Text style={done ? s.btnDoneText : s.btnText}>
                  {checkIn.isPending ? '…' : done ? `✓ ${st.label}` : st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
