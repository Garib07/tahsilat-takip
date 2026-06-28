import { AccessInfoPanel } from "@/components/access-info-panel";
import { CloudInfoPanel } from "@/components/cloud-info-panel";
import { OfficeProfileForm } from "@/components/office-profile-form";
import { SyncSettingsPanel } from "@/components/sync-settings-panel";
import { YearEndRolloverPanel } from "@/components/year-end-rollover-panel";
import { getOfficeProfile } from "@/lib/store";
import { isCloudStorageEnabled } from "@/lib/storage";
import { isDesktopApp } from "@/lib/sync-config";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const office = await getOfficeProfile();
  const cloudMode = isCloudStorageEnabled();
  const desktop = isDesktopApp();

  return (
    <>
      <OfficeProfileForm office={office} />
      <SyncSettingsPanel />
      {cloudMode && !desktop ? <CloudInfoPanel /> : null}
      {!cloudMode && !desktop ? <AccessInfoPanel /> : null}
      <YearEndRolloverPanel currentPeriod={office.period} />
    </>
  );
}
