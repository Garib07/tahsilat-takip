"use client";

import { useState } from "react";
import { CustomerCardForm } from "@/components/customer-card-form";

export function CustomerCreateButton({
  period,
  nextCode,
  label = "Yeni Cari Ekle"
}: {
  period: number;
  nextCode: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        {label}
      </button>

      {open ? (
        <CustomerCardForm mode="create" period={period} nextCode={nextCode} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
