const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const envPath = path.join(root, ".env");

if (!fs.existsSync(envPath)) {
  console.error(".env bulunamadi. Secret'lar icin .env gerekli.");
  process.exit(1);
}

const keys = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "AUTH_SECRET",
  "AUTH_USERNAME",
  "AUTH_PASSWORD",
  "CRON_SECRET"
];

const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  let value = trimmed.slice(idx + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  env[key] = value;
}

for (const key of keys) {
  if (!env[key]) {
    console.error(`Eksik: ${key}`);
    process.exit(1);
  }
}

for (const key of keys) {
  console.log(`Secret ayarlaniyor: ${key} (len=${env[key].length})`);
  const result = spawnSync("npx", ["wrangler", "secret", "put", key], {
    cwd: root,
    input: Buffer.from(env[key], "utf8"),
    encoding: "utf8",
    shell: true
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    console.error(`HATA: ${key} yuklenemedi.`);
    process.exit(result.status || 1);
  }
}

console.log("Tum secret'lar ayarlandi.");
