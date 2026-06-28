export function formatReportDate(day: number, month: number, year: number) {
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

export function resolveReportCurrency(currency: string) {
  if (!currency || currency === "TL") return "TRY";
  return currency;
}

export function formatReportMoney(value: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: resolveReportCurrency(currency)
  }).format(value);
}

export function formatReportNumber(value: number) {
  return value.toFixed(2).replace(".", ",");
}

export function formatOfficeAddress(parts: {
  address?: string;
  district?: string;
  city?: string;
  phone?: string;
  mobile?: string;
}) {
  const location = [parts.address, parts.district, parts.city].filter(Boolean).join(" ");
  const phone = parts.phone || parts.mobile;
  return [location, phone ? `Tel: ${phone}` : ""].filter(Boolean).join(" · ");
}

export function formatReportTimestamp(date = new Date()) {
  return {
    date: date.toLocaleDateString("tr-TR"),
    time: date.toLocaleTimeString("tr-TR")
  };
}
