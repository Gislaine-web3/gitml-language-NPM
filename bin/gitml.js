#!/usr/bin/env node
/*!
 * GITML CLI v0.1.0 — abre, constrói e verifica páginas .gitml fora do HTML.
 *
 *   gitml new <nome>              cria um projeto novo (rotas, componentes, páginas)
 *   gitml dev [arquivo|pasta]     servidor local com recarga automática
 *   gitml build [arquivo]         gera o HTML final  (--out dist  → pasta pronta p/ deploy)
 *   gitml check [arquivos...]     procura erros e avisos (código de saída 1 se houver erro)
 *   gitml fmt <arquivo> [--write] formata o código
 *   gitml components [--md|--json] lista todos os componentes
 */
"use strict";
const fs = require("fs");
const path = require("path");
const http = require("http");
const { exec } = require("child_process");
const gitml = require(path.join(__dirname, "..", "gitml.js"));

const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    const k = a.slice(2), nx = args[i + 1];
    if (nx && !nx.startsWith("--") && ["port", "out", "host"].includes(k)) { flags[k] = nx; i++; } else flags[k] = true;
  } else pos.push(a);
}
const cmd = pos[0];
const c = process.stdout.isTTY ? { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", c: "\x1b[36m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" } : { r: "", y: "", g: "", c: "", d: "", b: "", x: "" };

/* ---------- utilidades ---------- */
function die(msg) { console.error(c.r + "✖ " + msg + c.x); process.exit(1); }
function loader(entry) {
  return (p, from) => {
    const base = from ? path.dirname(from) : path.dirname(entry);
    const f = path.resolve(base, /\.\w{1,6}$/.test(p) ? p : p + ".gitml");
    return fs.existsSync(f) ? { src: fs.readFileSync(f, "utf8"), path: f } : null;
  };
}
function compileFile(file, extra) {
  const abs = path.resolve(file);
  return gitml.compile(fs.readFileSync(abs, "utf8"), Object.assign({ allowScripts: true, file: abs, resolve: loader(abs) }, extra));
}
function report(out, file) {
  const rel = file ? path.relative(process.cwd(), file) : "";
  out.errors.forEach((e) => console.warn(`${c.r}erro${c.x}  ${rel}:${e.line}  ${e.message}`));
  out.warnings.forEach((w) => console.warn(`${c.y}aviso${c.x} ${rel}:${w.line}  ${w.message}`));
}
function findEntry(p) {
  if (p && fs.existsSync(p) && fs.statSync(p).isFile()) return path.resolve(p);
  const dir = path.resolve(p || ".");
  if (!fs.existsSync(dir)) die("Não encontrei: " + p);
  for (const n of ["index.gitml", "app.gitml", "pagina.gitml", "main.gitml"]) if (fs.existsSync(path.join(dir, n))) return path.join(dir, n);
  const any = fs.readdirSync(dir).find((f) => f.endsWith(".gitml"));
  if (any) return path.join(dir, any);
  die("Nenhum arquivo .gitml em " + dir + "  (crie um projeto com: gitml new meu-site)");
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dst, f);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

/* ---------- gitml new ---------- */
function cmdNew(name) {
  if (!name) die("Uso: gitml new <nome-do-projeto>");
  const dir = path.resolve(name);
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) die("A pasta '" + name + "' já existe e não está vazia.");
  const title = path.basename(dir).replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const w = (f, t) => { const p = path.join(dir, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, t); };

  w("index.gitml", `<!-- ${title} — app em GITML. Rode:  gitml dev -->
<gitml theme="dark" accent="violet" font="space-grotesk" title="${title}" description="Meu site feito com GITML" icon="⚡">

  <include src="components/menu.gitml" />

  <route path="/" title="Início">
    <hero eyebrow="Bem-vindo" title="Olá, **${title}**" subtitle="Edite o arquivo index.gitml e veja a página mudar na hora." cta="Começar" href="/sobre" cta2="Contato" href2="/contato"></hero>

    <section eyebrow="Recursos" title="Tudo pronto para usar">
      <grid cols="3" gap="24">
        <feature icon="zap" title="Rápido">Sem build, sem configuração.</feature>
        <feature icon="layers" title="Componentes">Mais de 150 tags prontas.</feature>
        <feature icon="rocket" title="Páginas">Rotas estilo Next/React.</feature>
      </grid>
    </section>
  </route>

  <!-- Cada página fica em um arquivo, como a pasta pages/ do Next -->
  <route path="/sobre" title="Sobre" src="pages/sobre.gitml" />
  <route path="/contato" title="Contato" src="pages/contato.gitml" />

  <notfound>
    <section title="404"><empty icon="alert" title="Página não encontrada"><button href="/">Voltar ao início</button></empty></section>
  </notfound>

  <include src="components/rodape.gitml" />
</gitml>
`);
  w("components/menu.gitml", `<nav brand="${title}" sticky>
  <link href="/">Início</link>
  <link href="/sobre">Sobre</link>
  <link href="/contato">Contato</link>
  <theme-toggle />
</nav>
`);
  w("components/rodape.gitml", `<footer brand="${title}">
  <link href="/">Início</link>
  <link href="/sobre">Sobre</link>
  <p muted="true">Feito com GITML.</p>
</footer>
`);
  w("pages/sobre.gitml", `<section eyebrow="Sobre" title="Quem somos">
  <p size="lg">Escreva aqui a história do projeto. Aceita **negrito**, *itálico* e \`código\`.</p>
  <timeline>
    <step title="Ideia" date="2026">Tudo começou com uma página.</step>
    <step title="Lançamento" date="2026">Agora está no ar.</step>
  </timeline>
</section>
`);
  w("pages/contato.gitml", `<section eyebrow="Contato" title="Fale com a gente">
  <contact title="Envie uma mensagem" action="#"></contact>
</section>
`);
  w("index.html", `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>html{background:#07080d}</style>
  <!-- Modo "dentro do HTML": o motor lê o index.gitml e monta a página -->
  <script src="gitml.js" charset="utf-8" data-src="index.gitml" onerror="var l=document.getElementById('gitml-loading');if(l)l.innerHTML='Não encontrei o <b>gitml.js</b> nesta pasta. Rode <code>gitml start</code> ou copie o gitml.js para cá.'"></script>
</head>
<body>
  <p id="gitml-loading" style="font:16px/1.6 system-ui,sans-serif;color:#e8eaf2;background:#10121a;border:1px solid #262b3d;border-radius:14px;max-width:640px;margin:48px auto;padding:20px 24px">Carregando GITML… se esta mensagem não sumir, abra o Console (F12) e veja o erro.</p>
</body>
</html>
`);
  fs.copyFileSync(path.join(__dirname, "..", "gitml.js"), path.join(dir, "gitml.js"));
  w("public/.gitkeep", "");
  w(".gitignore", "dist/\nnode_modules/\n");
  w(".vscode/extensions.json", JSON.stringify({ recommendations: ["gislaine-web3.gitml"] }, null, 2) + "\n");
  w("package.json", JSON.stringify({ name: path.basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g, "-"), version: "0.1.0", private: true, scripts: { dev: "gitml dev", build: "gitml build --out dist", check: "gitml check index.gitml" } }, null, 2) + "\n");
  w("README.md", `# ${title}\n\nProjeto criado com GITML ${gitml.version}.\n\n\`\`\`bash\ngitml dev          # abre http://localhost:4173 com recarga automática\ngitml check        # procura erros\ngitml build --out dist   # gera a pasta pronta para publicar\n\`\`\`\n\n- \`index.gitml\` — página principal e rotas\n- \`components/\` — pedaços reutilizáveis (\`<include src="...">\`)\n- \`pages/\` — uma página por arquivo (\`<route src="...">\`)\n- \`public/\` — imagens e arquivos estáticos (copiados no build)\n`);
  console.log(`${c.g}✔ Projeto criado em ${name}/${c.x}\n\n  cd ${name}\n  gitml dev\n`);
}

/* ---------- gitml dev ---------- */
async function cmdDev(target) {
  const { startServer } = require(path.join(__dirname, "..", "server.js"));
  const isDir = target && fs.existsSync(target) && fs.statSync(target).isDirectory();
  const isFile = target && fs.existsSync(target) && fs.statSync(target).isFile();
  if (target && !isDir && !isFile) die("Não encontrei: " + target);
  const root = isFile ? path.dirname(path.resolve(target)) : path.resolve(target || ".");
  const entry = isFile && /\.gitml$/i.test(target) ? path.resolve(target) : null;
  const host = flags.host === true || flags.lan ? "0.0.0.0" : (flags.host || "127.0.0.1");
  const log = (k, m) => console.log((k === "erro" ? c.r + "erro " : k === "aviso" ? c.y + "aviso " : c.d) + m + c.x);
  let s;
  try { s = await startServer({ root, entry, gitml, port: Number(flags.port) || 4173, host, log }); } catch (e) { die(e.message); }
  const shown = isFile ? s.urlFor(path.resolve(target)) : s.url;
  console.log(`\n  ${c.b}GITML ${gitml.version}${c.x}  ${c.d}${root}${c.x}\n\n  ${c.g}➜${c.x}  ${c.b}${shown}${c.x}\n  ${c.d}.gitml abre como página · salve um arquivo e o navegador recarrega · Ctrl+C para parar${c.x}\n`);
  if (host === "0.0.0.0") console.log(`  ${c.y}Aviso:${c.x} acessível por qualquer aparelho da sua rede.\n`);
  if (flags.open) exec((process.platform === "win32" ? 'start ""' : process.platform === "darwin" ? "open" : "xdg-open") + ' "' + shown + '"');
}

/* ---------- gitml build ---------- */
const isGenerated = (f) => !fs.existsSync(f) || /<meta name="generator" content="GITML/.test(fs.readFileSync(f, "utf8"));
function cmdBuild(target) {
  const entry = findEntry(target);
  const out = compileFile(entry); report(out, entry);
  if (out.errors.length) die("Corrija os erros acima antes de gerar o HTML.");
  const dist = path.resolve(flags.out === true || !flags.out ? path.join(path.dirname(entry), "dist") : flags.out);
  const name = path.basename(entry).replace(/\.gitml$/i, "") + ".html";
  const dest = path.join(dist, flags.out ? "index.html" : name);
  if (!flags.force && !isGenerated(dest)) die(`${path.relative(process.cwd(), dest)} já existe e não foi gerado pelo GITML (não vou sobrescrever). Use --out outra-pasta ou --force.`);
  fs.mkdirSync(dist, { recursive: true });
  fs.writeFileSync(dest, out.html);
  if (flags.out) {
    fs.writeFileSync(path.join(dist, "404.html"), out.html); // SPA em hospedagem estática
    const base = path.dirname(entry);
    ["public", "assets", "img", "images", "static"].forEach((d) => { const s = path.join(base, d); if (fs.existsSync(s) && fs.statSync(s).isDirectory()) copyDir(s, d === "public" ? dist : path.join(dist, d)); });
  }
  console.log(`${c.g}✔ Pronto:${c.x} ${path.relative(process.cwd(), dest)}  ${c.d}(${(out.html.length / 1024).toFixed(0)} KB)${c.x}`);
}

/* ---------- gitml check ---------- */
function cmdCheck(files) {
  const list = files.length ? files : [findEntry(".")];
  let errs = 0, warns = 0;
  list.forEach((f) => {
    if (!fs.existsSync(f)) die("Arquivo não encontrado: " + f);
    const out = compileFile(f); report(out, path.resolve(f)); errs += out.errors.length; warns += out.warnings.length;
  });
  console.log(errs || warns ? `\n${errs ? c.r : c.y}${errs} erro(s), ${warns} aviso(s)${c.x}` : `${c.g}✔ Nenhum problema encontrado${c.x} ${c.d}(${list.length} arquivo${list.length > 1 ? "s" : ""})${c.x}`);
  process.exit(errs ? 1 : 0);
}

/* ---------- gitml fmt ---------- */
function cmdFmt(file) {
  if (!file || !fs.existsSync(file)) die("Uso: gitml fmt <arquivo.gitml> [--write]");
  const src = fs.readFileSync(file, "utf8"), out = gitml.format(src);
  if (flags.write) { fs.writeFileSync(file, out); console.log(c.g + "✔ Formatado: " + file + c.x); } else process.stdout.write(out);
}

/* ---------- gitml components ---------- */
function cmdComponents() {
  const list = gitml.components(), groups = {};
  list.forEach((x) => { (groups[x.group] = groups[x.group] || []).push(x); });
  if (flags.json) return console.log(JSON.stringify(list, null, 2));
  if (flags.md) {
    console.log("# Componentes GITML " + gitml.version + "\n");
    Object.keys(groups).forEach((g) => { console.log("## " + g + "\n\n| Tag | O que faz | Atributos |\n| --- | --- | --- |"); groups[g].filter((x) => !x.alias).forEach((x) => console.log("| `<" + x.tag + ">` | " + x.desc.replace(/\|/g, "\\|") + " | " + (x.attrs || "—") + " |")); console.log(); });
    return;
  }
  Object.keys(groups).forEach((g) => { console.log("\n" + c.b + "## " + g + c.x); groups[g].forEach((x) => console.log(`  <${x.tag}> — ${x.desc}`)); });
  console.log(`\nTotal: ${list.filter((x) => !x.alias).length} componentes (${list.length} tags contando apelidos)`);
}

/* ---------- roteador ---------- */
const help = () => console.log(`
  ${c.b}GITML ${gitml.version}${c.x} — páginas modernas sem escrever HTML

  ${c.c}gitml new <nome>${c.x}              cria um projeto novo
  ${c.c}gitml start [arquivo|pasta|porta]${c.x} abre o site no navegador (http://localhost:4173)
  ${c.c}gitml serve [porta]${c.x}            servidor local  (ex.: gitml serve 3000)
  ${c.c}gitml dev [arquivo|pasta]${c.x}     igual ao serve, com --port 3000 --open --lan
  ${c.c}gitml build [arquivo]${c.x}         gera dist/<nome>.html  (--out pasta  → site pronto p/ publicar)
  ${c.c}gitml check [arquivos]${c.x}        procura erros e avisos
  ${c.c}gitml fmt <arquivo>${c.x}           formata o código  (--write para salvar)
  ${c.c}gitml components${c.x}              lista os componentes  (--md | --json)
`);

/** `gitml serve 3000` / `gitml start 3000` → porta; `gitml start pasta|arquivo` → alvo */
function serveTarget() {
  const t = pos[1];
  if (t && /^\d{2,5}$/.test(t) && !fs.existsSync(t)) { if (!flags.port) flags.port = t; return pos[2]; }
  return t;
}

switch (cmd) {
  case "new": case "init": cmdNew(pos[1]); break;
  case "start": flags.open = true; cmdDev(serveTarget()); break;
  case "serve": cmdDev(serveTarget()); break;
  case "dev": cmdDev(pos[1]); break;
  case "build": cmdBuild(pos[1]); break;
  case "check": case "lint": cmdCheck(pos.slice(1)); break;
  case "fmt": case "format": cmdFmt(pos[1]); break;
  case "components": cmdComponents(); break;
  case "version": case "--version": case "-v": console.log(gitml.version); break;
  default:
    if (flags.version || flags.v) console.log(gitml.version); else help();
}
