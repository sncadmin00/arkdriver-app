import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchSettlement, fetchDebts, fetchAccounting, mondayOf, shiftWeek } from '@/lib/api';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 14 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#374151' },
  navOff: { opacity: 0.35 },
  navText: { color: '#E5E7EB', fontSize: 16, fontWeight: '700' },
  week: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  weekSub: { color: '#6B7280', fontSize: 11, marginTop: 2, textAlign: 'center' },
  body: { padding: 20, paddingBottom: 50 },
  hero: { backgroundColor: '#1F2937', borderRadius: 14, padding: 20, marginBottom: 18, borderColor: '#374151', borderWidth: 1 },
  heroEst: { borderColor: '#EAB308' },
  heroPaid: { borderColor: '#10B981' },
  heroLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  heroAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 6 },
  heroEstAmount: { color: '#EAB308' },
  heroPaidAmount: { color: '#10B981' },
  heroNote: { fontSize: 12, marginTop: 10, lineHeight: 18 },
  section: { color: '#6B7280', fontSize: 11, fontWeight: '700', marginBottom: 10, letterSpacing: 0.6, marginTop: 6 },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, marginBottom: 18, borderColor: '#374151', borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { color: '#9CA3AF', fontSize: 14, flex: 1, paddingRight: 12 },
  value: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  neg: { color: '#EF4444' },
  pos: { color: '#10B981' },
  divider: { height: 1, backgroundColor: '#374151', marginVertical: 8 },
  total: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  loadRef: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  loadMiles: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  empty: { color: '#6B7280', fontSize: 13 },
  err: { color: '#EF4444', fontSize: 13 },
});

const money = (n) =>
  typeof n === 'number'
    ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

const fromCents = (c) => (typeof c === 'number' ? c / 100 : undefined);

function fmtWeek(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00Z');
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 6);
  const f = (x) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${f(d)} – ${f(end)}`;
}

export default function PayScreen() {
  const router = useRouter();
  const thisWeek = mondayOf(new Date());
  const [week, setWeek] = useState(thisWeek);
  const atCurrent = week === thisWeek;

  const st = useQuery({ queryKey: ['settlement', week], queryFn: () => fetchSettlement(week) });
  const dt = useQuery({ queryKey: ['debts', week], queryFn: () => fetchDebts(week) });
  const acc = useQuery({ queryKey: ['accounting'], queryFn: fetchAccounting });

  const settlement = st.data?.settlement;
  const debts = dt.data?.debts ?? [];
  const applied = (acc.data?.adjustments ?? []).filter((a) => a.status === 'applied');
  const bonuses = applied.filter((a) => a.kind === 'bonus' && a.week_of === week);
  const fines = applied.filter((a) => a.kind === 'fine' && a.week_of === week);
  const payment = (acc.data?.payments ?? []).find((p) => p.week_of === week);

  const paid = settlement?.paid === true;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← More</Text>
        </TouchableOpacity>
        <Text style={s.title}>Pay</Text>
        <View style={s.nav}>
          <TouchableOpacity style={s.navBtn} onPress={() => setWeek(shiftWeek(week, -1))}>
            <Text style={s.navText}>{'‹'}</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.week}>{fmtWeek(week)}</Text>
            <Text style={s.weekSub}>{atCurrent ? 'Current week' : week}</Text>
          </View>
          <TouchableOpacity
            style={[s.navBtn, atCurrent && s.navOff]}
            disabled={atCurrent}
            onPress={() => setWeek(shiftWeek(week, 1))}
          >
            <Text style={s.navText}>{'›'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl refreshing={st.isFetching} tintColor="#F59E0B" onRefresh={() => { st.refetch(); dt.refetch(); acc.refetch(); }} />
        }
      >
        {st.isLoading && <ActivityIndicator color="#F59E0B" style={{ marginTop: 30 }} />}
        {st.error && <Text style={s.err}>{st.error.message}</Text>}

        {settlement && (
          <View style={[s.hero, paid ? s.heroPaid : s.heroEst]}>
            <Text style={s.heroLabel}>{paid ? 'PAID' : 'ESTIMATE — NOT FINALISED'}</Text>
            <Text style={[s.heroAmount, paid ? s.heroPaidAmount : s.heroEstAmount]}>
              {money(settlement.payable)}
            </Text>
            <Text style={[s.heroNote, { color: paid ? '#10B981' : '#EAB308' }]}>
              {paid
                ? payment?.paid_at
                  ? `Paid ${new Date(payment.paid_at).toLocaleDateString()}`
                  : 'This week is final.'
                : 'Loads, miles and fixed deductions are set. Adjustments and debt charges can still change before payout.'}
            </Text>
          </View>
        )}

        {settlement && (
          <>
            <Text style={s.section}>LOADS · {settlement.loadCount ?? 0}</Text>
            <View style={s.card}>
              {(settlement.loads ?? []).length === 0 ? (
                <Text style={s.empty}>No loads this week.</Text>
              ) : (
                <>
                  {settlement.loads.map((l, i) => (
                    <View key={l.reference ?? i} style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.loadRef}>{l.reference}</Text>
                        <Text style={s.loadMiles}>{l.miles} mi</Text>
                      </View>
                      <Text style={s.value}>{money(l.pay)}</Text>
                    </View>
                  ))}
                  <View style={s.divider} />
                  <View style={s.row}>
                    <Text style={s.total}>Gross · {settlement.miles} mi</Text>
                    <Text style={s.total}>{money(settlement.gross)}</Text>
                  </View>
                </>
              )}
            </View>
          </>
        )}

        {bonuses.length > 0 && (
          <>
            <Text style={s.section}>BONUSES</Text>
            <View style={s.card}>
              {bonuses.map((b) => (
                <View key={b.id} style={s.row}>
                  <Text style={s.label}>{b.label}</Text>
                  <Text style={[s.value, s.pos]}>+{money(fromCents(b.amount_cents))}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {fines.length > 0 && (
          <>
            <Text style={s.section}>FINES</Text>
            <View style={s.card}>
              {fines.map((f) => (
                <View key={f.id} style={s.row}>
                  <Text style={s.label}>{f.label}</Text>
                  <Text style={[s.value, s.neg]}>-{money(fromCents(f.amount_cents))}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {settlement && (settlement.additions ?? []).length > 0 && (
          <>
            <Text style={s.section}>ADDITIONS</Text>
            <View style={s.card}>
              {settlement.additions.map((a, i) => (
                <View key={i} style={s.row}>
                  <Text style={s.label}>{a.label}</Text>
                  <Text style={[s.value, s.pos]}>+{money(a.amount)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {settlement && (
          <>
            <Text style={s.section}>DEDUCTIONS</Text>
            <View style={s.card}>
              {(settlement.deductions ?? []).map((d, i) => (
                <View key={i} style={s.row}>
                  <Text style={s.label}>{d.label}</Text>
                  <Text style={[s.value, s.neg]}>-{money(d.amount)}</Text>
                </View>
              ))}
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.total}>Total</Text>
                <Text style={[s.total, s.neg]}>-{money(settlement.deductionTotal)}</Text>
              </View>
            </View>

            <Text style={s.section}>SUMMARY</Text>
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.label}>Gross</Text>
                <Text style={s.value}>{money(settlement.gross)}</Text>
              </View>
              {settlement.additionTotal ? (
                <View style={s.row}>
                  <Text style={s.label}>Additions</Text>
                  <Text style={[s.value, s.pos]}>+{money(settlement.additionTotal)}</Text>
                </View>
              ) : null}
              <View style={s.row}>
                <Text style={s.label}>Deductions</Text>
                <Text style={[s.value, s.neg]}>-{money(settlement.deductionTotal)}</Text>
              </View>
              {settlement.carryIn ? (
                <View style={s.row}>
                  <Text style={s.label}>Carried in</Text>
                  <Text style={[s.value, settlement.carryIn < 0 && s.neg]}>{money(settlement.carryIn)}</Text>
                </View>
              ) : null}
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.total}>{paid ? 'Paid' : 'Estimated net'}</Text>
                <Text style={[s.total, paid ? s.pos : { color: '#EAB308' }]}>{money(settlement.payable)}</Text>
              </View>
            </View>
          </>
        )}

        {debts.length > 0 && (
          <>
            <Text style={s.section}>BALANCES</Text>
            <View style={s.card}>
              {debts.map((d) => {
                const owes = d.direction === 'driver_owes';
                return (
                  <View key={d.id} style={{ paddingVertical: 8 }}>
                    <View style={s.row}>
                      <Text style={s.label}>{d.label}</Text>
                      <Text style={[s.value, owes ? s.neg : s.pos]}>{money(d.balance)}</Text>
                    </View>
                    <Text style={s.loadMiles}>
                      {owes ? 'You owe' : 'Company owes'} · {money(d.weeklyAmount)}/week
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
