"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaymentEditModal } from "@/components/payment-edit-modal";
import { deletePaymentAction } from "@/lib/actions";
import { Payment } from "@/lib/types";

const actionButtonClass =
  "rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50";

export function PaymentActions({
  payment,
  period,
  customerId
}: {
  payment: Payment;
  period: number;
  customerId: string;
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm("Bu tahsilat kaydı silinsin mi?");
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deletePaymentAction(payment.id, customerId);
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Tahsilat silinemedi.");
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button" className={actionButtonClass} onClick={() => setShowEdit(true)}>
          Düzenle
        </button>
        <button
          type="button"
          className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          onClick={handleDelete}
          disabled={pending}
        >
          Sil
        </button>
      </div>

      {showEdit ? (
        <PaymentEditModal
          payment={payment}
          period={period}
          customerId={customerId}
          onClose={() => setShowEdit(false)}
        />
      ) : null}
    </>
  );
}
