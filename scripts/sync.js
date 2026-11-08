#!/usr/bin/env node
/*
 * Sincroniza a extensão do VS Code com o motor (gitml.js):
 *   - gera a gramática (realce de sintaxe) com TODAS as tags/atributos do motor
 *   - gera os snippets de todos os componentes
 *   - gera docs/COMPONENTES.md
 * Rode sempre que alterar componentes:  node scripts/sync.js
 */
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ext = path.join(root, "vscode-extension");
const g = require(path.join(root, "gitml.js"));
const list = g.components();
const main = list.filter((c) => !c.alias);
const VOID = new Set(g.voidTags);


/* ---------- gramática ---------- */
const common = "id class style animate align bg color pad gap width mt mb radius hide shadow";
const attrs = new Set(common.split(" "));
list.forEach((c) => String(c.attrs || "").split(/\s+/).filter(Boolean).forEach((a) => attrs.add(a)));
["theme", "accent", "font", "lang", "charset", "rel", "href", "content", "property", "icon", "description", "radius", "container", "motion", "og-image", "canonical", "theme-color", "when", "bind", "action", "do", "persist", "value", "items", "as", "is", "not", "target", "src", "path"].forEach((a) => attrs.add(a));
const tagNames = [...new Set(list.map((c) => c.tag))].sort((a, b) => b.length - a.length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const grammar = {
  $schema: "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  name: "GITML",
  scopeName: "text.html.gitml",
  patterns: [{ include: "#comment" }, { include: "#style-block" }, { include: "#script-block" }, { include: "#interpolation" }, { include: "#binding" }, { include: "#gitml-tag" }, { include: "#other-tag" }, { include: "#inline-markdown" }],
  repository: {
    comment: { name: "comment.block.gitml", begin: "<!--", end: "-->", captures: { 0: { name: "punctuation.definition.comment.gitml" } } },
    "style-block": { begin: "(<)(style)(\\b[^>]*>)", end: "(</)(style)(>)", beginCaptures: { 1: { name: "punctuation.definition.tag.begin.gitml" }, 2: { name: "entity.name.tag.gitml" }, 3: { name: "punctuation.definition.tag.end.gitml" } }, endCaptures: { 1: { name: "punctuation.definition.tag.begin.gitml" }, 2: { name: "entity.name.tag.gitml" }, 3: { name: "punctuation.definition.tag.end.gitml" } }, contentName: "source.css", patterns: [{ include: "source.css" }] },
    "script-block": { begin: "(<)(script)(\\b[^>]*>)", end: "(</)(script)(>)", beginCaptures: { 1: { name: "punctuation.definition.tag.begin.gitml" }, 2: { name: "entity.name.tag.gitml" }, 3: { name: "punctuation.definition.tag.end.gitml" } }, endCaptures: { 1: { name: "punctuation.definition.tag.begin.gitml" }, 2: { name: "entity.name.tag.gitml" }, 3: { name: "punctuation.definition.tag.end.gitml" } }, contentName: "source.js", patterns: [{ include: "source.js" }] },
    interpolation: { name: "variable.other.gitml", match: "\\{\\{\\s*[\\w.-]*\\s*\\}\\}" },
    binding: { name: "variable.other.readwrite.gitml", match: "\\{\\$[\\w.-]+\\}" },
    "inline-markdown": { patterns: [{ name: "markup.bold.gitml", match: "\\*\\*[^*\\n]+\\*\\*" }, { name: "markup.italic.gitml", match: "(?<![*\\w])\\*[^*\\s][^*\\n]*\\*(?![*\\w])" }, { name: "markup.inline.raw.gitml", match: "`[^`\\n]+`" }] },
    "gitml-tag": {
      begin: "(</?)((?i:" + tagNames.map(esc).join("|") + "))(?=[\\s/>])",
      beginCaptures: { 1: { name: "punctuation.definition.tag.begin.gitml" }, 2: { name: "entity.name.tag.gitml" } },
      end: "(/?>)", endCaptures: { 1: { name: "punctuation.definition.tag.end.gitml" } },
      patterns: [{ include: "#attribute" }]
    },
    "other-tag": {
      begin: "(</?)([A-Za-z][\\w-]*)", beginCaptures: { 1: { name: "punctuation.definition.tag.begin.gitml" }, 2: { name: "entity.name.tag.custom.gitml invalid.deprecated.unknown-tag.gitml" } },
      end: "(/?>)", endCaptures: { 1: { name: "punctuation.definition.tag.end.gitml" } }, patterns: [{ include: "#attribute" }]
    },
    attribute: {
      patterns: [
        { match: "\\b(?:" + [...attrs].map(esc).join("|") + ")\\b(?=\\s*=)", name: "entity.other.attribute-name.known.gitml" },
        { match: "\\b(?:on:|[A-Za-z_][\\w:-]*)(?=\\s*=)", name: "entity.other.attribute-name.gitml" },
        { include: "#interpolation" },
        { name: "string.quoted.double.gitml", begin: "\"", end: "\"", patterns: [{ include: "#interpolation" }] },
        { name: "string.quoted.single.gitml", begin: "'", end: "'", patterns: [{ include: "#interpolation" }] },
        { match: "\\b([A-Za-z_][\\w-]*)\\b", name: "entity.other.attribute-name.boolean.gitml" }
      ]
    }
  }
};
fs.writeFileSync(path.join(ext, "syntaxes", "gitml.tmLanguage.json"), JSON.stringify(grammar, null, 2) + "\n");

/* ---------- snippets ---------- */
const snip = {};
main.forEach((c) => {
  const keys = String(c.attrs || "").split(/\s+/).filter((a) => a && !/^(id|class|style)$/.test(a)).slice(0, 3);
  const at = keys.map((a, i) => ` ${a}="\${${i + 1}}"`).join("");
  const names = list.filter((x) => x.main === c.main).map((x) => x.tag);
  snip[c.main] = { prefix: names, description: c.desc, body: VOID.has(c.tag) ? [`<${c.tag}${at} />`] : [`<${c.tag}${at}>\${0}</${c.tag}>`] };
});
Object.assign(snip, {
  "Página GITML (dark)": { prefix: ["gitml", "page"], description: "Esqueleto de uma página", body: ['<gitml theme="${1|dark,light,auto|}" accent="${2|violet,blue,green,orange,pink,red,teal,black|}" font="space-grotesk" title="${3:Meu site}" description="${4}">', "", "  <nav brand=\"${3:Meu site}\" sticky>", "    <link href=\"#sobre\">Sobre</link>", "    <theme-toggle />", "  </nav>", "", "  <hero eyebrow=\"${5:Novo}\" title=\"${6:Título com **destaque**}\" subtitle=\"${7:Subtítulo}\" cta=\"Começar\" href=\"#sobre\"></hero>", "", "  $0", "", "</gitml>"] },
  "App com rotas": { prefix: ["app", "rotas"], description: "App de várias páginas (rotas + menu + rodapé)", body: ['<gitml theme="dark" accent="violet" title="${1:Meu app}">', "", "  <nav brand=\"${1:Meu app}\" sticky>", "    <link href=\"/\">Início</link>", "    <link href=\"/sobre\">Sobre</link>", "    <theme-toggle />", "  </nav>", "", "  <route path=\"/\" title=\"Início\">", "    <hero title=\"${2:Olá}\" subtitle=\"${3}\"></hero>", "  </route>", "", "  <route path=\"/sobre\" title=\"Sobre\">", "    <section title=\"Sobre\">$0</section>", "  </route>", "", "  <notfound><section title=\"404\"><p>Página não encontrada.</p></section></notfound>", "", "</gitml>"] },
  "Componente próprio (define)": { prefix: ["define", "meu-componente"], description: "Cria um componente reutilizável", body: ['<define name="${1:meu-componente}">', "  <card title=\"{{${2:titulo}}}\">{{children}}</card>", "</define>"] },
  "Contador com estado": { prefix: ["contador", "state"], description: "Estado reativo sem JavaScript", body: ['<state name="${1:n}" value="0" />', "<p>Valor: {\\$${1:n}}</p>", '<button action="inc:${1:n}">+1</button>', '<button action="dec:${1:n}" variant="outline">−1</button>'] },
  "Documento HTML completo (.gitml)": { prefix: ["html", "documento", "html-gitml"], description: "Documento com <html>, <head> e <body> dentro de um .gitml", body: ['<html lang="pt-BR" theme="${1|dark,light,auto|}" accent="${2|violet,blue,green,orange,pink,red,teal,black|}" font="space-grotesk">', "  <head>", "    <title>${3:Meu site}</title>", '    <meta name="description" content="${4:Descrição da página}">', '    <link rel="icon" href="${5:favicon.png}">', "    <style>", "      ${6:/* seu CSS */}", "    </style>", "  </head>", "  <body>", '    <nav brand="${3:Meu site}" sticky>', '      <link href="#sobre">Sobre</link>', "      <theme-toggle />", "    </nav>", "    <main>", "      $0", "    </main>", "  </body>", "</html>"] },
  "Incluir arquivo": { prefix: ["include"], description: "Importa outro arquivo .gitml", body: ['<include src="${1:components/menu.gitml}" />'] },
  "Rota em arquivo": { prefix: ["route-src"], description: "Página em arquivo separado (estilo pages/)", body: ['<route path="/${1:sobre}" title="${2:Sobre}" src="pages/${1:sobre}.gitml" />'] },
  "Repetir (each)": { prefix: ["each"], description: "Repete o conteúdo para cada item", body: ['<each items="${1:A,B,C}" as="${2:x}">', "  $0", "</each>"] }
});
fs.writeFileSync(path.join(ext, "snippets", "gitml.json"), JSON.stringify(snip, null, 2) + "\n");

/* ---------- docs ---------- */
const groups = {};
main.forEach((c) => (groups[c.group] = groups[c.group] || []).push(c));
let md = `# Componentes GITML ${g.version}\n\n> Gerado automaticamente por \`node scripts/sync.js\` — **${main.length} componentes** (${list.length} tags contando apelidos) e **${g.icons.length} ícones**.\n\n`;
Object.keys(groups).forEach((k) => {
  md += `## ${k}\n\n| Tag | O que faz | Atributos |\n| --- | --- | --- |\n`;
  groups[k].forEach((c) => {
    const al = list.filter((x) => x.main === c.main && x.alias).map((x) => "`<" + x.tag + ">`").join(" ");
    md += `| \`<${c.tag}>\`${al ? " " + al : ""} | ${c.desc.replace(/\|/g, "\\|")} | ${c.attrs ? c.attrs.split(/\s+/).map((a) => "`" + a + "`").join(" ") : "—"} |\n`;
  });
  md += "\n";
});
md += `## Ícones (\`<icon name="…">\`, \`icon="…"\`)\n\n${g.icons.map((i) => "`" + i + "`").join(" · ")}\n`;
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "COMPONENTES.md"), md);
console.log(`ok · ${main.length} componentes · ${list.length} tags · ${Object.keys(snip).length} snippets · ${attrs.size} atributos · ${g.icons.length} ícones`);
