import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import MapView, { Marker, Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { fetchLoadDetail } from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  back: { color: '#F59E0B', fontSize: 15, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  toggle: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12 },
  tab: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  tabOn: { backgroundColor: '#F59E0B' },
  tabText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  tabOnText: { color: '#0B0F14' },
  map: { flex: 1 },
  pin: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  pinText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  footer: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingVertical: 14, borderTopColor: '#374151', borderTopWidth: 1 },
  footHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  footLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  footAddr: { color: '#E5E7EB', fontSize: 14, lineHeight: 20 },
  miles: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderBottomColor: '#374151', borderBottomWidth: 1 },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  dotText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  stopKind: { color: '#6B7280', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  stopAddr: { color: '#E5E7EB', fontSize: 13, lineHeight: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F14' },
  err: { color: '#EF4444', fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
});

const COLOR = { done: '#10B981', current: '#F59E0B', future: '#6B7280' };

function stopColor(stop) {
  if (stop.complete) return COLOR.done;
  if (stop.current) return COLOR.current;
  return COLOR.future;
}

function fitRegion(points) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.05),
  };
}

function clean(a) {
  return String(a ?? '').split('\n').join(', ');
}

export default function TripMap() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const map = useRef(null);
  const [mode, setMode] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['load', id],
    queryFn: () => fetchLoadDetail(id),
    enabled: !!id,
  });

  const load = data?.load ?? data;
  const stops = data?.stops ?? load?.stops ?? [];
  const located = stops.filter((x) => typeof x.lat === 'number' && typeof x.lng === 'number');
  const next = located.find((x) => x.current) ?? located.find((x) => !x.complete);
  const view = mode ?? 'trip';

  const routed = (() => {
    const enc = load?.route?.polyline;
    if (!enc) return null;
    try {
      return polyline.decode(enc).map(([latitude, longitude]) => ({ latitude, longitude }));
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (mode === null && load?.mapMode) setMode(load.mapMode === 'next_stop' ? 'next' : 'trip');
  }, [load?.mapMode]);

  useEffect(() => {
    if (!map.current || !located.length) return;
    const target =
      view === 'next' && next
        ? { latitude: next.lat, longitude: next.lng, latitudeDelta: 0.12, longitudeDelta: 0.12 }
        : fitRegion(located.map((x) => ({ lat: x.lat, lng: x.lng })));
    map.current.animateToRegion(target, 500);
  }, [view, located.length]);

  function focus(stop) {
    map.current?.animateToRegion(
      { latitude: stop.lat, longitude: stop.lng, latitudeDelta: 0.15, longitudeDelta: 0.15 },
      500
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}><ActivityIndicator color="#F59E0B" size="large" /></View>
      </SafeAreaView>
    );
  }

  if (error || !located.length) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.bar}>
          <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← {t('common.back')}</Text></TouchableOpacity>
          <Text style={s.title}>{id}</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={s.center}>
          <Text style={s.err}>{error ? error.message : t('map.noCoords')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.bar}>
        <TouchableOpacity onPress={() => router.back()}><Text style={s.back}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={s.title}>{id}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={s.toggle}>
        <TouchableOpacity style={[s.tab, view === 'trip' && s.tabOn]} onPress={() => setMode('trip')}>
          <Text style={[s.tabText, view === 'trip' && s.tabOnText]}>{t('map.wholeTrip')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, view === 'next' && s.tabOn, !next && { opacity: 0.4 }]}
          disabled={!next}
          onPress={() => setMode('next')}
        >
          <Text style={[s.tabText, view === 'next' && s.tabOnText]}>{t('map.nextStop')}</Text>
        </TouchableOpacity>
      </View>

      <MapView
        ref={map}
        style={s.map}
        initialRegion={fitRegion(located.map((x) => ({ lat: x.lat, lng: x.lng })))}
        showsUserLocation
        showsMyLocationButton
      >
        <Polyline
          coordinates={routed ?? located.map((x) => ({ latitude: x.lat, longitude: x.lng }))}
          strokeColor="#F59E0B"
          strokeWidth={routed ? 4 : 3}
          lineDashPattern={routed ? undefined : [8, 6]}
        />
        {located.map((stop, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={`${(stop.index ?? i) + 1} · ${String(stop.kind ?? '').toUpperCase()}`}
            description={clean(stop.address)}
          >
            <View style={[s.pin, { backgroundColor: stopColor(stop) }]}>
              <Text style={s.pinText}>{(stop.index ?? i) + 1}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={s.footer}>
        <View style={s.footHead}>
          <Text style={s.footLabel}>
            {view === 'trip' ? t('load.allStops') : next ? t('map.next', { kind: String(next.kind ?? '').toUpperCase() }) : t('common.done')}
          </Text>
          {load?.miles ? (
            <Text style={s.miles}>{load.miles} mi{routed ? '' : ` · ${t('map.overview')}`}</Text>
          ) : null}
        </View>

        {view === 'trip' ? (
          <ScrollView style={{ maxHeight: 170 }} showsVerticalScrollIndicator={false}>
            {stops.map((stop, i) => {
              const has = typeof stop.lat === 'number' && typeof stop.lng === 'number';
              return (
                <TouchableOpacity key={i} style={s.stopRow} disabled={!has} onPress={() => focus(stop)}>
                  <View style={[s.dot, { backgroundColor: stopColor(stop) }]}>
                    <Text style={s.dotText}>{(stop.index ?? i) + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.stopKind}>{String(stop.kind ?? '').toUpperCase()}</Text>
                    <Text style={[s.stopAddr, !has && { color: '#4B5563' }]} numberOfLines={2}>
                      {clean(stop.address)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : next ? (
          <>
            <Text style={s.footAddr}>{clean(next.address)}</Text>
            {next.date ? <Text style={[s.stopKind, { marginTop: 6 }]}>{next.date} {next.time ?? ''}</Text> : null}
          </>
        ) : (
          <Text style={s.footAddr}>{t('load.allComplete')}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
