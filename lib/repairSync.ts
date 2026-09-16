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
  for (const row of rows) {
    try {
      await createMaintenance({
        unitId,
        serviceType: 'other',
        mileageAtService: row.odometer,
        cost: row.amount,
        description: row.note || undefined,
      });
      markSynced(row.id);
      sent += 1;
    } catch {
      // Offline or rejected — the row stays unsynced and we try again later.
    }
  }
  return sent;
}
