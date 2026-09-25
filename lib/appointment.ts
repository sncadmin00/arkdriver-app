// Appointment times are wall-clock strings in the stop's own timezone.
// Never convert them — compare against "now" as seen in that same zone.
export function countdown(dateStr, timeStr, timezone, now = new Date()) {
  if (!dateStr) return null;
  const [y, mo, d] = String(dateStr).split('-').map(Number);
  const [hh = 0, mm = 0] = String(timeStr || '00:00').split(':').map(Number);
  const target = Date.UTC(y, mo - 1, d, hh, mm);
  if (isNaN(target)) return null;

  // Wall clock "now" in the stop's zone, compared as if both were UTC.
  let nowThere = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds());
  if (timezone) {
    try {
      const p = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
          timeZone: timezone, hourCycle: 'h23',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).formatToParts(now).map((x) => [x.type, x.value])
      );
      const t = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
      if (!isNaN(t)) nowThere = t;
    } catch {}
  }

  const diffMin = Math.round((target - nowThere) / 60000);
  const abs = Math.abs(diffMin);
  const days = Math.floor(abs / 1440);
  const hours = Math.floor((abs % 1440) / 60);
  const mins = abs % 60;

  const span = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return {
    diffMin,
    span,
    due: abs < 5,
    late: diffMin < -5,
    soon: diffMin > 0 && diffMin <= 120,
  };
}

export function zoneShort(timezone, now = new Date()) {
  if (!timezone) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
      .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? null;
  } catch {
    return null;
  }
}
