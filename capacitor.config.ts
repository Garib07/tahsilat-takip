import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.tahsilat.takip.mobile",
  appName: "Tahsilat Takip Mobil",
  webDir: "mobile-web",
  server: {
    url: "https://tahsilat-takip.aaydin07.workers.dev",
    cleartext: false
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
