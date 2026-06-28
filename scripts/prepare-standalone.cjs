const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const serverFile = path.join(standaloneDir, "server.js");

if (!fs.existsSync(serverFile)) {
  console.error("Standalone build bulunamadı. Önce `npm run build` çalıştırın.");
  process.exit(1);
}

fs.cpSync(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true
});

const publicDir = path.join(root, "public");
if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(standaloneDir, "public"), { recursive: true });
}

const nestedDistElectron = path.join(standaloneDir, "dist-electron");
if (fs.existsSync(nestedDistElectron)) {
  fs.rmSync(nestedDistElectron, { recursive: true, force: true });
  console.log("Standalone paketinden dist-electron kaldirildi.");
}

const seedDir = path.join(root, "electron", "seed");
fs.mkdirSync(seedDir, { recursive: true });

const seedTarget = path.join(seedDir, "app-data.json");
const sourceData = path.join(root, "data", "app-data.json");
const emptyData = path.join(root, "electron", "empty-database.json");

if (fs.existsSync(sourceData)) {
  fs.copyFileSync(sourceData, seedTarget);
} else {
  fs.copyFileSync(emptyData, seedTarget);
}

console.log("Standalone paketi hazır.");
