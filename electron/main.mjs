import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, shell } from "electron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: SERVER_PORT,
      HOSTNAME: "0.0.0.0",
      TAHSILAT_DATA_DIR: dataDir
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
    env: {
      ...process.env,
      TAHSILAT_DATA_DIR: resolveDataDir()
    },
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "Tahsilat Takip",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
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
