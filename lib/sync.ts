import {
  importRawDatabase,
  isCloudStorageEnabled,
  readLocalDatabaseOnly,
  readRawDatabase,
  resetStorageClients,
  writeLocalDatabaseOnly
} from "@/lib/storage";
import { getSyncConfigPath, isDesktopApp, readSyncConfig, writeSyncConfig } from "@/lib/sync-config";

export async function getSyncStatus() {
  const config = await readSyncConfig();

  return {
    desktop: isDesktopApp(),
    enabled: Boolean(config?.enabled && isCloudStorageEnabled()),
    appUrl: config?.appUrl ?? "",
    updatedAt: config?.updatedAt ?? "",
    hasCredentials: Boolean(config?.tursoDatabaseUrl && config?.tursoAuthToken),
    configPath: isDesktopApp() ? getSyncConfigPath() : ""
  };
}

export async function saveSyncSettings(input: {
  enabled: boolean;
  tursoDatabaseUrl: string;
  tursoAuthToken: string;
  appUrl: string;
}) {
  if (!isDesktopApp()) {
    throw new Error("Senkron ayarları yalnızca masaüstü uygulamasında kullanılabilir.");
  }

  const url = input.tursoDatabaseUrl.trim();
  const token = input.tursoAuthToken.trim();

  if (input.enabled && (!url || !token)) {
    throw new Error("Turso URL ve token zorunludur.");
  }

  if (input.enabled) {
    await writeSyncConfig({
      enabled: true,
      tursoDatabaseUrl: url,
      tursoAuthToken: token,
      appUrl: input.appUrl.trim()
    });
    resetStorageClients();
    await pushLocalToCloud();
    return getSyncStatus();
  }

  let cloudPayload: string | null = null;
  if (isCloudStorageEnabled()) {
    cloudPayload = await readRawDatabase();
  }

  await writeSyncConfig({
    enabled: false,
    tursoDatabaseUrl: url,
    tursoAuthToken: token,
    appUrl: input.appUrl.trim()
  });
  resetStorageClients();

  if (cloudPayload) {
    await writeLocalDatabaseOnly(cloudPayload);
  }

  return getSyncStatus();
}

export async function pushLocalToCloud() {
  const payload = await readLocalDatabaseOnly();
  resetStorageClients();
  await importRawDatabase(payload);
}

export async function pullCloudToLocal() {
  if (!isCloudStorageEnabled()) {
    return;
  }

  const payload = await readRawDatabase();
  await writeLocalDatabaseOnly(payload);
}

export async function syncNow() {
  if (!isDesktopApp()) {
    throw new Error("Senkron yalnızca masaüstü uygulamasında kullanılabilir.");
  }

  if (!isCloudStorageEnabled()) {
    throw new Error("Bulut senkronu kapalı veya yapılandırılmamış.");
  }

  resetStorageClients();
  await pullCloudToLocal();
  return getSyncStatus();
}
