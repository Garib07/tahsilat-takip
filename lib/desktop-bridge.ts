export type DesktopPrintResult = {
  ok: boolean;
  fallback?: "pdf";
  error?: string;
};

export type TahsilatDesktopBridge = {
  isDesktop: boolean;
  print: () => Promise<DesktopPrintResult>;
  closeWindow: () => Promise<{ ok: boolean }>;
};

declare global {
  interface Window {
    tahsilatDesktop?: TahsilatDesktopBridge;
  }
}

export function isDesktopBridgeAvailable() {
  return typeof window !== "undefined" && Boolean(window.tahsilatDesktop?.print);
}

export async function printFromDesktopBridge() {
  if (!window.tahsilatDesktop?.print) {
    return null;
  }
  return window.tahsilatDesktop.print();
}

export async function closeDesktopWindow() {
  if (window.tahsilatDesktop?.closeWindow) {
    await window.tahsilatDesktop.closeWindow();
    return;
  }
  window.close();
}
