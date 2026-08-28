import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MapView, { Marker, Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import * as Location from 'expo-location';
import { Linking, Modal } from 'react-native';
import { mapRoute, mapSuggest, fetchPlaces, savePlace } from '@/lib/api';
import RouteOptions from '@/components/RouteOptions';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 12 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  search: { backgroundColor: '#0B0F14', borderColor: '#374151', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#FFFFFF', fontSize: 16 },
  modes: { flexDirection: 'row', marginTop: 10 },
  mode: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: '#374151', marginRight: 8 },
  modeOn: { backgroundColor: '#F59E0B' },
  modeText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  modeOnText: { color: '#0B0F14' },
  sheet: { backgroundColor: '#0B0F14', maxHeight: 300 },
  row: { paddingHorizontal: 20, paddingVertical: 13, borderBottomColor: '#1F2937', borderBottomWidth: 1 },
  rowTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  rowSub: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  section: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  empty: { color: '#6B7280', fontSize: 13, paddingHorizontal: 20, paddingVertical: 14 },
  map: { flex: 1 },
  pin: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F59E0B', borderWidth: 2, borderColor: '#FFFFFF' },
  footer: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingVertical: 14, borderTopColor: '#374151', borderTopWidth: 1 },
  fTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  fAddr: { color: '#E5E7EB', fontSize: 14, flex: 1, paddingRight: 12, lineHeight: 19 },
  fMiles: { color: '#F59E0B', fontSize: 16, fontWeight: '700' },
  fMeta: { color: '#6B7280', fontSize: 11, marginTop: 2, textAlign: 'right' },
  warn: { color: '#EAB308', fontSize: 12, marginTop: 10, lineHeight: 17 },
  warnCrit: { color: '#EF4444', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', borderColor: '#F59E0B', borderWidth: 1 },
  btnText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F14' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, maxHeight: 280, backgroundColor: '#0B0F14EE' },
  overlayBusy: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F1499' },
  hint: { color: '#6B7280', fontSize: 12, paddingHorizontal: 20, paddingBottom: 10 },
  sheetWrap: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheetBox: { backgroundColor: '#1F2937', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 36 },
  sheetTitle: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomColor: '#374151', borderBottomWidth: 1 },
  sheetName: { color: '#FFFFFF', fontSize: 16, flex: 1 },
  sheetTag: { color: '#10B981', fontSize: 9, fontWeight: '700', backgroundColor: '#10B98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sheetTagCar: { color: '#EAB308', backgroundColor: '#EAB30820' },
  sheetCancel: { paddingVertical: 15, alignItems: 'center', marginTop: 6 },
});

function decode(enc) {
  try {
    return polyline.decode(enc).map(([latitude, longitude]) => ({ latitude, longitude }));
  } catch {
    return null;
  }
}

function fit(points) {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.05),
  };
}

export default function TruckMap() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const map = useRef(null);
  const timer = useRef(null);

  const [q, setQ] = useState('');
  const [mode, setMode] = useState('truck');
  const modeRef = useRef('truck');
  const [suggest, setSuggest] = useState([]);
  const [searching, setSearching] = useState(false);
  const [routing, setRouting] = useState(false);
  const [result, setResult] = useState(null);
  const [here, setHere] = useState(null);
  const [navApps, setNavApps] = useState(null);
  const [picked, setPicked] = useState('fastest');
  const [showOptions, setShowOptions] = useState(false);

  const places = useQuery({ queryKey: ['places'], queryFn: fetchPlaces });
  const saved = places.data?.places ?? places.data ?? [];

  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) return setSuggest([]);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await mapSuggest(q.trim(), here ?? undefined);
        setSuggest(res?.results ?? []);
      } catch {
        setSuggest([]);
      }
      setSearching(false);
    }, 250);
    return () => timer.current && clearTimeout(timer.current);
  }, [q, here]);

  const [lastDest, setLastDest] = useState(null);

  async function route(dest, label) {
    setLastDest({ dest, label });
    Keyboard.dismiss();
    setSuggest([]);
    setRouting(true);
    try {
      const res = await mapRoute({
        destination: dest,
        ...(here ? { origin: here } : {}),
        mode: modeRef.current,
      });
      setPicked('fastest');
      const line = decode(res?.route?.polyline);
      setResult({ ...res, line, label });
      if (line?.length) setTimeout(() => map.current?.animateToRegion(fit(line), 600), 100);
    } catch (e) {
      Alert.alert(
        e?.code === 'no_origin' || String(e.message).includes('no_origin')
          ? t('truckmap.noOrigin')
          : t('common.error'),
        e.message
      );
    } finally {
      setRouting(false);
    }
  }

  function pick(item) {
    setQ('');
    setSuggest([]);
    const dest = item.lat != null && item.lng != null
      ? { lat: item.lat, lng: item.lng }
      : item.address;
    route(dest, item.title ?? item.address);
  }

  async function store() {
    const dest = result?.destination;
    if (!dest) return;
    Alert.prompt?.(
      t('truckmap.savePlace'),
      t('truckmap.saveHint'),
      async (label) => {
        if (!label?.trim()) return;
        try {
          await savePlace({
            label: label.trim(),
            address: typeof dest === 'string' ? dest : (result.label ?? ''),
            mode,
            ...(typeof dest === 'object' ? { lat: dest.lat, lng: dest.lng } : {}),
          });
          qc.invalidateQueries({ queryKey: ['places'] });
        } catch (e) {
          Alert.alert(t('common.error'), e.message);
        }
      }
    );
  }

  const opts = result?.routeOptions ?? [];
  const active = opts.find((o) => (o.kind ?? o.key ?? o.type) === picked) ?? result?.route;
  const line = active?.polyline ? decode(active.polyline) : line;
  const r = active ?? result?.route;
  const warnings = r?.warnings ?? [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← {t('more.title')}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t('truckmap.title')}</Text>
        <TextInput
          style={s.search}
          placeholder={t('truckmap.search')}
          placeholderTextColor="#6B7280"
          value={q}
          onChangeText={setQ}
          returnKeyType="search"
          onSubmitEditing={() => q.trim().length > 2 && route(q.trim(), q.trim())}
        />
        <View style={s.modes}>
          <TouchableOpacity
            style={[s.mode, mode === 'truck' && s.modeOn]}
            onPress={() => { modeRef.current = 'truck'; setMode('truck'); if (lastDest) setTimeout(() => route(lastDest.dest, lastDest.label), 0); }}
          >
            <Text style={[s.modeText, mode === 'truck' && s.modeOnText]}>{t('truckmap.modeTruck')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.mode, mode === 'bobtail' && s.modeOn]}
            onPress={() => { modeRef.current = 'bobtail'; setMode('bobtail'); if (lastDest) setTimeout(() => route(lastDest.dest, lastDest.label), 0); }}
          >
            <Text style={[s.modeText, mode === 'bobtail' && s.modeOnText]}>{t('truckmap.modeBobtail')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <MapView
          ref={map}
          style={s.map}
          initialRegion={
            line?.length
              ? fit(line)
              : here
              ? { latitude: here.lat, longitude: here.lng, latitudeDelta: 0.4, longitudeDelta: 0.4 }
              : { latitude: 39.95, longitude: -75.16, latitudeDelta: 3, longitudeDelta: 3 }
          }
          showsUserLocation
          showsMyLocationButton
        >
          {line?.length ? (
            <>
              <Polyline coordinates={line} strokeColor="#F59E0B" strokeWidth={4} />
              <Marker coordinate={line[line.length - 1]}>
                <View style={s.pin} />
              </Marker>
            </>
          ) : null}
        </MapView>

        {routing ? (
          <View style={s.overlayBusy}>
            <ActivityIndicator color="#F59E0B" size="large" />
          </View>
        ) : null}

        {(suggest.length > 0 || searching) ? (
          <View style={s.overlay}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {searching ? <Text style={s.empty}>{t('truckmap.searching')}</Text> : null}
              {suggest.map((item, i) => (
                <TouchableOpacity key={i} style={s.row} onPress={() => pick(item)}>
                  <Text style={s.rowTitle}>{item.title}</Text>
                  {item.address ? <Text style={s.rowSub}>{item.address}</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : !result && saved.length ? (
          <View style={s.overlay}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={s.section}>{t('truckmap.saved')}</Text>
              {saved.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={s.row}
                  onPress={() => route(p.lat != null ? { lat: p.lat, lng: p.lng } : p.address, p.label)}
                >
                  <Text style={s.rowTitle}>{p.label}</Text>
                  <Text style={s.rowSub}>{p.address}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {line?.length ? (
        <View style={s.footer}>
          <View style={s.fTop}>
            <Text style={s.fAddr} numberOfLines={2}>{result.label}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.fMiles}>{t('truckmap.distance', { miles: r?.miles })}</Text>
              <Text style={s.fMeta}>
                {r?.provider === 'here' ? t('map.truckRoute') : t('map.roadRoute')}
                {r?.estimatedTollsUsd ? ` · $${r.estimatedTollsUsd.toFixed(2)}` : ''}
              </Text>
            </View>
          </View>

          {opts.length > 1 ? (
            <TouchableOpacity onPress={() => setShowOptions((v) => !v)}>
              <Text style={[s.btnText, { marginTop: 12 }]}>
                {showOptions ? t('map.hideCompare') : t('map.compare')}
              </Text>
            </TouchableOpacity>
          ) : null}

          {showOptions ? (
            <RouteOptions options={opts} selected={picked} onSelect={setPicked} />
          ) : null}

          {warnings.map((w, i) => (
            <Text key={i} style={[s.warn, w.severity === 'critical' && s.warnCrit]}>
              {w.severity === 'critical' ? '⚠ ' : ''}{w.title}
            </Text>
          ))}

          <View style={s.actions}>
            <TouchableOpacity style={s.btn} onPress={store}>
              <Text style={s.btnText}>{t('truckmap.savePlace')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
              onPress={() => setNavApps(result?.target?.apps ?? [])}
            >
              <Text style={[s.btnText, { color: '#0B0F14', fontWeight: '700' }]}>{t('load.navigate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={() => { setResult(null); setQ(''); }}>
              <Text style={s.btnText}>{t('truckmap.clear')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      <Modal visible={!!navApps?.length} transparent animationType="fade" onRequestClose={() => setNavApps(null)}>
        <View style={s.sheetWrap}>
          <View style={s.sheetBox}>
            <Text style={s.sheetTitle}>{t('load.openIn')}</Text>
            {(navApps ?? []).filter((a) => !a.internal).map((app) => (
              <TouchableOpacity
                key={app.key}
                style={s.sheetItem}
                onPress={async () => {
                  setNavApps(null);
                  const go = async () => {
                    if (app.deepLink) {
                      const ok = await Linking.canOpenURL(app.deepLink).catch(() => false);
                      if (ok) return Linking.openURL(app.deepLink);
                    }
                    if (app.fallback) Linking.openURL(app.fallback);
                  };
                  if (!app.truckAware) {
                    return Alert.alert(
                      t('load.notTruck'),
                      t('load.notTruckBody', { app: app.name }),
                      [
                        { text: t('common.cancel'), style: 'cancel' },
                        { text: t('load.openAnyway'), onPress: go },
                      ]
                    );
                  }
                  go();
                }}
              >
                <Text style={s.sheetName}>{app.name}</Text>
                <Text style={[s.sheetTag, !app.truckAware && s.sheetTagCar]}>
                  {app.truckAware ? t('load.truckBadge') : t('load.carBadge')}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.sheetCancel} onPress={() => setNavApps(null)}>
              <Text style={s.btnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
