"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PeriodSwitcher } from "@/components/period-switcher";
import { OfficeProfile } from "@/lib/types";

const menuItems = [
  { href: "/", label: "Gösterge Paneli", icon: "◫" },
  { href: "/customers", label: "Cariler (Mükellefler)", icon: "◉" },
  { href: "/charges", label: "Toplu Tahakkuk", icon: "◧" },
  { href: "/payments", label: "Kasa (Tahsilat)", icon: "◈" },
  { href: "/reports", label: "Raporlar", icon: "▤" },
  { href: "/settings", label: "Firma Yönetimi", icon: "⚙" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function getSidebarSubtitle(office: OfficeProfile) {
  return office.authorizedPerson || null;
}

export function Sidebar({
  office,
  onNavigate,
  showLogout = false,
  cloudMode = false
}: {
  office: OfficeProfile;
  onNavigate?: () => void;
  showLogout?: boolean;
  cloudMode?: boolean;
}) {
  const pathname = usePathname();
  const title = office.firmName || "Tahsilat Takip";
  const subtitle = getSidebarSubtitle(office);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-5">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        <PeriodSwitcher period={office.period} />
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="text-base text-slate-400">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
        <p>{cloudMode ? "Bulut veri · HTTPS · v2.0" : "Yerel veri · v2.0"}</p>
        {showLogout ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-left text-slate-500 hover:text-slate-800"
          >
            Çıkış yap
          </button>
        ) : null}
      </div>
    </aside>
  );
}
