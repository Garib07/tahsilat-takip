import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain, shell } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preloadPath = path.join(__dirname, "preload.cjs");
const isDev = process.env.ELECTRON_DEV === "1";
const isPackaged = app.isPackaged;
const SERVER_PORT = isDev ? "3000" : "3847";
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

let mainWindow = null;
let serverProcess = null;

function resolveDataDir() {
  return path.join(app.getPath("userData"), "data");
}

function ensureDataFile() {
  const dataDir = resolveDataDir();
  fs.mkdirSync(dataDir, { recursive: true });

  const dataFile = path.join(dataDir, "app-data.json");
  if (fs.existsSync(dataFile)) {
    return dataDir;
  }

  const seedCandidates = [
    path.join(process.resourcesPath, "seed", "app-data.json"),
    path.join(__dirname, "seed", "app-data.json"),
    path.join(__dirname, "empty-database.json")
  ];

  for (const seedPath of seedCandidates) {
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, dataFile);
      return dataDir;
    }
  }

  fs.writeFileSync(dataFile, "{}\n", "utf8");
  return dataDir;
}

function waitForServer(url, timeoutMs = 90000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function attempt() {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve(undefined);
          return;
        }
        retry();
      });

      request.on("error", retry);
      request.setTimeout(1500, () => {
        request.destroy();
        retry();
      });
    }

    function retry() {
      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Sunucu başlatılamadı."));
        return;
      }
      setTimeout(attempt, 500);
    }

    attempt();
  });
}

function buildServerEnv(dataDir) {
  const userData = app.getPath("userData");
  const {
    AUTH_USERNAME: _u,
    AUTH_PASSWORD: _p,
    AUTH_SECRET: _s,
    TURSO_DATABASE_URL: _url,
    TURSO_AUTH_TOKEN: _token,
    ...baseEnv
  } = process.env;

  return {
    ...baseEnv,
    TAHSILAT_DESKTOP: "1",
    TAHSILAT_USER_DATA: userData,
    TAHSILAT_SYNC_CONFIG: path.join(userData, "sync.json"),
    TAHSILAT_DATA_DIR: dataDir
  };
}

function startStandaloneServer(dataDir) {
  const standaloneDir = isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(process.cwd(), ".next", "standalone");
  const serverPath = path.join(standaloneDir, "server.js");

  if (!fs.existsSync(serverPath)) {
    throw new Error("Standalone sunucu bulunamadı. Önce npm run electron:pack komutunu çalıştırın.");
  }

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: standaloneDir,
    env: {
      ...buildServerEnv(dataDir),
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: SERVER_PORT,
      HOSTNAME: "0.0.0.0"
    },
    stdio: "inherit",
    windowsHide: true
  });

  serverProcess.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`Sunucu kapandı: ${code}`);
    }
  });
}

function startDevServer() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  serverProcess = spawn(npmCmd, ["run", "dev"], {
    cwd: process.cwd(),
    env: buildServerEnv(resolveDataDir()),
    stdio: "inherit",
    shell: false,
    windowsHide: true
  });
}

async function startBackend() {
  const dataDir = ensureDataFile();

  if (isDev) {
    startDevServer();
  } else {
    startStandaloneServer(dataDir);
  }

  await waitForServer(SERVER_URL);
}

function isLocalPrintUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
      parsed.pathname.startsWith("/reports/print")
    );
  } catch {
    return false;
  }
}

function isLocalAppUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

function buildWebPreferences() {
  return {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    preload: preloadPath
  };
}

async function waitForPrintContent(webContents, timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (webContents.isDestroyed()) {
      return false;
    }

    try {
      const ready = await webContents.executeJavaScript(`
        (() => {
          const doc = document.querySelector(".print-document");
          const rows = document.querySelectorAll(".statement-table tbody tr");
          return Boolean(doc && doc.offsetHeight > 120 && rows.length > 0);
        })()
      `);
      if (ready) return true;
    } catch {
      // Sayfa hâlâ yükleniyor.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return false;
}

function waitForPrintReady(webContents) {
  return webContents.executeJavaScript(`
    new Promise((resolve) => {
      const done = () => requestAnimationFrame(() => requestAnimationFrame(resolve));
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(done).catch(done);
      } else {
        done();
      }
    })
  `);
}

async function printWebContents(webContents) {
  const printWindow = BrowserWindow.fromWebContents(webContents);
  if (!printWindow || printWindow.isDestroyed()) {
    return { ok: false, error: "Yazdırma penceresi bulunamadı." };
  }

  const ready = await waitForPrintContent(webContents);
  if (!ready) {
    return { ok: false, error: "Ekstre içeriği hazır değil." };
  }

  await waitForPrintReady(webContents);
  printWindow.show();
  printWindow.focus();
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (webContents.isDestroyed()) {
    return { ok: false, error: "Yazdırma penceresi kapandı." };
  }

  try {
    await webContents.print({
      silent: false,
      printBackground: true
    });
    return { ok: true };
  } catch (error) {
    try {
      const pdf = await webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        margins: { marginType: "default" }
      });
      const tempPath = path.join(app.getPath("temp"), `cari-dokum-${Date.now()}.pdf`);
      fs.writeFileSync(tempPath, pdf);
      await shell.openPath(tempPath);
      return { ok: true, fallback: "pdf" };
    } catch (fallbackError) {
      const message =
        fallbackError instanceof Error
          ? fallbackError.message
          : error instanceof Error
            ? error.message
            : "Yazdırma başarısız.";
      return { ok: false, error: message };
    }
  }
}

async function triggerElectronPrint(printWindow) {
  if (printWindow.isDestroyed()) return;
  await printWebContents(printWindow.webContents);
}

function createPrintWindow(url) {
  const parsed = new URL(url);
  const shouldAutoPrint = parsed.searchParams.get("print") === "1";
  parsed.searchParams.delete("print");

  const printWindow = new BrowserWindow({
    width: 980,
    height: 900,
    title: "Cari Hesap Dökümü",
    autoHideMenuBar: true,
    show: false,
    webPreferences: buildWebPreferences()
  });

  printWindow.loadURL(parsed.toString());

  if (!shouldAutoPrint) {
    printWindow.once("ready-to-show", () => {
      printWindow.show();
    });
  }

  printWindow.webContents.setWindowOpenHandler(({ url: nextUrl }) => {
    if (isLocalPrintUrl(nextUrl)) {
      createPrintWindow(nextUrl);
      return { action: "deny" };
    }
    if (isLocalAppUrl(nextUrl)) {
      return { action: "deny" };
    }
    shell.openExternal(nextUrl);
    return { action: "deny" };
  });

  if (shouldAutoPrint) {
    printWindow.webContents.once("did-finish-load", () => {
      void triggerElectronPrint(printWindow);
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "Tahsilat Takip",
    autoHideMenuBar: true,
    webPreferences: buildWebPreferences()
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isLocalPrintUrl(url)) {
      createPrintWindow(url);
      return { action: "deny" };
    }
    if (isLocalAppUrl(url)) {
      return { action: "deny" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopServer() {
  if (!serverProcess || serverProcess.killed) return;

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"], { stdio: "ignore" });
  } else {
    serverProcess.kill("SIGTERM");
  }

  serverProcess = null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    ipcMain.handle("desktop-print", async (event) => printWebContents(event.sender));
    ipcMain.handle("desktop-close-window", (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window && !window.isDestroyed()) {
        window.close();
      }
      return { ok: true };
    });

    try {
      await startBackend();
      createWindow();
    } catch (error) {
      console.error(error);
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    stopServer();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
