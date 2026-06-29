"use client";

import { useCallback, useEffect } from "react";
import { StatementPrintDocument } from "@/components/statement-print-document";
import { OfficeProfile, StatementReport } from "@/lib/types";

function isElectronApp() {
  return typeof navigator !== "undefined" && navigator.userAgent.includes("Electron");
}

async function waitForPrintLayout() {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function StatementPrintView({
  reports,
  office,
  autoPrint = false
}: {
  reports: StatementReport[];
  office: OfficeProfile;
  autoPrint?: boolean;
}) {
  const handlePrint = useCallback(async () => {
    await waitForPrintLayout();
    window.print();
  }, []);

  useEffect(() => {
    if (!autoPrint || isElectronApp()) return;

    let cancelled = false;

    async function run() {
      await waitForPrintLayout();
      if (!cancelled) window.print();
    }

    const timer = window.setTimeout(() => {
      void run();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [autoPrint]);

  return (
    <div className="statement-print-shell min-h-screen py-6 print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[920px] justify-end gap-2 px-6">
        <button
          type="button"
          onClick={() => void handlePrint()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Yazdır / PDF Kaydet
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Kapat
        </button>
      </div>

      <StatementPrintDocument reports={reports} office={office} />
    </div>
  );
}
