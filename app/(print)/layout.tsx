import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function PrintRootLayout({ children }: { children: ReactNode }) {
  return children;
}
