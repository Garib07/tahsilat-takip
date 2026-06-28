import { periodYearOptions } from "@/lib/period";
import { Customer } from "@/lib/types";
export function resolveIncludedYears(
  period: number,
  years?: number[],
  activePeriods?: number[]
) {
  const allowed = activePeriods?.length
    ? new Set(activePeriods.filter((year) => year <= period))
    : null;

  if (!years?.length) {
    if (allowed?.size && allowed.has(period)) return [period];
    return [period];
  }

  const valid = [
    ...new Set(
      years.filter(
        (year) =>
          Number.isInteger(year) &&
          year >= 2000 &&
          year <= 2100 &&
          year <= period &&
          (!allowed || allowed.has(year))
      )
    )
  ].sort((a, b) => a - b);

  if (!valid.length) return [period];

  const min = valid[0];
  const max = valid[valid.length - 1];
  const filled: number[] = [];
  for (let year = min; year <= max; year += 1) {
    if (!allowed || allowed.has(year)) {
      filled.push(year);
    }
  }

  return filled.length ? filled : [period];
}

export function parseYearsParam(value: string | null | undefined, period: number) {
  if (!value) return undefined;

  const years = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((year) => Number.isInteger(year));

  return resolveIncludedYears(period, years);
}

export function formatIncludedYearsLabel(years: number[]) {
  if (!years.length) return "";
  if (years.length === 1) return String(years[0]);
  return `${years[0]} – ${years[years.length - 1]}`;
}

export function collectActivePeriods(
  customers: Pick<Customer, "activePeriods">[],
  period: number
) {
  const merged = new Set<number>();

  for (const customer of customers) {
    for (const year of customer.activePeriods ?? []) {
      if (year <= period) merged.add(year);
    }
  }

  return [...merged].sort((a, b) => a - b);
}

export function availableReportYears(period: number, activePeriods?: number[]) {  if (activePeriods?.length) {
    return [...new Set(activePeriods.filter((year) => year <= period))].sort((a, b) => a - b);
  }

  return periodYearOptions().filter((year) => year <= period);
}

export function toggleYearInList(years: number[], year: number) {
  return years.includes(year)
    ? years.filter((item) => item !== year)
    : [...years, year].sort((a, b) => a - b);
}
