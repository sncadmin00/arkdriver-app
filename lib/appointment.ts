// Appointment times are wall-clock strings in the stop's own timezone.
// Never convert them — compare against "now" as seen in that same zone.
export function countdown(dateStr, timeStr, timezone, now = new Date()) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T${timeStr || '00:00'}:00`);
  if (isNaN(target)) return null;

  let nowThere = now;
  if (timezone) {
    try {
      nowThere = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
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
