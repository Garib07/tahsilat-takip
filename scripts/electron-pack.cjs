const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const envPath = path.join(root, ".env");
const envBackup = path.join(root, ".env.build-backup");

function run(command) {
  execSync(command, { stdio: "inherit", cwd: root, env: { ...process.env, ELECTRON_BUILD: "1" } });
}

try {
  if (fs.existsSync(envPath)) {
    fs.renameSync(envPath, envBackup);
    console.log(".env build sirasinda devre disi birakildi (masaustu giris ekrani onlenir).");
  }

  run("next build");
  run("node scripts/prepare-standalone.cjs");
  run("npx electron-builder --win");
} finally {
  if (fs.existsSync(envBackup)) {
    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath);
    }
    fs.renameSync(envBackup, envPath);
    console.log(".env geri yuklendi.");
  }
}
