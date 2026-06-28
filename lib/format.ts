export const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(value);
}

export function sanitizeAmountTyping(value: string) {
  const compact = value.replace(/\s/g, "").replace(/\./g, "");
  const commaIndex = compact.indexOf(",");
  const integerPart = (commaIndex === -1 ? compact : compact.slice(0, commaIndex)).replace(
    /[^\d]/g,
    ""
  );
  const decimalPart =
    commaIndex === -1 ? "" : compact.slice(commaIndex + 1).replace(/[^\d]/g, "").slice(0, 2);

  return commaIndex === -1 ? integerPart : `${integerPart},${decimalPart}`;
}

export function formatAmountInput(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(/[^\d,]/g, "");
  const [integerPart, decimalPart] = normalized.split(",");
  const integerDigits = integerPart.replace(/^0+(?=\d)/, "");
  const formattedInteger = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  if (normalized.includes(",")) {
    return `${formattedInteger || "0"},${(decimalPart ?? "").slice(0, 2)}`;
  }

  return formattedInteger;
}

export function formatAmountWithCents(value: string) {
  if (!value.trim()) return "";

  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(/[^\d,]/g, "");
  const [integerPart, decimalPart = ""] = normalized.split(",");
  const formattedInteger = (integerPart || "0")
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cents = decimalPart.padEnd(2, "0").slice(0, 2);

  return `${formattedInteger || "0"},${cents}`;
}

export function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("tr-TR");
}

export function getAccountingFeeDescription(month: number) {
  return `${monthNames[month - 1] ?? ""} Muhasebe Ücreti`.trim();
}

export function currentPeriod() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    date: today.toISOString().slice(0, 10)
  };
}
