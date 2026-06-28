import { PaymentCreateButton } from "@/components/payment-create-button";
import { PaymentsTable } from "@/components/payments-table";
import { PeriodBadge } from "@/components/period-badge";
import { PageHeader } from "@/components/ui";
import { formatPeriodLabel } from "@/lib/period";
import { getPeriodContext, getCustomerNameMap, listCustomers, listPayments } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const { period } = await getPeriodContext();
  const [payments, customers, customerMap] = await Promise.all([
    listPayments({ period }),
    listCustomers({ period }),
    getCustomerNameMap()
  ]);

  return (
    <>
      <PageHeader
        title="Kasa (Tahsilat)"
        description={`${formatPeriodLabel(period)} tahsilat hareketleri`}
        action={
          <div className="flex items-center gap-3">
            <PeriodBadge period={period} />
            <PaymentCreateButton customers={customers} period={period} />
          </div>
        }
      />

      <PaymentsTable payments={payments} period={period} customerMap={customerMap} />
    </>
  );
}
