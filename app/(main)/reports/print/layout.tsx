import type { ReactNode } from "react";

export default function ReportsPrintLayout({ children }: { children: ReactNode }) {
  return <div className="statement-print-page -mx-6 -my-8 min-h-screen bg-slate-100 print:m-0 print:bg-white">{children}</div>;
}
