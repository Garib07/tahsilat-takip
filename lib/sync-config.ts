import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SyncConfig = {
  enabled: boolean;
  tursoDatabaseUrl: string;
  tursoAuthToken: string;
  appUrl: string;
  updatedAt: string;
};

export function isDesktopApp() {
  return process.env.TAHSILAT_DESKTOP === "1";
}

export function getSyncConfigPath() {
  if (process.env.TAHSILAT_SYNC_CONFIG) {
    return path.resolve(process.env.TAHSILAT_SYNC_CONFIG);
  }
  if (process.env.TAHSILAT_USER_DATA) {
    return path.join(process.env.TAHSILAT_USER_DATA, "sync.json");
  }
  return path.join(process.cwd(), "data", "sync.json");
}

export function readSyncConfigSync(): SyncConfig | null {
  const filePath = getSyncConfigPath();
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const config = JSON.parse(readFileSync(filePath, "utf8")) as Partial<SyncConfig>;
    if (!config.tursoDatabaseUrl || !config.tursoAuthToken) {
      return null;
    }

    return {
      enabled: Boolean(config.enabled),
      tursoDatabaseUrl: String(config.tursoDatabaseUrl),
      tursoAuthToken: String(config.tursoAuthToken),
      appUrl: String(config.appUrl ?? ""),
      updatedAt: String(config.updatedAt ?? "")
    };
  } catch {
    return null;
  }
}

export async function readSyncConfig(): Promise<SyncConfig | null> {
  const filePath = getSyncConfigPath();
  try {
    const config = JSON.parse(await readFile(filePath, "utf8")) as Partial<SyncConfig>;
    if (!config.tursoDatabaseUrl || !config.tursoAuthToken) {
      return null;
    }

    return {
      enabled: Boolean(config.enabled),
      tursoDatabaseUrl: String(config.tursoDatabaseUrl),
      tursoAuthToken: String(config.tursoAuthToken),
      appUrl: String(config.appUrl ?? ""),
      updatedAt: String(config.updatedAt ?? "")
    };
  } catch {
    return null;
  }
}

export async function writeSyncConfig(input: Partial<SyncConfig>) {
  const filePath = getSyncConfigPath();
  await mkdir(path.dirname(filePath), { recursive: true });

  const existing = await readSyncConfig();
  const next: SyncConfig = {
    enabled: input.enabled ?? existing?.enabled ?? false,
    tursoDatabaseUrl: input.tursoDatabaseUrl ?? existing?.tursoDatabaseUrl ?? "",
    tursoAuthToken: input.tursoAuthToken ?? existing?.tursoAuthToken ?? "",
    appUrl: input.appUrl ?? existing?.appUrl ?? "",
    updatedAt: new Date().toISOString()
  };

  await writeFile(filePath, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function isDesktopSyncEnabled() {
  if (!isDesktopApp()) {
    return false;
  }

  const config = readSyncConfigSync();
  return Boolean(config?.enabled);
}
