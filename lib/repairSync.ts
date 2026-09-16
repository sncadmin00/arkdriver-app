import { createMaintenance, fetchProfile } from './api';
import { unsyncedRepairs, markSynced } from './expenses';

/**
 * Pushes locally recorded repairs into the truck's service history.
 *
 * The local row is the source of truth while the driver is out of signal; this
 * only ever adds a copy on the server and marks the row once it lands, so a
 * failed attempt costs nothing but a retry.
 */
export async function syncRepairs(): Promise<number> {
  const rows = unsyncedRepairs();
  if (!rows.length) return 0;

  const profile = await fetchProfile();
  const unitId = profile?.truck?.unit;
  if (!unitId) return 0;

  let sent = 0;
  let lastError: any = null;
  for (const row of rows) {
    try {
      await createMaintenance({
        unitId,
        // The endpoint validates snake_case keys — camelCase reads as missing.
        service_type: 'other',
        type: 'repair',
        mileage: row.odometer,
        cost: row.amount,
        description: row.note || undefined,
      });
      markSynced(row.id);
      sent += 1;
    } catch (e: any) {
      // Offline or rejected — the row stays unsynced and we try again later.
      // Surfaced while we confirm the office actually receives these.
      console.warn('repair sync failed:', e?.status, e?.code, e?.message);
      lastError = e;
    }
  }
  if (!sent && lastError) throw lastError;
  return sent;
}
