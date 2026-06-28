export function formatPeriodLabel(year: number) {
  return `${year} Dönemi (Ocak–Aralık)`;
}

export function periodYearOptions(before = 10, after = 5, baseYear = new Date().getFullYear()) {
  const start = baseYear - before;
  const end = baseYear + after;
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function resolvePeriodMonth(periodYear: number) {
  const today = new Date();
  return today.getFullYear() === periodYear ? today.getMonth() + 1 : 12;
}

export function isDateInPeriod(date: string, periodYear: number) {
  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === periodYear;
}
