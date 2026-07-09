"use client";

import { useEffect, useState } from "react";

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
};

/** True only inside the Capacitor APK/WebView — not mobile Safari/Chrome. */
export function isNativeMobileApp(): boolean {
  if (typeof window === "undefined") return false;
  return (window as CapacitorWindow).Capacitor?.isNativePlatform?.() === true;
}

export function useNativeMobileApp(): boolean {
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isNativeMobileApp());
  }, []);

  return native;
}
