import { isMonthlyCharge } from "@/lib/charges";
import { formatDateLabel } from "@/lib/format";
import { isDateInPeriod } from "@/lib/period";
import { formatReportDate } from "@/lib/reports/format";
import {
  formatIncludedYearsLabel,
  resolveIncludedYears
} from "@/lib/reports/years";
import { StatementReport, StatementReportLine } from "@/lib/types";
import { getCustomerStatement, getOfficeProfile, listCustomers, readDatabase } from "@/lib/store";
function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function buildStatementLines(
  period: number,
  carryForward: { fromYear: number; balance: number } | null,
  charges: { month: number; year: number; amount: number; description: string; kind?: string }[],
  payments: { date: string; amount: number; description: string; method: string }[]
) {
  type Row =
    | { kind: "carryforward"; sortDate: string; fromYear: number; balance: number }
    | {
        kind: "charge";
        sortDate: string;
        month: number;
        year: number;
        amount: number;
        description: string;
        chargeKind?: "monthly" | "service";
      }
    | { kind: "payment"; sortDate: string; date: string; amount: number; description: string; method: string };

  const rows: Row[] = [
    ...(carryForward
      ? [
          {
            kind: "carryforward" as const,
            sortDate: `${period}-00-00`,
            fromYear: carryForward.fromYear,
            balance: carryForward.balance
          }
        ]
      : []),
    ...charges.map((charge) => ({
      kind: "charge" as const,
      sortDate: `${charge.year}-${String(charge.month).padStart(2, "0")}-01`,
      month: charge.month,
      year: charge.year,
      amount: charge.amount,
      description: charge.description,
      chargeKind: charge.kind as "monthly" | "service"
    })),
    ...payments.map((payment) => ({
      kind: "payment" as const,
      sortDate: payment.date,
      date: payment.date,
      amount: payment.amount,
      description: payment.description,
      method: payment.method
    }))
  ].sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  let runningBalance = 0;
  const lines: StatementReportLine[] = [];

  for (const row of rows) {
    const debit =
      row.kind === "carryforward"
        ? row.balance > 0
          ? row.balance
          : 0
        : row.kind === "charge"
          ? row.amount
          : 0;
    const credit =
      row.kind === "carryforward"
        ? row.balance < 0
          ? Math.abs(row.balance)
          : 0
        : row.kind === "payment"
          ? row.amount
          : 0;

    runningBalance = roundMoney(runningBalance + debit - credit);

    if (row.kind === "carryforward") {
      lines.push({
        dateLabel: formatReportDate(1, 1, period),
        description: `${row.fromYear} Yılı Devir Bakiyesi`,
        debit,
        credit,
        balance: runningBalance,
        lineType: "carryforward"
      });
      continue;
    }

    if (row.kind === "charge") {
      lines.push({
        dateLabel: formatReportDate(1, row.month, row.year),
        description:
          row.description ||
          (isMonthlyCharge({
            kind: row.chargeKind ?? "service",
            description: row.description
          })
            ? "Aylık Ücret"
            : "Hizmet Tahakkuku"),
        debit,
        credit,
        balance: runningBalance,
        lineType: "charge"
      });
      continue;
    }

    lines.push({
      dateLabel: formatDateLabel(row.date),
      description: row.description || row.method || "Tahsilat",
      debit,
      credit,
      balance: runningBalance,
      lineType: "payment"
    });
  }

  return lines;
}

export async function buildStatementReport(
  customerId: string,
  period: number,
  includedYears?: number[]
): Promise<StatementReport> {
  const statement = await getCustomerStatement(customerId, period);
  const { customer } = statement;
  const years = resolveIncludedYears(period, includedYears, customer.activePeriods);
  const firstYear = years[0];

  const database = await readDatabase();
  const carryForwardRecord =
    database.carryForwards.find(
      (item) => item.customerId === customerId && item.toYear === firstYear
    ) ?? null;

  const charges = database.charges.filter(
    (charge) => charge.customerId === customerId && years.includes(charge.year)
  );
  const payments = database.payments.filter(
    (payment) =>
      payment.customerId === customerId && years.some((year) => isDateInPeriod(payment.date, year))
  );

  const openingBalance = carryForwardRecord?.balance ?? 0;

  const lines = buildStatementLines(
    firstYear,
    carryForwardRecord
      ? { fromYear: carryForwardRecord.fromYear, balance: carryForwardRecord.balance }
      : null,
    charges,
    payments
  );

  const totalCharges = roundMoney(charges.reduce((total, item) => total + item.amount, 0));
  const totalPayments = roundMoney(payments.reduce((total, item) => total + item.amount, 0));
  const closingBalance = roundMoney(
    lines.length ? lines[lines.length - 1].balance : openingBalance
  );
  const totalDebit = roundMoney(lines.reduce((total, line) => total + line.debit, 0));
  const totalCredit = roundMoney(lines.reduce((total, line) => total + line.credit, 0));
  const customerAddress = [customer.address, customer.district, customer.city]
    .filter(Boolean)
    .join(" ");

  return {
    customerId: customer.id,
    customerCode: customer.code,
    customerName: customer.name,
    customerPhone: customer.mobile || customer.phone,
    customerAddress,
    period,
    includedYears: years,
    periodLabel: formatIncludedYearsLabel(years),
    openingBalance,
    totalCharges,
    totalPayments,
    totalDebit,
    totalCredit,
    closingBalance,
    lines
  };
}

export async function buildStatementReports(
  period: number,
  customerIds?: string[],
  includedYears?: number[]
) {
  const customers = await listCustomers({ period });
  const selectedIds = customerIds?.length ? new Set(customerIds) : null;
  const filtered = selectedIds
    ? customers.filter((customer) => selectedIds.has(customer.id))
    : customers;

  const reports: StatementReport[] = [];
  for (const customer of filtered) {
    reports.push(await buildStatementReport(customer.id, period, includedYears));
  }

  return reports;
}

export async function buildStatementExportRows(
  period: number,
  customerIds?: string[],
  includedYears?: number[]
) {
  const [reports, office] = await Promise.all([
    buildStatementReports(period, customerIds, includedYears),
    getOfficeProfile()
  ]);
  const rows: Record<string, unknown>[] = [];

  for (const report of reports) {
    for (const line of report.lines) {
      rows.push({
        Kod: report.customerCode,
        Unvan: report.customerName,
        Dönem: report.periodLabel,
        Tarih: line.dateLabel,
        Açıklama: line.description,
        Borç: line.debit ? line.debit.toFixed(2).replace(".", ",") : "",
        Tahsilat: line.credit ? line.credit.toFixed(2).replace(".", ",") : "",
        Bakiye: line.balance.toFixed(2).replace(".", ",")
      });
    }

    rows.push({
      Kod: report.customerCode,
      Unvan: report.customerName,
      Dönem: report.periodLabel,
      Tarih: "",
      Açıklama: "TOPLAM",
      Borç: report.totalDebit.toFixed(2).replace(".", ","),
      Tahsilat: report.totalCredit.toFixed(2).replace(".", ","),
      Bakiye: report.closingBalance.toFixed(2).replace(".", ",")
    });

    rows.push({
      Kod: "",
      Unvan: "",
      Dönem: "",
      Tarih: "",
      Açıklama: "",
      Borç: "",
      Alacak: "",
      Bakiye: ""
    });
  }

  return { reports, office, rows };
}
