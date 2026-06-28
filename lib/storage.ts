import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createClient, type Client } from "@libsql/client";
import { isDesktopApp, readSyncConfigSync } from "./sync-config";

const emptyPayload = JSON.stringify({
  customers: [],
  charges: [],
  payments: [],
  carryForwards: [],
  office: {
    period: new Date().getFullYear(),
    currency: "TL",
    firmName: "",
    authorizedPerson: "",
    mobile: "",
    phone: "",
    fax: "",
    address: "",
    city: "",
    district: "",
    taxOffice: "",
    taxNumber: "",
    email: "",
    website: "",
    logoDataUrl: "",
    updatedAt: ""
  }
});

export function isCloudStorageEnabled() {
  return Boolean(getTursoCredentials());
}

function getTursoCredentials() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      token: process.env.TURSO_AUTH_TOKEN
    };
  }

  if (!isDesktopApp()) {
    return null;
  }

  const config = readSyncConfigSync();
  if (config?.enabled && config.tursoDatabaseUrl && config.tursoAuthToken) {
    return {
      url: config.tursoDatabaseUrl,
      token: config.tursoAuthToken
    };
  }

  return null;
}

export function resetStorageClients() {
  tursoClient = null;
  schemaReady = false;
}

function resolveDataDir() {
  if (process.env.TAHSILAT_DATA_DIR) {
    return path.resolve(process.env.TAHSILAT_DATA_DIR);
  }
  return path.join(process.cwd(), "data");
}

function getDataFile() {
  return path.join(resolveDataDir(), "app-data.json");
}

export function getDataDirectory() {
  return resolveDataDir();
}

let tursoClient: Client | null = null;
let schemaReady = false;

function getTursoClient() {
  const credentials = getTursoCredentials();
  if (!credentials) {
    throw new Error("Turso yapılandırması eksik.");
  }

  if (!tursoClient) {
    tursoClient = createClient({
      url: credentials.url,
      authToken: credentials.token
    });
  }

  return tursoClient;
}

async function ensureTursoSchema(client: Client) {
  if (schemaReady) return;

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

  schemaReady = true;
}

async function readFromFile(): Promise<string> {
  const dataDir = resolveDataDir();
  const dataFile = getDataFile();

  await mkdir(dataDir, { recursive: true });

  try {
    return await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, emptyPayload, "utf8");
    return emptyPayload;
  }
}

async function mirrorLocalBackup(payload: string) {
  if (!isDesktopApp() || !isCloudStorageEnabled()) {
    return;
  }

  const dataFile = getDataFile();
  await mkdir(resolveDataDir(), { recursive: true });
  await writeFile(dataFile, payload, "utf8");
}

export async function writeLocalDatabaseOnly(payload: string) {
  const dataFile = getDataFile();
  await mkdir(resolveDataDir(), { recursive: true });
  await writeFile(dataFile, payload, "utf8");
}

export async function readLocalDatabaseOnly() {
  return readFromFile();
}

async function writeToFile(payload: string) {
  await writeLocalDatabaseOnly(payload);
}

async function readFromTurso(): Promise<string> {
  const client = getTursoClient();
  await ensureTursoSchema(client);

  const result = await client.execute("SELECT data FROM app_state WHERE id = 1");
  const row = result.rows[0];

  if (!row?.data) {
    await client.execute({
      sql: "INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)",
      args: [emptyPayload, new Date().toISOString()]
    });
    return emptyPayload;
  }

  return String(row.data);
}

async function writeToTurso(payload: string) {
  const client = getTursoClient();
  await ensureTursoSchema(client);

  await client.execute({
    sql: `INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    args: [payload, new Date().toISOString()]
  });
}

export async function readRawDatabase(): Promise<string> {
  if (isCloudStorageEnabled()) {
    return readFromTurso();
  }
  return readFromFile();
}

export async function writeRawDatabase(payload: string) {
  if (isCloudStorageEnabled()) {
    await writeToTurso(payload);
    await mirrorLocalBackup(payload);
    return;
  }
  await writeToFile(payload);
}

export async function importRawDatabase(payload: string) {
  await writeRawDatabase(payload);
}

export async function createDatabaseBackup() {
  if (!isCloudStorageEnabled()) {
    throw new Error("Yedekleme yalnızca bulut modunda kullanılabilir.");
  }

  const client = getTursoClient();
  await ensureTursoSchema(client);

  const payload = await readFromTurso();
  const createdAt = new Date().toISOString();

  const insert = await client.execute({
    sql: "INSERT INTO app_backups (data, created_at) VALUES (?, ?)",
    args: [payload, createdAt]
  });

  await client.execute(`
    DELETE FROM app_backups
    WHERE id NOT IN (
      SELECT id FROM app_backups ORDER BY id DESC LIMIT 30
    )
  `);

  return {
    id: Number(insert.lastInsertRowid ?? 0),
    createdAt
  };
}

export async function listDatabaseBackups(limit = 10) {
  if (!isCloudStorageEnabled()) {
    return [];
  }

  const client = getTursoClient();
  await ensureTursoSchema(client);

  const result = await client.execute({
    sql: "SELECT id, created_at FROM app_backups ORDER BY id DESC LIMIT ?",
    args: [limit]
  });

  return result.rows.map((row) => ({
    id: Number(row.id),
    createdAt: String(row.created_at)
  }));
}
