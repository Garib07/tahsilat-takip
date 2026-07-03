import { getOfficeHeaderDisplay } from "@/lib/reports/office-header-display";
import { OfficeProfile } from "@/lib/types";

export function StatementOfficeHeader({
  office,
  className = ""
}: {
  office: OfficeProfile;
  className?: string;
}) {
  const { fullName, firmName, address, phones, hasLogo, hasContent } = getOfficeHeaderDisplay(office);

  if (!hasContent) return null;

  return (
    <div className={`statement-office-header flex w-full items-start justify-between gap-4 border-b-[3px] border-slate-700 pb-2 ${className}`}>
      <div className="min-w-0 flex-1">
        {fullName ? (
          <p className="text-[22px] font-bold uppercase leading-tight tracking-tight text-slate-800">
            {fullName}
          </p>
        ) : null}
        {firmName ? (
          <p
            className={`font-semibold leading-snug text-slate-800 ${
              fullName ? "mt-1 text-base" : "text-[22px] font-bold leading-tight tracking-tight"
            }`}
          >
            {firmName}
          </p>
        ) : null}
        {address ? <p className="mt-1.5 text-sm text-slate-600">{address}</p> : null}
        {phones ? <p className="mt-0.5 text-sm text-slate-600">Tel: {phones}</p> : null}
      </div>
      {hasLogo ? (
        <div className="statement-logo-box flex h-16 w-24 shrink-0 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={office.logoDataUrl}
            alt="Logo"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
