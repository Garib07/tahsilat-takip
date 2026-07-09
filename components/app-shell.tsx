"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getSidebarOfficeDisplay } from "@/lib/reports/office-header-display";
import { OfficeProfile } from "@/lib/types";

export function AppShell({
  office,
  children,
  showLogout = false,
  cloudMode = false
}: {
  office: OfficeProfile;
  children: ReactNode;
  showLogout?: boolean;
  cloudMode?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileControlMode, setMobileControlMode] = useState(false);
  const { title } = getSidebarOfficeDisplay(office);

  useEffect(() => {
    if (!cloudMode) return;

    function refreshOnFocus() {
      router.refresh();
    }

    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [cloudMode, router]);

  useEffect(() => {
    function syncMobileMode() {
      setMobileControlMode(window.matchMedia("(max-width: 767px)").matches);
    }

    syncMobileMode();
    window.addEventListener("resize", syncMobileMode);
    return () => window.removeEventListener("resize", syncMobileMode);
  }, []);

  useEffect(() => {
    if (!cloudMode || !mobileControlMode) return;
    const timer = window.setInterval(() => router.refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [cloudMode, mobileControlMode, router]);

  useEffect(() => {
    if (!mobileControlMode) return;
    const blockedInMobile = pathname.startsWith("/charges");
    if (blockedInMobile) {
      router.replace("/customers");
    }
  }, [mobileControlMode, pathname, router]);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      <div className="app-shell-mobile-bar no-print fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
          aria-label="Menüyü aç"
        >
          ☰
        </button>
        <p className="truncate px-2 text-sm font-semibold text-slate-800">{title}</p>
        <div className="w-[42px]" aria-hidden="true" />
      </div>

      <div className="hidden shrink-0 md:flex">
        <Sidebar office={office} showLogout={showLogout} cloudMode={cloudMode} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Menüyü kapat"
            onClick={closeMobileMenu}
          />
          <div className="absolute left-0 top-0 h-full w-[min(100%,18rem)] shadow-xl">
            <Sidebar
              office={office}
              onNavigate={closeMobileMenu}
              showLogout={showLogout}
              cloudMode={cloudMode}
              mobileControlMode={mobileControlMode}
            />
          </div>
        </div>
      ) : null}

      <main className="flex-1 overflow-auto pt-[57px] print:pt-0 md:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</div>
      </main>
    </div>
  );
}
