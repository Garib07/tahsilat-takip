"use client";

import { useCallback, useEffect, useState } from "react";
import { StatementPrintDocument } from "@/components/statement-print-document";
import {
  closeDesktopWindow,
  isDesktopBridgeAvailable,
  printFromDesktopBridge
} from "@/lib/desktop-bridge";
import { OfficeProfile, StatementReport } from "@/lib/types";

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
  const [printError, setPrintError] = useState<string | null>(null);

  const handlePrint = useCallback(async () => {
    setPrintError(null);
    await waitForPrintLayout();

    if (isDesktopBridgeAvailable()) {
      const result = await printFromDesktopBridge();
      if (result?.ok) {
        if (result.fallback === "pdf") {
          setPrintError("Yazıcı penceresi açılamadı; PDF dosyası açıldı. Oradan yazdırın.");
        }
        return;
      }

      if (result?.error) {
        setPrintError(result.error);
      }
      return;
    }

    window.print();
  }, []);

  useEffect(() => {
    if (!autoPrint || isDesktopBridgeAvailable()) return;

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
      <div className="no-print mx-auto mb-4 flex max-w-[920px] flex-col items-end gap-2 px-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handlePrint()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Yazdır / PDF Kaydet
          </button>
          <button
            type="button"
            onClick={() => void closeDesktopWindow()}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>
        {printError ? <p className="text-xs text-rose-700">{printError}</p> : null}
      </div>

      <StatementPrintDocument reports={reports} office={office} />
    </div>
  );
}
