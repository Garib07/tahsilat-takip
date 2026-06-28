"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOfficePeriodAction } from "@/lib/actions";
import { periodYearOptions } from "@/lib/period";

export function PeriodSwitcher({ period }: { period: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const years = periodYearOptions();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = Number(event.target.value);
    if (next === period) return;

    startTransition(async () => {
      await updateOfficePeriodAction(next);
      router.refresh();
    });
  }

  return (
    <label className="mt-1 inline-flex max-w-full items-center gap-1">
      <span className="sr-only">Aktif dönem</span>
      <select
        value={period}
        onChange={handleChange}
        disabled={pending}
        className="cursor-pointer appearance-none rounded-md border border-transparent bg-transparent py-0.5 pl-0 pr-5 text-sm text-slate-500 outline-none transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700 focus:border-slate-300 focus:bg-white focus:text-slate-800 disabled:opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0 center",
          backgroundSize: "1rem"
        }}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year} Dönemi
          </option>
        ))}
      </select>
    </label>
  );
}
