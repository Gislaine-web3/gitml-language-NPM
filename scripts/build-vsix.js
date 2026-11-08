#!/usr/bin/env node
/*
 * Gera a extensão do VS Code:  node scripts/build-vsix.js   (ou: npm run vsix)
 *
 * O projeto tem UM motor (gitml.js na raiz). Aqui ele é copiado — só para dentro de uma
 * pasta temporária de empacotamento — junto com server.js e o CLI (bin/), e o resultado é
 * gravado na raiz como gitml-<versão>.vsix, pronto para instalar.
 */
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");
const root = path.join(__dirname, "..");
const ext = path.join(root, "vscode-extension");
const stage = path.join(root, ".build", "vscode-extension");
const version = JSON.parse(fs.readFileSync(path.join(ext, "package.json"), "utf8")).version;
const out = path.join(root, `gitml-${version}.vsix`);

const rm = (p) => fs.rmSync(p, { recursive: true, force: true });
function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.statSync(src).isDirectory()) fs.readdirSync(src).forEach((f) => copy(path.join(src, f), path.join(dst, f)));
  else fs.copyFileSync(src, dst);
}

cp.execFileSync(process.execPath, [path.join(__dirname, "sync.js")], { stdio: "inherit" }); // gramática, snippets, docs
rm(stage); copy(ext, stage);
["gitml.js", "server.js"].forEach((f) => copy(path.join(root, f), path.join(stage, f)));
["gitml.js", "gitml", "gitml.cmd"].forEach((f) => copy(path.join(root, "bin", f), path.join(stage, "bin", f)));
fs.readdirSync(root).filter((f) => /^gitml-.*\.vsix$/.test(f)).forEach((f) => rm(path.join(root, f)));

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const r = cp.spawnSync(npx, ["--yes", "@vscode/vsce", "package", "--no-dependencies", "-o", out], { cwd: stage, stdio: "inherit", shell: process.platform === "win32" });
rm(path.join(root, ".build"));
if (r.status !== 0) { console.error("Falhou ao gerar o .vsix (precisa de internet para baixar o vsce na primeira vez)."); process.exit(1); }
console.log("\n✔ " + path.relative(process.cwd(), out));
