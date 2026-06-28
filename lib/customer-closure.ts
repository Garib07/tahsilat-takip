export function normalizeClosedAt(value: unknown): string {
  if (!value) return "";
  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  return raw;
}

export function parseClosureMonth(closedAt: string) {
  const normalized = normalizeClosedAt(closedAt);
  if (!normalized) return null;

  const [yearPart, monthPart] = normalized.split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

/** Kapanış tarihinin bulunduğu ay dahil; sonraki aylar hariç. */
export function isMonthlyChargeAllowed(closedAt: string | undefined, year: number, month: number) {
  const closure = parseClosureMonth(closedAt ?? "");
  if (!closure) return true;

  if (year > closure.year) return false;
  if (year < closure.year) return true;
  return month <= closure.month;
}
