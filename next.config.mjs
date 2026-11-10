/** @type {import('next').NextConfig} */
const nextConfig = {};

// Masaustu .exe paketi icin; Cloudflare deploy'unu bozmaz.
if (process.env.ELECTRON_BUILD === "1") {
  nextConfig.output = "standalone";
  nextConfig.outputFileTracingExcludes = {
    "*": ["dist-electron/**", "data/**", ".git/**", ".open-next/**"]
  };
}

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
