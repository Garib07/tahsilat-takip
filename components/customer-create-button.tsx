"use client";

import { useEffect, useState } from "react";
import { CustomerCardForm } from "@/components/customer-card-form";

export function CustomerCreateButton({
  period,
  nextCode,
  label = "Yeni Cari Ekle",
  floatingOnMobile = false
}: {
  period: number;
  nextCode: string;
  label?: string;
  floatingOnMobile?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function syncMobile() {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    }
    syncMobile();
    window.addEventListener("resize", syncMobile);
    return () => window.removeEventListener("resize", syncMobile);
  }, []);

  const floatingMode = floatingOnMobile && isMobile;
  const hiddenOnDesktop = floatingOnMobile && !isMobile;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          hiddenOnDesktop
            ? "hidden"
            : floatingMode
            ? "fixed bottom-5 right-5 z-40 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-slate-800 md:hidden"
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
