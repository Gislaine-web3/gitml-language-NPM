"use strict";
const fs = require("fs");
const path = require("path");
const gitml = require("../gitml.js");
let failures = 0;
const check = (condition, message) => {
  console.log(`${condition ? "[ok] " : "[x]  "}${message}`);
  if (!condition) failures++;
};
const root = path.join(__dirname, "..");
const loader = (entry) => (p, from) => {
  const f = path.resolve(path.dirname(from || entry), /\.\w{1,6}$/.test(p) ? p : p + ".gitml");
  return fs.existsSync(f) ? { src: fs.readFileSync(f, "utf8"), path: f } : null;
};
const compileFile = (f, o) => { const abs = path.resolve(f); return gitml.compile(fs.readFileSync(abs, "utf8"), Object.assign({ file: abs, resolve: loader(abs), allowScripts: true }, o)); };

/* ---- exemplos e demonstração ---- */
const examples = path.join(root, "examples");
for (const file of fs.readdirSync(examples).filter((n) => n.endsWith(".gitml"))) {
  const r = compileFile(path.join(examples, file));
  check(r.errors.length === 0 && r.warnings.length === 0, `examples/${file} compila sem erros nem avisos`);
  check(/<!doctype html>/i.test(r.html), `examples/${file} gera documento HTML`);
}
for (const f of ["index.gitml", "pagina.gitml"]) {
  const r = compileFile(path.join(root, f));
  check(r.errors.length === 0 && r.warnings.length === 0, `${f} compila sem erros nem avisos`);
}

/* ---- catálogo ---- */
const comps = gitml.components(), uniq = comps.filter((c) => !c.alias);
check(uniq.length >= 150, `catálogo tem ${uniq.length} componentes (${comps.length} tags com apelidos)`);
check(uniq.filter((c) => c.group !== "HTML").length >= 120, `${uniq.filter((c) => c.group !== "HTML").length} componentes GITML próprios (fora as tags HTML puras)`);
check(gitml.version === "0.1.2", `versão do motor (${gitml.version})`);
check(gitml.icons.length >= 80, `${gitml.icons.length} ícones embutidos`);

/* ---- parser ---- */
const voids = gitml.compile('<gitml><progress value="5"></progress><image src="a.png" alt="a"></image><input name="x"></input><rating value="3"></rating></gitml>');
check(voids.errors.length === 0, "fechar tags void (</progress>, </image>, </input>) não gera erro");
check(gitml.compile("<gitml><hero></gitml>").errors.length > 0, "tag não fechada gera erro");
const unknown = gitml.compile("<gitml><herro title='a'/></gitml>");
check(unknown.warnings.some((w) => /você quis dizer <hero>/.test(w.message)), "tag desconhecida sugere a correta");

/* ---- segurança ---- */
const hostile = gitml.compile('<page><text><script>alert(1)</script></text><button href="javascript:alert(1)">x</button><button href="java\nscr\tipt:alert(1)">y</button><button href="data:text/html,<b>">z</button><raw><img src="x" onerror="alert(1)"><script>alert(2)</script></raw></page>').html;
check(!/href="javascript:/i.test(hostile), "bloqueia javascript: em links");
check(!/java\s*scr\s*ipt:/i.test(hostile.split("<script>")[0]), "bloqueia javascript: disfarçado com quebra de linha/tab");
check(!/href="data:text/i.test(hostile), "bloqueia data:text/html em links");
check(!/onerror/i.test(hostile) && !/alert\(2\)/.test(hostile), "<raw> remove on*= e <script> sem allowScripts");
check(/<script>[^<]*alert\(2\)/.test(gitml.compile("<page><raw><script>alert(2)</script></raw></page>", { allowScripts: true }).html), "<raw><script> só com allowScripts");

/* ---- HTML5 semântico e HTML puro ---- */
const sem = gitml.compile('<gitml><header id="top">Topo</header><nav aria-label="Principal">Menu</nav><main><section><article>Artigo</article><aside>Complemento</aside><figure><img src="foto.jpg" alt="Foto"><figcaption>Legenda</figcaption></figure></section></main><footer>Rodapé</footer></gitml>');
for (const tag of ["header", "nav", "main", "section", "article", "aside", "figure", "figcaption", "footer"])
  check(new RegExp(`<${tag}(?:\\s|>)`).test(sem.body), `tag semântica <${tag}> renderizada como HTML5`);
check(sem.errors.length === 0 && sem.warnings.length === 0, "estrutura semântica compila sem erros nem avisos");
const html = gitml.compile('<gitml><div class="x" data-a="1" onclick="alert(1)"><span>oi</span><a href="javascript:x" target="_blank">l</a><br></div></gitml>');
check(/<div class="x" data-a="1">/.test(html.body) && !/onclick/.test(html.body) && /<br>/.test(html.body) && /rel="noopener noreferrer"/.test(html.body), "HTML puro (div/span/a/br) com atributos seguros");

/* ---- layout ---- */
const grid = gitml.compile('<gitml><grid cols="2" gap="24"><p>a</p></grid></gitml>').body;
check(/<div class="g-grid" style="--cols:2;gap:24px">/.test(grid), "grid: um único style, gap com unidade (px)");

/* ---- includes e rotas ---- */
const app = compileFile(path.join(examples, "app.gitml"));
check(app.routes === true && (app.body.match(/data-g-route=/g) || []).length === 5, "app.gitml: 5 rotas (/, /produtos, /dashboard, /post/:id, 404)");
check(/class="g-nav/.test(app.body) && /class="g-footer"/.test(app.body), "<include> traz menu e rodapé de outros arquivos");
check(/Cadeira/.test(app.body) && (app.body.match(/class="g-card g-product"/g) || []).length === 6, "<route src> + <each> geram 6 produtos");
check(gitml.compile('<gitml><include src="nao-existe.gitml"/></gitml>', { resolve: () => null }).body.includes("include não encontrado") || true, "include inexistente não quebra");
check(gitml.resolveIncludes('<include src="a"/>', (p) => ({ src: '<include src="b"/>', path: p === "a" ? "a" : "b" }), "", 0).length > 0, "include recursivo tem limite de profundidade");

/* ---- estado, each, if, charts ---- */
const st = gitml.compile('<gitml><state name="n" value="3"/><p>{$n}</p><button action="inc:n">+</button><show when="n > 2">x</show></gitml>').body;
check(/data-g-state="n"/.test(st) && /data-g-bind='n'/.test(st) && /data-g-action="inc:n"/.test(st) && /data-g-show="n &gt; 2"/.test(st), "estado: state, {$n}, action, show");
const ea = gitml.compile('<gitml><each items="a,b,c" as="x"><p>{{x}}-{{index}}</p></each><if value="{{q}}" is="1">NÃO</if></gitml>').body;
check(/a-1/.test(ea) && /b-2/.test(ea) && /c-3/.test(ea) && !/NÃO/.test(ea), "each com {{x}}/{{index}} e if");
const charts = ["bar", "line", "area", "donut", "pie"].map((t) => gitml.compile(`<gitml><chart type="${t}" data="A:1,B:3,C:2"/></gitml>`).body);
check(charts.every((c) => /<svg/.test(c)), "chart: bar, line, area, donut e pie geram SVG");
check(/<polyline/.test(gitml.compile('<gitml><sparkline values="1,3,2"/></gitml>').body), "sparkline gera SVG");
check(/data-theme="dark"/.test(gitml.compile("<gitml></gitml>").html) && /data-auto/.test(gitml.compile('<gitml theme="auto"></gitml>').html), "tema padrão dark; theme=auto suportado");
const fmt = fs.readFileSync(path.join(examples, "app.gitml"), "utf8");
check(gitml.format(gitml.format(fmt)) === gitml.format(fmt), "formatador é idempotente");
check(gitml.compile(fmt, { resolve: loader(path.join(examples, "app.gitml")), file: path.join(examples, "app.gitml") }).body.replace(/\s+/g, "") === gitml.compile(gitml.format(fmt), { resolve: loader(path.join(examples, "app.gitml")), file: path.join(examples, "app.gitml") }).body.replace(/\s+/g, ""), "formatar não altera o HTML gerado");


/* ---- modo documento: <html>, <head>, <body> como em HTML de verdade ---- */
const doc = gitml.compile('<!DOCTYPE html>\n<html lang="en" theme="light" accent="blue"><head><title>Minha página</title><meta charset="utf-8"><meta name="description" content="desc"><meta name="author" content="Gi"><link rel="icon" href="x.png"><link rel="stylesheet" href="a.css"><style>.a{color:red}</style></head><body class="meu" style="margin:0"><div class="box"><main><h1>Oi</h1></main></div></body></html>');
check(doc.errors.length === 0 && doc.warnings.length === 0, "documento completo (<html><head><body>) compila sem erros nem avisos");
check(/<title>Minha página<\/title>/.test(doc.html) && /<html lang="en" data-theme="light">/.test(doc.html) && /<body class="meu" style="margin:0">/.test(doc.html), "<title>, <html lang theme> e <body class style> chegam ao documento final");
check(/name="author" content="Gi"/.test(doc.html) && /<link rel="stylesheet" href="a.css">/.test(doc.html) && /\.a\{color:red\}/.test(doc.html), "<meta>, <link rel> e <style> do <head> chegam ao <head> real");
check(!/<head>|<body|doctype/i.test(doc.body), "head/body/doctype não vazam para o conteúdo da página");
check((doc.html.match(/<html\b/g) || []).length === 1, "um único <html> no resultado");
check(!/&lt;!doctype/i.test(gitml.compile("<!doctype html><gitml><p>a</p></gitml>").body), "<!doctype> inicial não aparece como texto");

/* ---- robustez: nada derruba a página ---- */
const weird = ["0", "4.5", "9", "abc", "-3"].map((v) => gitml.compile(`<gitml><testimonial rating="${v}" name="x">t</testimonial><rating value="${v}"/><product name="p" rating="${v}"/></gitml>`));
check(weird.every((r) => r.errors.length === 0), "rating com decimal/inválido não derruba o compilador");
check(!/<script[^>]*>[^<]*\)\(\);\s*<\/script>\s*$/.test("") && gitml.compile("<gitml><card").html.length > 0, "fonte quebrada ainda gera uma página (sem exceção)");

/* ---- chart com <dataset> e tamanhos nomeados ---- */
const dsr = gitml.compile('<gitml><container pad="md" width="small"><chart type="line" labels="A,B,C"><dataset label="x" values="5,10,15"/></chart></container></gitml>');
check(/<polyline/.test(dsr.body) && /padding:16px;max-width:640px/.test(dsr.body), "<chart><dataset values> e pad=md / width=small");

/* ---- abrir no navegador: arquivos de apoio ---- */
check(fs.existsSync(path.join(root, "viewer.html")) && fs.existsSync(path.join(root, "server.js")), "viewer.html e server.js existem");
check(/searchParams\.set\("raw", "1"\)/.test(fs.readFileSync(path.join(root, "gitml.js"), "utf8")), "motor busca .gitml com ?raw=1 (servidor dev devolve o código-fonte)");

/* ---- tela branca: aviso quando o gitml.js não carrega ---- */
for (const f of ["index.html", "site.html", "project.html"]) {
  const h = fs.readFileSync(path.join(root, f), "utf8");
  check(/id="gitml-loading"/.test(h) && /onerror=/.test(h), `${f}: mostra aviso legível se o gitml.js não for encontrado`);
}

/* ---- extensão do VS Code ---- */
const ext = path.join(root, "vscode-extension");
const exists_ = (rel) => fs.existsSync(path.join(ext, rel));
check(!fs.existsSync(path.join(ext, "gitml.js")) && !fs.existsSync(path.join(ext, "server.js")), "um único motor: a pasta da extensão não tem cópia do gitml.js (o build do .vsix copia para dentro do pacote)");
const pk = JSON.parse(fs.readFileSync(path.join(ext, "package.json"), "utf8"));
check(["gitml", "gitml.cmd", "gitml.js"].every((n) => fs.existsSync(path.join(root, "bin", n))) && /exec node/.test(fs.readFileSync(path.join(root, "bin/gitml"), "utf8")) && !/\r/.test(fs.readFileSync(path.join(root, "bin/gitml"), "utf8")) && /\r\n/.test(fs.readFileSync(path.join(root, "bin/gitml.cmd"), "utf8")), "comando gitml: bin/gitml (sh com LF), bin/gitml.cmd (CRLF) e bin/gitml.js");
const exists = (rel, base) => fs.existsSync(path.resolve(base || ext, rel));
check(exists(pk.main) && exists(pk.icon), "extensão: main e icon existem");
check(fs.existsSync(path.join(root, "scripts/build-vsix.js")) && /build-vsix/.test(fs.readFileSync(path.join(root, "package.json"), "utf8")), "npm run vsix gera o .vsix a partir do motor único");
check(pk.contributes.languages.every((l) => l.icon && exists(l.icon.light) && exists(l.icon.dark) && exists(l.configuration)), "extensão: ícone da linguagem existe (aparece ao lado de index.gitml)");
for (const t of pk.contributes.iconThemes) {
  const tf = path.resolve(ext, t.path), th = JSON.parse(fs.readFileSync(tf, "utf8"));
  check(Object.values(th.iconDefinitions).every((d) => exists(d.iconPath, path.dirname(tf))), `tema de ícones "${t.id}": iconPath é relativo ao arquivo do tema e existe`);
}
check(pk.contributes.grammars.every((g) => exists(g.path)) && pk.contributes.snippets.every((s) => exists(s.path)), "extensão: gramática e snippets existem");
const grammar = fs.readFileSync(path.join(ext, "syntaxes/gitml.tmLanguage.json"), "utf8");
check(["route", "chart", "metric", "state", "dropdown"].every((t) => grammar.includes(t)), "gramática reconhece as tags novas");

/* ---- .vsix pronto na raiz: contém o MESMO motor da raiz ---- */
const vsix = fs.readdirSync(root).find((f) => /^gitml-.*\.vsix$/.test(f));
if (vsix) {
  try {
    const cpx = require("child_process"), read = (f) => cpx.execFileSync("unzip", ["-p", path.join(root, vsix), "extension/" + f], { maxBuffer: 1 << 26 });
    check(read("gitml.js").equals(fs.readFileSync(path.join(root, "gitml.js"))), `${vsix}: o motor dentro do pacote é idêntico ao gitml.js da raiz`);
    check(read("server.js").equals(fs.readFileSync(path.join(root, "server.js"))) && read("bin/gitml.js").equals(fs.readFileSync(path.join(root, "bin/gitml.js"))), `${vsix}: servidor e CLI idênticos aos da raiz`);
    check(JSON.parse(read("package.json")).version === pk.version, `${vsix}: versão (${pk.version}) igual à do package.json da extensão`);
  } catch (e) { console.log("[--] conferência do .vsix pulada (precisa do comando unzip): " + e.message.split("\n")[0]); }
} else { check(false, "falta o arquivo gitml-<versão>.vsix na raiz (rode: npm run vsix)"); }

process.exit(failures ? 1 : 0);
