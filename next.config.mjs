/** @type {import('next').NextConfig} */
const nextConfig = {};

// Masaustu .exe paketi icin; Vercel deploy'unu bozmaz.
if (process.env.ELECTRON_BUILD === "1") {
  nextConfig.output = "standalone";
  nextConfig.outputFileTracingExcludes = {
    "*": ["dist-electron/**", "data/**", ".git/**"]
  };
}

export default nextConfig;
