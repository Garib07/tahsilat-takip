import { OfficeProfile } from "@/lib/types";

export function StatementOfficeHeader({
  office,
  className = ""
}: {
  office: OfficeProfile;
  className?: string;
}) {
  const firmName = office.firmName || "";
  const phone = office.phone || office.mobile;
  const hasLogo = Boolean(office.logoDataUrl?.trim());

  if (!firmName && !phone && !hasLogo) return null;

  return (
    <div className={`statement-office-header flex w-full items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        {firmName ? (
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-slate-800">{firmName}</h1>
        ) : null}
        {phone ? <p className="mt-0.5 text-sm text-slate-600">Tel: {phone}</p> : null}
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
