"use client";

import { ReceivableStatus } from "@/lib/receivables";

export function ReceivableStatusFilter({
  value,
  onChange
}: {
  value: "all" | ReceivableStatus;
  onChange: (value: "all" | ReceivableStatus) => void;
}) {
  const options: Array<{ value: "all" | ReceivableStatus; label: string }> = [
    { value: "all", label: "Tümü" },
    { value: "normal", label: "Normal" },
    { value: "doubtful", label: "Şüpheli" }
  ];

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            value === option.value
              ? option.value === "doubtful"
                ? "bg-amber-100 text-amber-900"
                : "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
