import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { View as RNView, Modal, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { fetchSettlement, fetchDebts, fetchAccounting, fetchFuel, fetchTolls, fetchYtd, fetchTaxDocuments, fetchTaxDocumentUrl, fetchProfile, createBankLink, mondayOf, shiftWeek } from '@/lib/api';

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
  strike: { color: '#6B7280', fontSize: 12, textDecorationLine: 'line-through', marginTop: 2 },
  rpm: { color: '#F59E0B', fontSize: 12, fontWeight: '600', marginTop: 3 },
  chev: { color: '#6B7280', fontSize: 18, marginLeft: 8 },
  bankBtn: { borderColor: '#F59E0B', borderWidth: 1, borderRadius: 8, paddingVertical: 11, alignItems: 'center', marginTop: 14 },
  bankBtnText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  mBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20 },
  mTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  mAction: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
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


function TxnSection({ title, data, showGallons }) {
  const { t: tr } = useTranslation();
  const rows = data?.transactions ?? data?.items ?? [];
  const t = data?.totals;
  if (!rows.length) return null;
  const rolled = data?.itemized === false;
  return (
    <>
      <Text style={s.section}>{title} · {t?.count ?? rows.length}</Text>
      <View style={s.card}>
        {rolled ? (
          <Text style={[s.empty, { marginBottom: 10 }]}>{tr('pay.rolledUp')}</Text>
        ) : null}
        {rows.map((r, i) => (
          <View key={r.id ?? i} style={{ paddingVertical: 8, borderBottomColor: '#374151', borderBottomWidth: i === rows.length - 1 ? 0 : 1 }}>
            <View style={s.row}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.loadRef}>{r.location ?? r.description ?? '—'}</Text>
                <Text style={s.loadMiles}>
                  {r.date ? new Date(r.date).toLocaleDateString() : ''}
                  {showGallons && r.gallons ? ` · ${r.gallons} gal` : ''}
                  {showGallons && r.pricePerGallon ? ` @ ${money(r.pricePerGallon)}` : ''}
                  {r.unit ? ` · unit ${r.unit}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.value, s.neg]}>-{money(r.net)}</Text>
                {r.discount ? (
                  <Text style={s.strike}>{money(r.gross)}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ))}
        {t ? (
          <>
            <View style={s.divider} />
            {t.gallons ? (
              <View style={s.row}>
                <Text style={s.label}>{tr('pay.gallons')}</Text>
                <Text style={s.value}>{t.gallons}</Text>
              </View>
            ) : null}
            <View style={s.row}>
              <Text style={s.label}>{t('pay.gross')}</Text>
              <Text style={s.value}>{money(t.gross)}</Text>
            </View>
            {t.discount ? (
              <View style={s.row}>
                <Text style={s.label}>{tr('pay.discount')}</Text>
                <Text style={[s.value, s.pos]}>-{money(t.discount)}</Text>
              </View>
            ) : null}
            <View style={s.row}>
              <Text style={s.total}>{tr('pay.charged')}</Text>
              <Text style={[s.total, s.neg]}>-{money(t.net)}</Text>
            </View>
          </>
        ) : null}
      </View>
    </>
  );
}

export default function PayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const thisWeek = mondayOf(new Date());
  const [week, setWeek] = useState(thisWeek);
  const atCurrent = week === thisWeek;

  const st = useQuery({ queryKey: ['settlement', week], queryFn: () => fetchSettlement(week) });
  const dt = useQuery({ queryKey: ['debts', week], queryFn: () => fetchDebts(week) });
  const acc = useQuery({ queryKey: ['accounting'], queryFn: fetchAccounting });
  const fuel = useQuery({ queryKey: ['fuel', week], queryFn: () => fetchFuel(week) });
  const tolls = useQuery({ queryKey: ['tolls', week], queryFn: () => fetchTolls(week) });
  const ytd = useQuery({ queryKey: ['ytd'], queryFn: () => fetchYtd() });
  const tax = useQuery({ queryKey: ['tax-documents'], queryFn: fetchTaxDocuments });
  const prof = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  const [viewer, setViewer] = useState(null);

  const y = ytd.data?.ytd ?? ytd.data;
  const taxYears = tax.data?.years ?? tax.data?.documents ?? tax.data ?? [];
  const bank = prof.data?.bank;

  async function openTax(year) {
    try {
      const res = await fetchTaxDocumentUrl(year);
      if (res?.url) setViewer(res.url);
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    }
  }

  function dispute(d) {
    Alert.alert(
      t('pay.disputeTitle'),
      t('pay.disputeBody', { label: d.label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('pay.dispute'),
          onPress: () =>
            router.push({
              pathname: '/(tabs)/chat',
              params: {
                draft: t('pay.disputeMessage', {
                  label: d.label,
                  amount: money(d.amount),
                  week,
                }),
              },
            }),
        },
      ]
    );
  }

  async function openBank() {
    try {
      const res = await createBankLink();
      console.log('BANK LINK:', JSON.stringify(res, null, 2));
      if (res?.url) Linking.openURL(res.url);
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    }
  }

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
          <Text style={s.back}>← {t('more.title')}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t('pay.title')}</Text>
        <View style={s.nav}>
          <TouchableOpacity style={s.navBtn} onPress={() => setWeek(shiftWeek(week, -1))}>
            <Text style={s.navText}>{'‹'}</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.week}>{fmtWeek(week)}</Text>
            <Text style={s.weekSub}>{atCurrent ? t('pay.currentWeek') : week}</Text>
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
          <RefreshControl refreshing={st.isFetching} tintColor="#F59E0B" onRefresh={() => { st.refetch(); dt.refetch(); acc.refetch(); fuel.refetch(); tolls.refetch(); }} />
        }
      >
        {st.isLoading && <ActivityIndicator color="#F59E0B" style={{ marginTop: 30 }} />}
        {st.error && <Text style={s.err}>{st.error.message}</Text>}

        {settlement && (
          <View style={[s.hero, paid ? s.heroPaid : s.heroEst]}>
            <Text style={s.heroLabel}>{paid ? t('pay.paid') : t('pay.estimate')}</Text>
            <Text style={[s.heroAmount, paid ? s.heroPaidAmount : s.heroEstAmount]}>
              {money(settlement.payable)}
            </Text>
            <Text style={[s.heroNote, { color: paid ? '#10B981' : '#EAB308' }]}>
              {paid
                ? payment?.paid_at
                  ? t('pay.paidOn', { date: new Date(payment.paid_at).toLocaleDateString() })
                  : t('pay.final')
                : t('pay.estimateNote')}
            </Text>
          </View>
        )}

        {settlement && (
          <>
            <Text style={s.section}>{t('pay.loads', { count: settlement.loadCount ?? 0 })}</Text>
            <View style={s.card}>
              {(settlement.loads ?? []).length === 0 ? (
                <Text style={s.empty}>{t('pay.noLoads')}</Text>
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
                    <Text style={s.total}>{t('pay.grossMiles', { miles: settlement.miles })}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.total}>{money(settlement.gross)}</Text>
                      {settlement.miles > 0 ? (
                        <Text style={s.rpm}>{money(settlement.gross / settlement.miles)}/mi</Text>
                      ) : null}
                    </View>
                  </View>
                </>
              )}
            </View>
          </>
        )}

        {bonuses.length > 0 && (
          <>
            <Text style={s.section}>{t('pay.bonuses')}</Text>
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
            <Text style={s.section}>{t('pay.fines')}</Text>
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
            <Text style={s.section}>{t('pay.additions')}</Text>
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
            <Text style={s.section}>{t('pay.deductions')}</Text>
            <View style={s.card}>
              {(settlement.deductions ?? []).map((d, i) => (
                <TouchableOpacity key={i} style={s.row} onPress={() => dispute(d)}>
                  <Text style={s.label}>{d.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[s.value, s.neg]}>-{money(d.amount)}</Text>
                    <Text style={s.chev}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.total}>{t('pay.total')}</Text>
                <Text style={[s.total, s.neg]}>-{money(settlement.deductionTotal)}</Text>
              </View>
            </View>

            <Text style={s.section}>{t('pay.summary')}</Text>
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.label}>{t('pay.gross')}</Text>
                <Text style={s.value}>{money(settlement.gross)}</Text>
              </View>
              {settlement.additionTotal ? (
                <View style={s.row}>
                  <Text style={s.label}>{t('pay.additions')}</Text>
                  <Text style={[s.value, s.pos]}>+{money(settlement.additionTotal)}</Text>
                </View>
              ) : null}
              <View style={s.row}>
                <Text style={s.label}>{t('pay.deductions')}</Text>
                <Text style={[s.value, s.neg]}>-{money(settlement.deductionTotal)}</Text>
              </View>
              {settlement.carryIn ? (
                <View style={s.row}>
                  <Text style={s.label}>{t('pay.carriedIn')}</Text>
                  <Text style={[s.value, settlement.carryIn < 0 && s.neg]}>{money(settlement.carryIn)}</Text>
                </View>
              ) : null}
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.total}>{paid ? t('pay.paid') : t('pay.estimatedNet')}</Text>
                <Text style={[s.total, paid ? s.pos : { color: '#EAB308' }]}>{money(settlement.payable)}</Text>
              </View>
            </View>
          </>
        )}

        {y ? (
          <>
            <Text style={s.section}>{t('pay.ytd')}</Text>
            <View style={s.card}>
              <Text style={s.heroLabel}>{t('pay.ytdNet')}</Text>
              <Text style={[s.heroAmount, { fontSize: 30 }]}>{money(y.net)}</Text>
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.label}>{t('pay.ytdGross')}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.value}>{money(y.gross)}</Text>
                  {y.rpm ? <Text style={s.rpm}>{t('pay.rpmAvg', { rate: money(y.rpm) })}</Text> : null}
                </View>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t('pay.ytdDeductions')}</Text>
                <Text style={[s.value, s.neg]}>-{money(y.deductions)}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t('pay.ytdMiles')}</Text>
                <Text style={s.value}>{y.miles?.toLocaleString()}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.label}>{t('pay.ytdLoads')}</Text>
                <Text style={s.value}>{y.loads}</Text>
              </View>
            </View>
          </>
        ) : null}

        <Text style={s.section}>{t('pay.payments')}</Text>
        <View style={s.card}>
          {!(acc.data?.payments ?? []).length ? (
            <Text style={s.empty}>{t('pay.noPayments')}</Text>
          ) : (
            (acc.data?.payments ?? []).map((p, i, arr) => (
              <TouchableOpacity
                key={p.id ?? i}
                style={[s.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setWeek(p.week_of)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.loadRef}>{t('pay.weekOf', { week: p.week_of })}</Text>
                  <Text style={s.loadMiles}>
                    {p.status === 'paid' && p.paid_at
                      ? t('pay.paidOn', { date: new Date(p.paid_at).toLocaleDateString() })
                      : p.status}
                  </Text>
                </View>
                <Text style={[s.value, p.status === 'paid' && s.pos]}>
                  {money((p.amount_cents ?? 0) / 100)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={s.section}>{t('pay.tax')}</Text>
        <View style={s.card}>
          {!taxYears?.length ? (
            <Text style={s.empty}>{t('pay.taxNone')}</Text>
          ) : (
            taxYears.map((doc, i) => {
              const yr = doc.year ?? doc;
              const filed = doc.filed ?? doc.available ?? false;
              return (
                <View key={yr} style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.loadRef}>{yr}</Text>
                    {doc.total ? <Text style={s.loadMiles}>{money(doc.total)}</Text> : null}
                  </View>
                  {filed ? (
                    <TouchableOpacity onPress={() => openTax(yr)}>
                      <Text style={[s.value, { color: '#F59E0B' }]}>{t('pay.taxView')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={s.empty}>{t('pay.taxPending')}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        <Text style={s.section}>{t('pay.bank')}</Text>
        <View style={s.card}>
          {bank ? (
            <>
              <View style={s.row}>
                <Text style={s.label}>{bank.bankName ?? '—'}</Text>
                <Text style={s.value}>••••{bank.bankLast4}</Text>
              </View>
              {bank.updatedAt ? (
                <Text style={s.loadMiles}>
                  {t('pay.bankUpdated', { date: new Date(bank.updatedAt).toLocaleDateString() })}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={s.empty}>{t('pay.bankNone')}</Text>
          )}
          <TouchableOpacity style={s.bankBtn} onPress={openBank}>
            <Text style={s.bankBtnText}>{bank ? t('pay.bankChange') : t('pay.bankSet')}</Text>
          </TouchableOpacity>
        </View>

        <TxnSection title={t('pay.fuel')} data={fuel.data} showGallons />
        <TxnSection title={t('pay.tolls')} data={tolls.data} />

        {debts.length > 0 && (
          <>
            <Text style={s.section}>{t('pay.balances')}</Text>
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
                      {owes ? t('pay.youOwe') : t('pay.companyOwes')} · {money(d.weeklyAmount)}/week
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={!!viewer} animationType="slide" onRequestClose={() => setViewer(null)}>
        <View style={{ flex: 1, backgroundColor: '#0B0F14' }}>
          <View style={s.mBar}>
            <Text style={s.mTitle}>1099</Text>
            <TouchableOpacity onPress={() => setViewer(null)}>
              <Text style={s.mAction}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
          {viewer ? <WebView source={{ uri: viewer }} style={{ flex: 1, backgroundColor: '#FFF' }} startInLoadingState /> : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
