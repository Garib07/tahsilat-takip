import { ReportsPanel } from "@/components/reports-panel";
import { getPeriodContext, listCustomers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { period } = await getPeriodContext();
  const customers = await listCustomers({ period });

  return <ReportsPanel period={period} customers={customers} />;
}
