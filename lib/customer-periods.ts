import { Customer } from "./types";

export function normalizeActivePeriods(
  customer: Partial<Customer> & { period?: number; yearlyFees?: { year: number }[] }
): number[] {
  if (Array.isArray(customer.activePeriods) && customer.activePeriods.length) {
    return [...new Set(
      customer.activePeriods
        .map(Number)
        .filter((year) => Number.isInteger(year) && year >= 2000 && year <= 2100)
    )].sort((a, b) => a - b);
  }

  const legacyPeriod = Number(customer.period);
  if (Number.isInteger(legacyPeriod) && legacyPeriod >= 2000 && legacyPeriod <= 2100) {
    return [legacyPeriod];
  }

  const feeYears = (customer.yearlyFees ?? [])
    .map((fee) => fee.year)
    .filter((year) => Number.isInteger(year));

  if (feeYears.length) {
    return [Math.max(...feeYears)];
  }

  return [new Date().getFullYear()];
}

export function isCustomerActiveInPeriod(customer: Pick<Customer, "activePeriods">, period: number) {
  return customer.activePeriods.includes(period);
}

export function formatActivePeriods(periods: number[]) {
  return periods.join(", ");
}
