export function normalizeClosedAt(value: unknown): string {
  if (!value) return "";
  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return "";
  return raw;
}

export const normalizeOpenedAt = normalizeClosedAt;

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

export const parseOpeningMonth = parseClosureMonth;

export function listAllowedChargeMonths(
  period: number,
  openedAt?: string,
  closedAt?: string
) {
  return Array.from({ length: 12 }, (_, index) => index + 1).filter((month) =>
    isMonthlyChargeAllowed(closedAt, period, month, openedAt)
  );
}

export function resolveDefaultChargeMonth(
  period: number,
  openedAt?: string,
  closedAt?: string
) {
  const today = new Date();
  const preferred = today.getFullYear() === period ? today.getMonth() + 1 : 12;
  if (isMonthlyChargeAllowed(closedAt, period, preferred, openedAt)) {
    return preferred;
  }
  return listAllowedChargeMonths(period, openedAt, closedAt)[0] ?? preferred;
}

export function validateCustomerContractDates(openedAt: string, closedAt: string) {
  if (openedAt && closedAt && openedAt > closedAt) {
    throw new Error("Açılış tarihi kapanış tarihinden sonra olamaz.");
  }
}

/** Açılış ayından önceki aylar hariç; kapanış ayından sonraki aylar hariç. */
export function isMonthlyChargeAllowed(
  closedAt: string | undefined,
  year: number,
  month: number,
  openedAt?: string
) {
  const opening = parseOpeningMonth(openedAt ?? "");
  if (opening) {
    if (year < opening.year) return false;
    if (year === opening.year && month < opening.month) return false;
  }

  const closure = parseClosureMonth(closedAt ?? "");
  if (!closure) return true;

  if (year > closure.year) return false;
  if (year < closure.year) return true;
  return month <= closure.month;
}
