import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { CATEGORIES, addExpense, listExpenses, deleteExpense, totals, years, saveReceipt, exportCsv } from '@/lib/expenses';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1F2937' },
  container: { flex: 1, backgroundColor: '#0B0F14' },
  header: { backgroundColor: '#1F2937', paddingHorizontal: 20, paddingBottom: 14 },
  back: { color: '#F59E0B', fontSize: 15, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  chips: { flexDirection: 'row', marginTop: 12 },
  chip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 14, marginRight: 8, backgroundColor: '#374151' },
  chipOn: { backgroundColor: '#F59E0B' },
  chipText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  chipOnText: { color: '#0B0F14' },
  body: { padding: 20, paddingBottom: 40 },
  hero: { backgroundColor: '#1F2937', borderRadius: 14, padding: 20, marginBottom: 16, borderColor: '#374151', borderWidth: 1 },
  heroLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  heroAmount: { color: '#F59E0B', fontSize: 34, fontWeight: '800', marginTop: 6 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  catLabel: { color: '#9CA3AF', fontSize: 13 },
  catValue: { color: '#E5E7EB', fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#374151', marginVertical: 10 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 13, alignItems: 'center', backgroundColor: '#F59E0B' },
  btnText: { color: '#0B0F14', fontWeight: '700', fontSize: 14 },
  btnGhost: { backgroundColor: 'transparent', borderColor: '#F59E0B', borderWidth: 1 },
  btnGhostText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 10, padding: 14, marginBottom: 10, borderColor: '#374151', borderWidth: 1 },
  thumb: { width: 40, height: 40, borderRadius: 6, marginRight: 12, backgroundColor: '#374151' },
  rowCat: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  rowMeta: { color: '#6B7280', fontSize: 12, marginTop: 3 },
  rowAmount: { color: '#F59E0B', fontSize: 15, fontWeight: '700' },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 40 },
  note: { color: '#6B7280', fontSize: 11, lineHeight: 17, marginTop: 16, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: '#0B0F14' },
  mBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1F2937', paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20 },
  mTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  mAction: { color: '#F59E0B', fontSize: 16, fontWeight: '600' },
  label: { color: '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
  input: { backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1, borderRadius: 8, padding: 13, color: '#FFFFFF', fontSize: 16 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1F2937', borderColor: '#374151', borderWidth: 1 },
  catChipOn: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  catChipText: { color: '#9CA3AF', fontSize: 13 },
  catChipOnText: { color: '#0B0F14', fontWeight: '700' },
  pick: { borderColor: '#374151', borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 26, alignItems: 'center' },
  pickText: { color: '#F59E0B', fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#1F2937' },
});

const money = (n) => `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);

export default function ExpensesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [tick, setTick] = useState(0);
  const [form, setForm] = useState(null);

  const rows = listExpenses(year === 'all' ? undefined : year);
  const sum = totals(year === 'all' ? undefined : year);
  const available = years();
  const yearList = available.includes(String(new Date().getFullYear()))
    ? available
    : [String(new Date().getFullYear()), ...available];

  function openForm() {
    setForm({ date: today(), category: 'fuel', amount: '', note: '', gallons: '', photo: null });
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4 });
    if (res.canceled || !res.assets?.[0]) return;
    const saved = await saveReceipt(res.assets[0].uri);
    setForm((f) => ({ ...f, photo: saved }));
  }

  function save() {
    const amount = parseFloat(String(form.amount).replace(',', '.'));
    if (!amount || amount <= 0) return Alert.alert(t('expenses.amountRequired'));
    addExpense({
      date: form.date,
      category: form.category,
      amount,
      note: form.note,
      photo: form.photo,
      gallons: form.gallons ? parseFloat(form.gallons) : null,
    });
    setForm(null);
    setTick((x) => x + 1);
  }

  function remove(id) {
    Alert.alert(t('expenses.delete'), t('expenses.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('expenses.delete'),
        style: 'destructive',
        onPress: () => { deleteExpense(id); setTick((x) => x + 1); },
      },
    ]);
  }

  async function share() {
    const path = await exportCsv(year === 'all' ? undefined : year);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← {t('more.title')}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t('expenses.title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
          {yearList.map((y) => (
            <TouchableOpacity key={y} style={[s.chip, year === y && s.chipOn]} onPress={() => setYear(y)}>
              <Text style={[s.chipText, year === y && s.chipOnText]}>{y}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[s.chip, year === 'all' && s.chipOn]} onPress={() => setYear('all')}>
            <Text style={[s.chipText, year === 'all' && s.chipOnText]}>{t('expenses.allYears')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.body}>
        <View style={s.hero}>
          <Text style={s.heroLabel}>{t('expenses.total')}</Text>
          <Text style={s.heroAmount}>{money(sum.total)}</Text>
          {sum.count > 0 ? (
            <>
              <View style={s.divider} />
              {Object.entries(sum.byCategory).map(([cat, val]) => (
                <View key={cat} style={s.catRow}>
                  <Text style={s.catLabel}>{t(`expenses.cat_${cat}`)}</Text>
                  <Text style={s.catValue}>{money(val)}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.btn} onPress={openForm}>
            <Text style={s.btnText}>{t('expenses.add')}</Text>
          </TouchableOpacity>
          {sum.count > 0 ? (
            <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={share}>
              <Text style={s.btnGhostText}>{t('expenses.export')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {rows.length === 0 ? (
          <Text style={s.empty}>{t('expenses.noneYet')}</Text>
        ) : (
          rows.map((r) => (
            <TouchableOpacity key={r.id} style={s.row} onLongPress={() => remove(r.id)}>
              {r.photo ? <Image source={{ uri: r.photo }} style={s.thumb} /> : <View style={s.thumb} />}
              <View style={{ flex: 1 }}>
                <Text style={s.rowCat}>{t(`expenses.cat_${r.category}`)}</Text>
                <Text style={s.rowMeta}>
                  {r.date}
                  {r.gallons ? ` · ${r.gallons} gal` : ''}
                  {r.note ? ` · ${r.note}` : ''}
                </Text>
              </View>
              <Text style={s.rowAmount}>{money(r.amount)}</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={s.note}>{t('expenses.exportNote')}</Text>
      </ScrollView>

      <Modal visible={!!form} animationType="slide" onRequestClose={() => setForm(null)}>
        <View style={s.modal}>
          <View style={s.mBar}>
            <TouchableOpacity onPress={() => setForm(null)}>
              <Text style={s.mAction}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text style={s.mTitle}>{t('expenses.add')}</Text>
            <TouchableOpacity onPress={save}>
              <Text style={s.mAction}>{t('expenses.save')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
            <Text style={s.label}>{t('expenses.category').toUpperCase()}</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.catChip, form?.category === c && s.catChipOn]}
                  onPress={() => setForm((f) => ({ ...f, category: c }))}
                >
                  <Text style={[s.catChipText, form?.category === c && s.catChipOnText]}>
                    {t(`expenses.cat_${c}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>{t('expenses.amount').toUpperCase()}</Text>
            <TextInput
              style={s.input}
              placeholder="0.00"
              placeholderTextColor="#6B7280"
              keyboardType="decimal-pad"
              value={form?.amount}
              onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
            />

            {form?.category === 'fuel' ? (
              <>
                <Text style={s.label}>{t('expenses.gallons').toUpperCase()}</Text>
                <TextInput
                  style={s.input}
                  placeholder="0"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={form?.gallons}
                  onChangeText={(v) => setForm((f) => ({ ...f, gallons: v }))}
                />
              </>
            ) : null}

            <Text style={s.label}>{t('expenses.date').toUpperCase()}</Text>
            <TextInput
              style={s.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#6B7280"
              value={form?.date}
              onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
            />

            <Text style={s.label}>{t('expenses.note').toUpperCase()}</Text>
            <TextInput
              style={s.input}
              placeholderTextColor="#6B7280"
              value={form?.note}
              onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
            />

            <Text style={s.label}>{t('expenses.receipt').toUpperCase()}</Text>
            {form?.photo ? (
              <>
                <Image source={{ uri: form.photo }} style={s.preview} resizeMode="contain" />
                <TouchableOpacity onPress={pickPhoto}>
                  <Text style={[s.pickText, { textAlign: 'center', marginTop: 10 }]}>{t('expenses.retake')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={s.pick} onPress={pickPhoto}>
                <Text style={s.pickText}>{t('expenses.takePhoto')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
