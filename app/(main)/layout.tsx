import { AppShell } from "@/components/app-shell";
import { getOfficeProfile } from "@/lib/store";
import { isAuthEnabled } from "@/lib/auth";
import { isCloudStorageEnabled } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const office = await getOfficeProfile();

  return (
    <AppShell
      office={office}
      showLogout={isAuthEnabled()}
      cloudMode={isCloudStorageEnabled()}
    >
      {children}
    </AppShell>
  );
}
