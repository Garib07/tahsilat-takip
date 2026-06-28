import { notFound } from "next/navigation";
import { CustomerDetailHeader } from "@/components/customer-detail-header";
import { CustomerLedgerTable } from "@/components/customer-ledger-table";
import { StatCard } from "@/components/ui";
import { getCustomerFeeForYear } from "@/lib/fees";
import { formatCurrency } from "@/lib/format";
import { formatPeriodLabel } from "@/lib/period";
import { getCustomerStatement, getPeriodContext } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { period: viewPeriod } = await getPeriodContext();

  let statement;
  try {
    statement = await getCustomerStatement(id, viewPeriod);
  } catch {
    notFound();
  }

  const { customer, charges, payments, period, carryForward, openingBalance } = statement;
  const totalCharges = charges.reduce((total, item) => total + item.amount, 0);
  const totalPayments = payments.reduce((total, item) => total + item.amount, 0);
  const balance = Math.round((openingBalance + totalCharges - totalPayments) * 100) / 100;
  const defaultMonthlyFee = getCustomerFeeForYear(customer, period);

  return (
    <>
      <CustomerDetailHeader
        customer={customer}
        period={period}
        description={`${formatPeriodLabel(period)} ekstre`}
      />

      <section
        className={`mb-8 grid gap-4 ${openingBalance !== 0 ? "md:grid-cols-4" : "md:grid-cols-3"}`}
      >
        {openingBalance !== 0 ? (
          <StatCard title="Devir Bakiyesi" value={formatCurrency(openingBalance)} />
        ) : null}
        <StatCard title="Toplam Tahakkuk" value={formatCurrency(totalCharges)} />
        <StatCard title="Toplam Tahsilat" value={formatCurrency(totalPayments)} tone="success" />
        <StatCard
          title="Bakiye"
          value={formatCurrency(balance)}
          tone={balance > 0 ? "danger" : "default"}
        />
      </section>

      <CustomerLedgerTable
        customerId={customer.id}
        period={period}
        charges={charges}
        payments={payments}
        defaultMonthlyFee={defaultMonthlyFee}
        carryForward={carryForward}
        openingBalance={openingBalance}
      />
    </>
  );
}
