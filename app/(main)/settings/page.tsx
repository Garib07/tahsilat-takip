import { AccessInfoPanel } from "@/components/access-info-panel";
import { CloudInfoPanel } from "@/components/cloud-info-panel";
import { OfficeProfileForm } from "@/components/office-profile-form";
import { YearEndRolloverPanel } from "@/components/year-end-rollover-panel";
import { getOfficeProfile } from "@/lib/store";
import { isCloudStorageEnabled } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const office = await getOfficeProfile();
  const cloudMode = isCloudStorageEnabled();

  return (
    <>
      <OfficeProfileForm office={office} />
      {cloudMode ? <CloudInfoPanel /> : <AccessInfoPanel />}
      <YearEndRolloverPanel currentPeriod={office.period} />
    </>
  );
}
