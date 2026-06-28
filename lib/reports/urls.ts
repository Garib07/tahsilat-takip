export function buildStatementExportUrl(
  period: number,
  customerIds: string[],
  format: "excel" | "csv",
  years?: number[]
) {
  const params = new URLSearchParams({
    period: String(period),
    format
  });

  if (customerIds.length) {
    params.set("customers", customerIds.join(","));
  }

  if (years?.length && (years.length > 1 || years[0] !== period)) {
    params.set("years", years.join(","));
  }

  return `/api/reports/statement?${params.toString()}`;
}

export function buildStatementPrintUrl(
  period: number,
  customerIds: string[],
  years?: number[]
) {
  const params = new URLSearchParams({
    period: String(period),
    print: "1"
  });

  if (customerIds.length) {
    params.set("customers", customerIds.join(","));
  }

  if (years?.length && (years.length > 1 || years[0] !== period)) {
    params.set("years", years.join(","));
  }

  return `/reports/print?${params.toString()}`;
}
