import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

const s = StyleSheet.create({
  wrap: { marginTop: 12 },
  row: { backgroundColor: '#1F2937', borderRadius: 10, padding: 13, marginBottom: 8, borderColor: '#374151', borderWidth: 1 },
  rowOn: { borderColor: '#F59E0B', borderWidth: 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  total: { color: '#F59E0B', fontSize: 15, fontWeight: '700' },
  meta: { color: '#9CA3AF', fontSize: 12, marginTop: 5 },
  note: { color: '#EAB308', fontSize: 11, marginTop: 5, lineHeight: 15 },
  same: { color: '#6B7280', fontSize: 11, marginTop: 5 },
});

const money = (n) =>
  typeof n === 'number' ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—';

const LABEL = { fastest: 'fastest', no_toll: 'noToll', cheapest: 'cheapest' };

export default function RouteOptions({ options, selected, onSelect }) {
  const { t } = useTranslation();
  if (!options?.length || options.length < 2) return null;

  // Drop an option whose numbers duplicate an earlier one (HERE often makes
  // "cheapest" identical to another route). Keep the first, more meaningful name.
  const seen = new Set();
  const shown = options.filter((o) => {
    const sig = `${o.miles}-${o.estimatedTollsUsd}-${o.estimatedTotalUsd}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
  if (shown.length < 2) return null;

  return (
    <View style={s.wrap}>
      {shown.map((o) => {
        const key = o.kind ?? o.key ?? o.type;
        const on = selected === key;
        return (
          <TouchableOpacity
            key={key}
            style={[s.row, on && s.rowOn]}
            onPress={() => onSelect(key)}
            activeOpacity={0.8}
          >
            <View style={s.top}>
              <Text style={s.name}>{LABEL[key] ? t(`map.${LABEL[key]}`) : o.label ?? key}</Text>
              <Text style={s.total}>{money(o.estimatedTotalUsd ?? o.total)}</Text>
            </View>
            <Text style={s.meta}>
              {o.miles} mi
              {o.minutes ? ` · ${t('map.minutes', { count: Math.round(o.minutes) })}` : ''}
              {' · '}{t('map.tolls')} {money(o.estimatedTollsUsd)}
              {o.estimatedFuelUsd != null ? ` · ${t('map.fuel')} ${money(o.estimatedFuelUsd)}` : ''}
              {o.extraMiles ? ` · ${t('map.extraMiles', { miles: o.extraMiles })}` : ''}
            </Text>
            {key === 'no_toll' && o.tollFree === false ? (
              <Text style={s.note}>{t('map.notTollFree')}</Text>
            ) : null}
            {o.sameAsFastest ? (
              <Text style={s.same}>{t('map.sameAs', { option: t('map.fastest') })}</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
