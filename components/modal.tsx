"use client";

import { ReactNode, useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div
        className={`relative w-full rounded-xl border border-slate-200 bg-white p-6 shadow-xl ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Kapat
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
