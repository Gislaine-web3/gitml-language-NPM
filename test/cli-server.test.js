"use strict";
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gitml-server-"));
const source = '<!doctype html><html lang="pt-BR"><head><title>Local GITML</title></head><body><main><h1>Renderizado</h1></main></body></html>';
fs.writeFileSync(path.join(dir, "index.gitml"), source);
fs.writeFileSync(path.join(dir, "index.html"), '<!doctype html><html><head><title>HTML wrapper</title><script src="/gitml.js" data-src="index.gitml"></script></head><body></body></html>');

const child = spawn(process.execPath, [path.join(root, "bin/gitml.js"), "serve", "32087"], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
child.stdout.on("data", (b) => { log += b.toString(); });
child.stderr.on("data", (b) => { log += b.toString(); });

function get(port, route) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: "127.0.0.1", port, path: route }, (res) => {
      const chunks = [];
      res.on("data", (x) => chunks.push(x));
      res.on("end", () => resolve({ status: res.statusCode, type: res.headers["content-type"], body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
  });
}

async function waitForServer(port) {
  const end = Date.now() + 8000;
  while (Date.now() < end) {
    if (child.exitCode != null) throw new Error("gitml serve encerrou: " + log);
    try { await get(port, "/"); return; } catch (_) { await new Promise((r) => setTimeout(r, 80)); }
  }
  throw new Error("gitml serve não iniciou: " + log);
}

(async () => {
  try {
    await waitForServer(32087);
    const home = await get(32087, "/");
    assert.strictEqual(home.status, 200);
    assert.match(home.type, /text\/html/);
    assert.match(home.body, /<title>Local GITML<\/title>/);
    assert.match(home.body, /<h1 class="g-h">Renderizado<\/h1>/);
    assert.strictEqual((home.body.match(/<html\b/g) || []).length, 1);

    const direct = await get(32087, "/index.gitml");
    assert.match(direct.type, /text\/html/);
    assert.match(direct.body, /<title>Local GITML<\/title>/);
    const raw = await get(32087, "/index.gitml?raw=1");
    assert.match(raw.type, /text\/plain/);
    assert.strictEqual(raw.body, source);

    const wrapper = await get(32087, "/index.html");
    assert.match(wrapper.type, /text\/html/);
    assert.match(wrapper.body, /data-src="index.gitml"/);
    const runtime = await get(32087, "/gitml.js");
    assert.match(runtime.type, /javascript/);
    assert.match(runtime.body, /searchParams\.set\("raw", "1"\)/);
    console.log("[ok] `gitml serve <porta>`: .gitml puro, acesso direto, fonte raw e HTML com data-src");
  } catch (err) {
    console.error("[x] servidor local:", err.message);
    process.exitCode = 1;
  } finally {
    child.kill("SIGTERM");
    fs.rmSync(dir, { recursive: true, force: true });
  }
})();
