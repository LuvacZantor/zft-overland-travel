/** Pure, additive accounting for hours actually committed within each saved hex.
 *  Earlier ledgers without hexHourSegments remain untouched: no fabricated history. */
export function appendHexHours(existing, hexId, day, count) {
  const rows = Array.isArray(existing) ? existing : [];
  if (typeof hexId !== "string" || !hexId || !Number.isSafeInteger(Number(day)) || Number(day) < 1 || !Number.isSafeInteger(Number(count)) || Number(count) <= 0) return rows;
  const result = rows.map(row => ({ ...row }));
  const prior = result.find(row => row.hexId === hexId && Number(row.day) === Number(day));
  if (prior) prior.hours = (Number(prior.hours) || 0) + Number(count);
  else result.push({ hexId, day: Number(day), hours: Number(count) });
  return result;
}
export function hexHoursForId(existing, hexId) {
  if (typeof hexId !== "string" || !hexId) return { total: 0, days: [] };
  const byDay = new Map();
  for (const row of Array.isArray(existing) ? existing : []) {
    if (row?.hexId !== hexId) continue;
    const day = Number(row.day), hours = Number(row.hours);
    if (!Number.isSafeInteger(day) || day < 1 || !Number.isSafeInteger(hours) || hours <= 0) continue;
    byDay.set(day, (byDay.get(day) ?? 0) + hours);
  }
  const days = [...byDay].sort(([a],[b]) => a-b).map(([day,hours]) => ({day,hours}));
  return { total: days.reduce((sum, row) => sum + row.hours, 0), days };
}
