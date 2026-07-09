"use client";

import { useState } from "react";
import { CustomerCardForm } from "@/components/customer-card-form";
import { useNativeMobileApp } from "@/lib/native-mobile-app";

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
  const nativeMobileApp = useNativeMobileApp();
  const floatingMode = nativeMobileApp;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          floatingMode
            ? "fixed bottom-5 right-5 z-40 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-slate-800"
            : "rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        }
      >
        {floatingMode ? "+ Cari" : label}
      </button>

      {open ? (
        <CustomerCardForm
          mode="create"
          period={period}
          nextCode={nextCode}
          compactMode={floatingMode}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
