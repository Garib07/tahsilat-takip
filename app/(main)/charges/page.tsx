import { GenerateChargesPanel } from "@/components/generate-charges-panel";
import { ChargesTable } from "@/components/charges-table";
import { PeriodBadge } from "@/components/period-badge";
import { PageHeader } from "@/components/ui";
import { formatPeriodLabel } from "@/lib/period";
import { getPeriodContext, listCharges, listCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ChargesPage() {
  const { period, month } = await getPeriodContext();
  const [charges, customers] = await Promise.all([
    listCharges({ period }),
    listCustomers({ period })
  ]);
  const customerMap = Object.fromEntries(customers.map((customer) => [customer.id, customer.name]));

  return (
    <>
      <PageHeader
        title="Toplu Tahakkuk"
        description={`${formatPeriodLabel(period)} · mükellef ve ay seçerek tahakkuk oluşturun`}
        action={<PeriodBadge period={period} />}
      />

      <section className="mb-8">
        <GenerateChargesPanel
          initialMonth={month}
          period={period}
          customers={customers}
          charges={charges}
        />
      </section>

      <ChargesTable charges={charges} period={period} customerMap={customerMap} />
    </>
  );
}
