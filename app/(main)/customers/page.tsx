import Link from "next/link";
import { ActivateCustomerPanel } from "@/components/activate-customer-panel";
import { CustomerCreateButton } from "@/components/customer-create-button";
import { CustomersTable } from "@/components/customers-table";
import { PeriodBadge } from "@/components/period-badge";
import { PageHeader } from "@/components/ui";
import { formatPeriodLabel } from "@/lib/period";
import {
  getNextCustomerCode,
  getPeriodContext,
  listCustomers,
  listCustomersNotInPeriod
} from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { period } = await getPeriodContext();
  const [customers, nextCode, inactiveCustomers] = await Promise.all([
    listCustomers({ period }),
    getNextCustomerCode(),
    listCustomersNotInPeriod(period)
  ]);

  return (
    <>
      <PageHeader
        title="Cariler (Mükellefler)"
        description={formatPeriodLabel(period)}
        action={
          <div className="flex items-center gap-3">
            <PeriodBadge period={period} />
            <Link
              href="/reports"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Raporlar
            </Link>
            <CustomerCreateButton period={period} nextCode={nextCode} />
          </div>
        }
      />

      <ActivateCustomerPanel customers={inactiveCustomers} period={period} />
      <CustomersTable customers={customers} period={period} />
    </>
  );
}
