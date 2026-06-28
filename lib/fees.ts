import { Customer, YearlyFee } from "./types";

export function normalizeYearlyFees(customer: Pick<Customer, "yearlyFees" | "monthlyFee">): YearlyFee[] {
  const fees = [...(customer.yearlyFees ?? [])].sort((a, b) => a.year - b.year);

  if (!fees.length && customer.monthlyFee > 0) {
    return [{ year: new Date().getFullYear(), amount: customer.monthlyFee }];
  }

  return fees;
}

export function getCustomerFeeForYear(
  customer: Pick<Customer, "yearlyFees" | "monthlyFee">,
  year: number
): number {
  const fees = normalizeYearlyFees(customer);
  const exact = fees.find((fee) => fee.year === year);
  if (exact) return exact.amount;

  const prior = fees
    .filter((fee) => fee.year < year)
    .sort((a, b) => b.year - a.year)[0];
  if (prior) return prior.amount;

  return customer.monthlyFee ?? 0;
}

export function parseYearlyFeesInput(input: unknown): YearlyFee[] {
  if (!Array.isArray(input) || !input.length) {
    throw new Error("En az bir yıl için aylık ücret giriniz.");
  }

  const fees: YearlyFee[] = [];
  const years = new Set<number>();

  for (const row of input) {
    const item = row as { year?: unknown; amount?: unknown };
    const year = Number(item.year);
    const amount =
      typeof item.amount === "string"
        ? Number(item.amount.trim().replace(/\./g, "").replace(",", "."))
        : Number(item.amount);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new Error("Geçerli bir yıl giriniz.");
    }

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Tutar 0 veya daha büyük olmalıdır.");
    }

    if (years.has(year)) {
      throw new Error(`${year} yılı için birden fazla ücret tanımlanamaz.`);
    }

    years.add(year);
    fees.push({ year, amount: Math.round(amount * 100) / 100 });
  }

  return fees.sort((a, b) => a.year - b.year);
}
