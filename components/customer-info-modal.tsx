"use client";

import { CustomerPeriodsPanel } from "@/components/customer-periods-panel";
import { Modal } from "@/components/modal";
import { getCustomerFeeForYear } from "@/lib/fees";
import { formatCurrency, formatDateLabel } from "@/lib/format";
import { Customer } from "@/lib/types";

function InfoItem({
  label,
  value,
  className = ""
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-slate-800">{value || "—"}</p>
    </div>
  );
}

export function CustomerInfoModal({
  customer,
  viewPeriod,
  onClose
}: {
  customer: Customer;
  viewPeriod: number;
  onClose: () => void;
}) {
  const monthlyFee = getCustomerFeeForYear(customer, viewPeriod);

  return (
    <Modal open onClose={onClose} title="Cari Bilgileri" wide>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="mb-2">
          <p className="text-lg font-semibold text-slate-900">{customer.name}</p>
          {customer.code ? (
            <p className="mt-0.5 font-mono text-xs text-slate-500">{customer.code}</p>
          ) : null}
        </div>

        <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Kod" value={customer.code} />
          <InfoItem label="Özel Kod" value={customer.specialCode} />
          <InfoItem label="Yetkili" value={customer.authorizedPerson} />
          <InfoItem label="Gsm" value={customer.mobile} />
          <InfoItem label="Telefon" value={customer.phone} />
          <InfoItem label="Faks" value={customer.fax} />
          <InfoItem
            label="Adres"
            value={customer.address}
            className="md:col-span-2 lg:col-span-3"
          />
          <InfoItem label="İl" value={customer.city} />
          <InfoItem label="İlçe" value={customer.district} />
          <InfoItem label="V. Daire" value={customer.taxOffice} />
          <InfoItem label="TC - V.No" value={customer.taxNumber} />
          <InfoItem label="E-Posta" value={customer.email} />
          <InfoItem label="Web" value={customer.website} />
          <InfoItem
            label={`Aylık Ücret (${viewPeriod})`}
            value={formatCurrency(monthlyFee)}
          />
          <InfoItem
            label="Sözleşme / Açılış"
            value={customer.openedAt ? formatDateLabel(customer.openedAt) : ""}
          />
          <InfoItem
            label="Sözleşme / Kapanış"
            value={customer.closedAt ? formatDateLabel(customer.closedAt) : ""}
          />
        </div>

        <CustomerPeriodsPanel customer={customer} viewPeriod={viewPeriod} embedded />
      </div>
    </Modal>
  );
}
