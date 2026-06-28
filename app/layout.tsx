import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tahsilat Takip",
  description: "Mali müşavirler için tahakkuk ve tahsilat takibi"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
