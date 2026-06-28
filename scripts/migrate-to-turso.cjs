const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@libsql/client");

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!url || !token) {
    console.error("TURSO_DATABASE_URL ve TURSO_AUTH_TOKEN gerekli.");
    process.exit(1);
  }

  const sourcePath = path.join(process.cwd(), "data", "app-data.json");
  if (!fs.existsSync(sourcePath)) {
    console.error("data/app-data.json bulunamadı.");
    process.exit(1);
  }

  const payload = fs.readFileSync(sourcePath, "utf8");
  const parsed = JSON.parse(payload);
  const customerCount = Array.isArray(parsed.customers) ? parsed.customers.length : 0;
  const client = createClient({ url, authToken: token });

  await client.execute(`CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await client.execute(`CREATE TABLE IF NOT EXISTS app_backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  const existing = await client.execute("SELECT data FROM app_state WHERE id = 1");
  if (existing.rows[0]?.data) {
    await client.execute({
      sql: "INSERT INTO app_backups (data, created_at) VALUES (?, ?)",
      args: [String(existing.rows[0].data), new Date().toISOString()]
    });
    console.log("Mevcut bulut verisi yedeklendi.");
  }

  await client.execute({
    sql: `INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: [payload, new Date().toISOString()]
  });

  console.log(`Veri Turso'ya aktarildi: ${customerCount} cari`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
