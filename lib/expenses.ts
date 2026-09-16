import * as SQLite from 'expo-sqlite';
// SDK 54 moved documentDirectory/copyAsync to the legacy entry point.
import * as FileSystem from 'expo-file-system/legacy';

const db = SQLite.openDatabaseSync('expenses.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    photo TEXT,
    gallons REAL,
    created_at TEXT NOT NULL
  );
`);

// Repairs on a company truck belong in the truck's service history, not just
// on the driver's phone. These two columns carry the odometer the server needs
// and remember whether the record has made it there yet.
for (const col of ['odometer INTEGER', 'synced INTEGER NOT NULL DEFAULT 0']) {
  try {
    db.execSync(`ALTER TABLE expenses ADD COLUMN ${col};`);
  } catch {
    // Already added on a previous launch.
  }
}

export const CATEGORIES = [
  'fuel', 'parking', 'meals', 'lodging', 'repair', 'equipment', 'tolls', 'other',
];

const DIR = FileSystem.documentDirectory + 'receipts/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

export async function saveReceipt(uri) {
  await ensureDir();
  const name = `${Date.now()}.jpg`;
  const dest = DIR + name;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export function addExpense(e) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  db.runSync(
    'INSERT INTO expenses (id, date, category, amount, note, photo, gallons, odometer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, e.date, e.category, e.amount, e.note ?? null, e.photo ?? null, e.gallons ?? null, e.odometer ?? null, new Date().toISOString()]
  );
  return id;
}

/** Repairs that still owe the office a copy. */
export function unsyncedRepairs() {
  return db.getAllSync(
    "SELECT * FROM expenses WHERE category = 'repair' AND synced = 0 AND odometer IS NOT NULL"
  );
}

export function markSynced(id) {
  db.runSync('UPDATE expenses SET synced = 1 WHERE id = ?', [id]);
}

export function listExpenses(year) {
  if (year) {
    return db.getAllSync('SELECT * FROM expenses WHERE date LIKE ? ORDER BY date DESC', [`${year}%`]);
  }
  return db.getAllSync('SELECT * FROM expenses ORDER BY date DESC');
}

export function deleteExpense(id) {
  const row = db.getFirstSync('SELECT photo FROM expenses WHERE id = ?', [id]);
  if (row?.photo) FileSystem.deleteAsync(row.photo, { idempotent: true }).catch(() => {});
  db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
}

export function totals(year) {
  const rows = listExpenses(year);
  const byCategory = {};
  let total = 0;
  for (const r of rows) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount;
    total += r.amount;
  }
  return { total, byCategory, count: rows.length };
}

export function years() {
  const rows = db.getAllSync("SELECT DISTINCT substr(date, 1, 4) AS y FROM expenses ORDER BY y DESC");
  return rows.map((r) => r.y);
}

export async function exportCsv(year) {
  const rows = listExpenses(year);
  const head = 'Date,Category,Amount,Gallons,Note\n';
  const body = rows
    .map((r) =>
      [r.date, r.category, r.amount.toFixed(2), r.gallons ?? '', `"${(r.note ?? '').replace(/"/g, '""')}"`].join(',')
    )
    .join('\n');
  const path = FileSystem.cacheDirectory + `expenses-${year ?? 'all'}.csv`;
  await FileSystem.writeAsStringAsync(path, head + body, { encoding: FileSystem.EncodingType.UTF8 });
  return path;
}
