/**
 * OpenNext on Windows often fails creating symlinks without Developer Mode.
 * Patch copyTracedFiles to fall back to recursive copy on EPERM/EACCES.
 */
const fs = require("node:fs");
const path = require("node:path");

const target = path.join(
  process.cwd(),
  "node_modules",
  "@opennextjs",
  "aws",
  "dist",
  "build",
  "copyTracedFiles.js"
);

if (!fs.existsSync(target)) {
  console.log("OpenNext aws package yok, patch atlandi.");
  process.exit(0);
}

let source = fs.readFileSync(target, "utf8");
if (source.includes("Windows without symlink privilege")) {
  console.log("OpenNext Windows symlink patch zaten uygulanmis.");
  process.exit(0);
}

const needle = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;

const replacement = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code === "EEXIST") {
                    // already there
                }
                else if (e.code === "EPERM" || e.code === "EACCES") {
                    // Windows without symlink privilege: copy instead
                    try {
                        cpSync(from, to, { recursive: true, force: true });
                    }
                    catch (copyError) {
                        erroredFiles.push(from);
                        console.warn(\`Failed to copy traced file \${from}:\`, copyError.message);
                    }
                }
                else {
                    throw e;
                }
            }
        }`;

if (!source.includes(needle)) {
  console.warn("OpenNext patch hedefi bulunamadi; surum degismis olabilir.");
  process.exit(0);
}

fs.writeFileSync(target, source.replace(needle, replacement), "utf8");
console.log("OpenNext Windows symlink patch uygulandi.");
