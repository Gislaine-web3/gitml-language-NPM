/*!
 * GITML dev server — abre arquivos .gitml e .html (com GITML) no navegador, em http://localhost.
 * Sem dependências. Usado pela CLI (`gitml dev`) e pela extensão do VS Code.
 *
 *   const { startServer } = require("./server.js");
 *   const s = await startServer({ root: "/minha/pasta", gitml: require("./gitml.js") });
 *   s.url        → "http://localhost:4173"
 *   s.urlFor(f)  → endereço de um arquivo da pasta
 *   s.reload()   → recarrega as abas abertas
 *   s.close()
 *
 * O que ele resolve (e um servidor estático comum, como `python -m http.server`, não):
 *   • `.gitml` abre como página (o python entrega como download: application/octet-stream)
 *   • `/` abre index.gitml; <include> e <route src> funcionam
 *   • .html com <script type="text/gitml"> ganha o motor automaticamente; se apontar para
 *     o gitml.js da CDN, usa o motor local (sempre a versão mais nova)
 *   • recarrega a aba sozinho quando você salva
 */
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");

const MIME = {
  ".html": "text/html; charset=utf-8", ".htm": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8", ".gitml": "text/plain; charset=utf-8", ".mp4": "video/mp4",
  ".webm": "video/webm", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".pdf": "application/pdf", ".xml": "application/xml; charset=utf-8", ".map": "application/json"
};
const IGNORE = /(^|[\\/])(node_modules|\.git|dist)([\\/]|$)/;
const ENTRIES = ["index.gitml", "app.gitml", "pagina.gitml", "main.gitml"];
const RELOAD = "<script>(function(){try{var e=new EventSource('/__gitml/events');e.onmessage=function(m){if(m.data==='reload')location.reload()}}catch(x){}})()</script>";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function makeLoader(entry) {
  return (p, from) => {
    const base = from ? path.dirname(from) : path.dirname(entry);
    const f = path.resolve(base, /\.\w{1,6}$/.test(p) ? p : p + ".gitml");
    return fs.existsSync(f) ? { src: fs.readFileSync(f, "utf8"), path: f } : null;
  };
}

function startServer(opts) {
  const gitml = opts.gitml;
  const root = path.resolve(opts.root || ".");
  const enginePath = opts.enginePath || path.join(__dirname, "gitml.js");
  const log = opts.log || (() => { });
  const host = opts.host || "127.0.0.1";
  const clients = new Set();
  let entry = opts.entry ? path.resolve(opts.entry) : null;

  function findEntry() {
    if (entry && fs.existsSync(entry)) return entry;
    for (const n of ENTRIES) { const f = path.join(root, n); if (fs.existsSync(f)) return f; }
    return null;
  }
  function compileFile(file) {
    const out = gitml.compile(fs.readFileSync(file, "utf8"), { allowScripts: true, file, resolve: makeLoader(file) });
    out.errors.forEach((e) => log("erro", path.relative(root, file) + ":" + e.line + "  " + e.message));
    out.warnings.forEach((w) => log("aviso", path.relative(root, file) + ":" + w.line + "  " + w.message));
    return out;
  }
  function transformHtml(html) {
    html = html.replace(/(<script\b[^>]*\bsrc\s*=\s*["'])https?:\/\/[^"']*gitml[^"']*\.js(["'][^>]*>)/gi, "$1/gitml.js$2");
    const usesGitml = /<script\b[^>]*\btype\s*=\s*["']text\/gitml["']/i.test(html) || /<script\b[^>]*\bdata-src\s*=/i.test(html);
    const hasEngine = /<script\b[^>]*\bsrc\s*=\s*["'][^"']*gitml[^"']*\.js/i.test(html);
    if (usesGitml && !hasEngine) {
      const tag = '<script src="/gitml.js" charset="utf-8"></script>';
      html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + tag) : tag + html;
    }
    return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, RELOAD + "\n</body>") : html + RELOAD;
  }
  function listing(dir, urlPath) {
    const items = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => !d.name.startsWith(".") && !IGNORE.test(d.name))
      .sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));
    const rows = items.map((d) => {
      const n = d.name + (d.isDirectory() ? "/" : ""), g = /\.(gitml)$/i.test(d.name), h = /\.html?$/i.test(d.name);
      return `<li><a href="${esc(path.posix.join(urlPath, n))}">${esc(n)}</a>${g ? '<span class="t">GITML</span>' : h ? '<span class="t h">HTML</span>' : ""}</li>`;
    }).join("");
    return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GITML — ${esc(urlPath)}</title>
<style>body{margin:0;background:#07080d;color:#e8eaf2;font:16px/1.6 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px}.c{width:min(640px,100%);background:#10121a;border:1px solid #262b3d;border-radius:18px;padding:28px}h1{font-size:20px;margin:0 0 4px}p{color:#9aa3b5;margin:0 0 16px;font-size:14px}ul{list-style:none;padding:0;margin:0}li{display:flex;justify-content:space-between;border-top:1px solid #1f2330;padding:9px 2px}a{color:#e8eaf2;text-decoration:none}a:hover{color:#7c5cff}.t{font-size:11px;font-weight:700;color:#7c5cff;border:1px solid #7c5cff55;border-radius:99px;padding:1px 9px}.t.h{color:#f59e0b;border-color:#f59e0b55}</style>
<div class="c"><h1>GITML ${esc(gitml.version)} · ${esc(urlPath)}</h1><p>Nenhum index.gitml aqui. Escolha um arquivo:</p><ul>${rows || "<li>(pasta vazia)</li>"}</ul></div>`;
  }

  const server = http.createServer((req, res) => {
    const send = (code, type, body) => { res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.end(body); };
    let url;
    try { url = decodeURIComponent((req.url || "/").split("?")[0]); } catch (e) { return send(400, "text/plain; charset=utf-8", "Endereço inválido"); }
    const query = new URL(req.url || "/", "http://x").searchParams;
    if (url === "/__gitml/events") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write("retry: 800\n\n"); clients.add(res); req.on("close", () => clients.delete(res)); return;
    }
    const page = (file) => send(200, MIME[".html"], compileFile(file).html.replace("</body>", RELOAD + "\n</body>"));
    try {
      if (url === "/") { const e = findEntry(); if (e) return page(e); const idx = path.join(root, "index.html"); if (fs.existsSync(idx)) return send(200, MIME[".html"], transformHtml(fs.readFileSync(idx, "utf8"))); return send(200, MIME[".html"], listing(root, "/")); }
      let f = path.normalize(path.join(root, url));
      if (f !== root && !f.startsWith(root + path.sep)) return send(403, "text/plain; charset=utf-8", "Proibido");
      if (!fs.existsSync(f) && /(^|\/)gitml\.js$/.test(url)) f = enginePath;
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
        const idx = ["index.gitml", "index.html"].map((n) => path.join(f, n)).find((x) => fs.existsSync(x));
        if (!url.endsWith("/")) { res.writeHead(301, { Location: url + "/" }); return res.end(); }
        if (idx) return /\.gitml$/.test(idx) ? page(idx) : send(200, MIME[".html"], transformHtml(fs.readFileSync(idx, "utf8")));
        return send(200, MIME[".html"], listing(f, url));
      }
      if (fs.existsSync(f)) {
        const ext = path.extname(f).toLowerCase();
        if (ext === ".gitml") return query.has("raw") ? send(200, MIME[".gitml"], fs.readFileSync(f)) : page(f);
        if (ext === ".html" || ext === ".htm") return send(200, MIME[".html"], transformHtml(fs.readFileSync(f, "utf8")));
        return send(200, MIME[ext] || "application/octet-stream", fs.readFileSync(f));
      }
      if (!path.extname(url)) { const e = findEntry(); if (e) return page(e); } // rotas do app caem no index
      send(404, "text/html; charset=utf-8", `<!doctype html><meta charset="utf-8"><body style="font:16px system-ui;background:#07080d;color:#e8eaf2;padding:40px"><h1>404</h1><p>Não encontrei <code>${esc(url)}</code> em <code>${esc(root)}</code>.</p><p><a style="color:#7c5cff" href="/">← voltar</a></p>`);
    } catch (e) { send(500, "text/plain; charset=utf-8", "Erro: " + e.message); log("erro", e.stack || e.message); }
  });

  // recarga automática
  let timer = null, watchers = [];
  const changed = (f) => { clearTimeout(timer); timer = setTimeout(() => { log("info", "↻ " + (f || "alterado")); clients.forEach((r) => r.write("data: reload\n\n")); }, 60); };
  function watch() {
    try { watchers.push(fs.watch(root, { recursive: true }, (e, f) => { if (f && !IGNORE.test(f)) changed(f); })); }
    catch (e) { (function walk(d) { try { watchers.push(fs.watch(d, (ev, f) => changed(f))); fs.readdirSync(d, { withFileTypes: true }).forEach((x) => { if (x.isDirectory() && !IGNORE.test(x.name) && x.name[0] !== ".") walk(path.join(d, x.name)); }); } catch (_) { } })(root); }
  }

  return new Promise((resolve, reject) => {
    let port = Number(opts.port) || 4173; const first = port;
    server.on("error", (e) => { if (e.code === "EADDRINUSE" && port < first + 30) { port++; server.listen(port, host); } else reject(e); });
    server.on("listening", () => {
      port = server.address().port; watch();
      const url = "http://localhost:" + port;
      resolve({
        server, port, root, url,
        urlFor(file) {
          const rel = path.relative(root, path.resolve(file)).split(path.sep).join("/");
          if (!rel || rel.startsWith("..")) return url + "/";
          const e = findEntry();
          if (e && path.resolve(file) === e) return url + "/";
          if (/^index\.html?$/i.test(rel) && !e) return url + "/";
          return url + "/" + rel.split("/").map(encodeURIComponent).join("/");
        },
        reload: () => changed("manual"),
        close() { watchers.forEach((w) => { try { w.close(); } catch (_) { } }); clients.forEach((r) => { try { r.end(); } catch (_) { } }); return new Promise((r) => server.close(() => r())); }
      });
    });
    server.listen(port, host);
  });
}

module.exports = { startServer, makeLoader, MIME };
