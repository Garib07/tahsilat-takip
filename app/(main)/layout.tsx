import { AppShell } from "@/components/app-shell";
import { getOfficeProfile } from "@/lib/store";
import { isAuthEnabled } from "@/lib/auth";
import { isCloudStorageEnabled, isDesktopLocalFirstStorage } from "@/lib/storage";
import { isDesktopApp } from "@/lib/sync-config";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const office = await getOfficeProfile();
  const cloudMode = isCloudStorageEnabled() && !isDesktopApp();
  const desktopSyncEnabled = isDesktopLocalFirstStorage();

  return (
    <AppShell
      office={office}
      showLogout={isAuthEnabled()}
      cloudMode={cloudMode}
      desktopSyncEnabled={desktopSyncEnabled}
    >
      {children}
    </AppShell>
  );
}
