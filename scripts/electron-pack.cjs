const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const envPath = path.join(root, ".env");
const envBackup = path.join(root, ".env.build-backup");
const distElectron = path.join(root, "dist-electron");

function run(command) {
  execSync(command, { stdio: "inherit", cwd: root, env: { ...process.env, ELECTRON_BUILD: "1" } });
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function stopRunningApp() {
  if (process.platform !== "win32") {
    return;
  }

  for (const imageName of ["Tahsilat Takip.exe", "electron.exe"]) {
    try {
      execSync(`taskkill /F /IM "${imageName}" /T`, { stdio: "ignore" });
    } catch {
      // Uygulama acik degil.
    }
  }

  try {
    execSync(
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3847 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
      { stdio: "ignore" }
    );
  } catch {
    // Port bos.
  }
}

function prepareDistDir(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  stopRunningApp();
  sleepSync(1500);

  const staleDir = `${dir}.old-${Date.now()}`;
  try {
    fs.renameSync(dir, staleDir);
    console.log(`Eski dist-electron "${path.basename(staleDir)}" olarak tasindi.`);
    return;
  } catch {
    // rename basarisizsa silmeyi dene
  }

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      fs.rmSync(dir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 500
      });
      return;
    } catch (error) {
      if (attempt < 5) {
        console.log(`dist-electron temizlenemedi, tekrar deneniyor (${attempt}/5)...`);
        stopRunningApp();
        sleepSync(1000 * attempt);
        continue;
      }

      throw new Error(
        "dist-electron klasoru kullanimda. File Explorer'da dist-electron klasorunu kapatip tekrar deneyin.",
        { cause: error }
      );
    }
  }
}

try {
  if (fs.existsSync(envPath)) {
    fs.renameSync(envPath, envBackup);
    console.log(".env build sirasinda devre disi birakildi (masaustu giris ekrani onlenir).");
  }

  prepareDistDir(distElectron);
  console.log("dist-electron hazirlandi.");

  run("next build");
  run("node scripts/prepare-standalone.cjs");
  run("npx electron-builder --win");

  const setupExe = path.join(distElectron, "Tahsilat-Takip-Setup-2.0.0.exe");
  if (!fs.existsSync(setupExe)) {
    throw new Error("Kurulum dosyasi olusturulamadi: Tahsilat-Takip-Setup-2.0.0.exe bulunamadi.");
  }

  console.log(`Kurulum dosyasi hazir: ${setupExe}`);
} finally {
  if (fs.existsSync(envBackup)) {
    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath);
    }
    fs.renameSync(envBackup, envPath);
    console.log(".env geri yuklendi.");
  }
}
