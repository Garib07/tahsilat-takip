import { receivableStatusLabel, type ReceivableStatus } from "@/lib/receivables";

export function ReceivableStatusBadge({ status }: { status: ReceivableStatus }) {
  if (status === "doubtful") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        {receivableStatusLabel(status)}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      {receivableStatusLabel(status)}
    </span>
  );
}
