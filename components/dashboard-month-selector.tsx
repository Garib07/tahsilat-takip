"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { monthNames } from "@/lib/format";
import { resolvePeriodMonth } from "@/lib/period";

export function DashboardMonthSelector({
  period,
  selectedMonth
}: {
  period: number;
  selectedMonth: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const defaultMonth = resolvePeriodMonth(period);

  function selectMonth(month: number) {
    if (month === selectedMonth) return;

    startTransition(() => {
      const params = new URLSearchParams();
      if (month !== defaultMonth) {
        params.set("month", String(month));
      }
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {monthNames.map((name, index) => {
        const month = index + 1;
        const active = month === selectedMonth;

        return (
          <button
            key={name}
            type="button"
            disabled={pending}
            onClick={() => selectMonth(month)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
              active
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
