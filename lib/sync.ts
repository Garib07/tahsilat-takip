import {
  importRawDatabase,
  isCloudStorageEnabled,
  readLocalDatabaseOnly,
  readRawDatabase,
  resetStorageClients,
  writeLocalDatabaseOnly
} from "@/lib/storage";
import { getSyncConfigPath, isDesktopApp, readSyncConfig, writeSyncConfig } from "@/lib/sync-config";

function scoreDatabasePayload(payload: string) {
  try {
    const data = JSON.parse(payload) as {
      customers?: unknown[];
      charges?: unknown[];
      payments?: unknown[];
    };
    const customers = data.customers?.length ?? 0;
    const charges = data.charges?.length ?? 0;
    const payments = data.payments?.length ?? 0;
    return customers * 1000 + charges * 10 + payments;
  } catch {
    return 0;
  }
}

async function reconcileLocalAndCloud() {
  const localPayload = await readLocalDatabaseOnly();
  resetStorageClients();

  let cloudPayload: string;
  try {
    cloudPayload = await readRawDatabase();
  } catch {
    await importRawDatabase(localPayload);
    return;
  }

  const localScore = scoreDatabasePayload(localPayload);
  const cloudScore = scoreDatabasePayload(cloudPayload);

  if (cloudScore > localScore) {
    await writeLocalDatabaseOnly(cloudPayload);
    return;
  }

  if (localScore > cloudScore) {
    resetStorageClients();
    await importRawDatabase(localPayload);
    return;
  }

  if (cloudScore > 0) {
    await writeLocalDatabaseOnly(cloudPayload);
  }
}

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
    await reconcileLocalAndCloud();
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
  if (!isCloudStorageEnabled()) {
    return;
  }

  const localPayload = await readLocalDatabaseOnly();
  if (scoreDatabasePayload(localPayload) === 0) {
    throw new Error("Yerel veri bos. Buluta bos veri gonderilmedi.");
  }

  resetStorageClients();
  await importRawDatabase(localPayload);
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
