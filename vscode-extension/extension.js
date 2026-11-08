"use strict";
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
/* UM ÚNICO MOTOR: no pacote .vsix o motor fica ao lado deste arquivo; na pasta do projeto fica na raiz (../).
 * Assim não existe uma segunda cópia para manter. */
const ROOT = fs.existsSync(path.join(__dirname, "gitml.js")) ? __dirname : path.resolve(__dirname, "..");
const gitml = require(path.join(ROOT, "gitml.js"));
const { startServer } = require(path.join(ROOT, "server.js"));

const VOID = new Set(gitml.voidTags);
const COMMON_ATTRS = "id class style animate align bg color pad gap width mt mb radius hide shadow".split(" ");
const ENUMS = {
  theme: ["dark", "light", "auto"], accent: ["violet", "blue", "green", "orange", "pink", "red", "teal", "black"],
  font: ["space-grotesk", "inter", "sora", "manrope", "outfit", "dm-sans", "serif", "poppins", "jakarta", "geist", "mono"],
  size: ["sm", "lg"], align: ["center", "left", "right"], animate: ["up", "fade", "zoom"], hide: ["mobile", "tablet", "desktop"],
  side: ["right", "left"], cols: ["1", "2", "3", "4", "5", "6"], motion: ["off"], target: ["_blank"], lang: ["pt-BR", "en", "es"],
  "button.variant": ["primary", "outline", "ghost", "soft", "gradient"], "card.variant": ["glass", "soft", "outline", "gradient"],
  "badge.variant": ["primary", "success", "warning", "danger"], "hero.variant": ["center", "split"],
  "alert.type": ["info", "success", "warning", "danger"], "toast.type": ["info", "success", "warning", "danger"],
  "chart.type": ["bar", "line", "area", "donut", "pie"], "status.type": ["online", "busy", "warning", "offline"],
  "input.type": ["text", "email", "password", "number", "tel", "url", "date", "search"],
  "link.rel": ["stylesheet", "icon", "preconnect", "canonical", "manifest"], "meta.name": ["description", "author", "keywords", "robots", "theme-color", "viewport"]
};
const comps = gitml.components();
const byTag = new Map(comps.map((c) => [c.tag, c]));
const cfg = () => vscode.workspace.getConfiguration("gitml");

/* ---------------- GITML dentro de HTML: <script type="text/gitml"> ---------------- */
function gitmlBlocks(text) {
  const out = [], re = /<script\b[^>]*\btype\s*=\s*["']text\/gitml["'][^>]*>/gi; let m;
  while ((m = re.exec(text))) {
    const start = m.index + m[0].length; let end = text.toLowerCase().indexOf("</script", start); if (end < 0) end = text.length;
    out.push({ start, end }); re.lastIndex = end;
  }
  return out;
}
/** Documento "virtual" só com o trecho GITML; o resto vira espaços (linhas/colunas continuam iguais). */
function makeVDoc(base, text) {
  const lines = text.split("\n"), starts = []; let acc = 0; lines.forEach((l) => { starts.push(acc); acc += l.length + 1; });
  const offsetAt = (p) => (starts[Math.min(p.line, lines.length - 1)] || 0) + p.character;
  const positionAt = (o) => { let l = 0; while (l + 1 < starts.length && starts[l + 1] <= o) l++; return new vscode.Position(l, o - starts[l]); };
  return {
    languageId: "gitml", uri: base.uri, lineCount: lines.length, offsetAt, positionAt,
    lineAt: (p) => { const i = typeof p === "number" ? p : p.line; const t = lines[i] || ""; return { text: t, range: new vscode.Range(i, 0, i, t.length), firstNonWhitespaceCharacterIndex: t.length - t.trimStart().length }; },
    getText: (r) => (r ? text.slice(offsetAt(r.start), offsetAt(r.end)) : text),
    getWordRangeAtPosition: (p, re) => { const t = lines[p.line] || ""; let s = p.character, e = p.character; re = re || /[\w-]+/; while (s > 0 && /[\w-]/.test(t[s - 1])) s--; while (e < t.length && /[\w-]/.test(t[e])) e++; return s === e ? undefined : new vscode.Range(p.line, s, p.line, e); }
  };
}
function gitmlDocAt(document, position) {
  if (document.languageId === "gitml") return document;
  if (document.languageId !== "html") return null;
  const text = document.getText(), off = document.offsetAt(position);
  const b = gitmlBlocks(text).find((x) => off >= x.start && off <= x.end);
  return b ? makeVDoc(document, text.slice(0, b.start).replace(/[^\n]/g, " ") + text.slice(b.start, b.end)) : null;
}

/* ---------------- utilidades ---------------- */
function loader(file) {
  return (p, from) => {
    try {
      const base = path.dirname(from || file || process.cwd());
      const f = path.resolve(base, /\.\w{1,6}$/.test(p) ? p : p + ".gitml");
      const open = vscode.workspace.textDocuments.find((d) => d.uri.fsPath === f);
      return { src: open ? open.getText() : fs.readFileSync(f, "utf8"), path: f };
    } catch (e) { return null; }
  };
}
function compileText(text, file, extra) { return gitml.compile(text, Object.assign({ file, resolve: loader(file) }, extra)); }
function compileDoc(document, extra) {
  const file = document.uri.scheme === "file" ? document.uri.fsPath : "";
  if (document.languageId === "html") { const b = gitmlBlocks(document.getText())[0]; return compileText(b ? document.getText().slice(b.start, b.end) : "", file, extra); }
  return compileText(document.getText(), file, extra);
}
function snippetFor(c) {
  const keys = String(c.attrs || "").split(/\s+/).filter((a) => a && !/^(id|class|style)$/.test(a)).slice(0, 3);
  const at = keys.map((a, i) => ` ${a}="\${${i + 1}}"`).join("");
  return VOID.has(c.tag) ? `${c.tag}${at} />` : `${c.tag}${at}>\${0}</${c.tag}>`;
}
function openTagAt(document, position) {
  const before = document.getText(new vscode.Range(new vscode.Position(Math.max(0, position.line - 30), 0), position));
  const lt = before.lastIndexOf("<"); if (lt < 0) return null;
  const frag = before.slice(lt); if (/^<[\/!]/.test(frag)) return null;
  let q = null;
  for (let i = 0; i < frag.length; i++) { const ch = frag[i]; if (q) { if (ch === q) q = null; } else if (ch === '"' || ch === "'") q = ch; else if (ch === ">") return null; }
  const m = /^<([A-Za-z][\w-]*)/.exec(frag);
  return m ? { name: m[1].toLowerCase(), frag, inQuote: q } : null;
}

/* ---------------- autocompletar / hover (compartilhado .gitml e HTML) ---------------- */
function completionItems(document, position) {
  const lineText = document.lineAt(position).text.slice(0, position.character);
  if (/\{\$[\w.-]*$/.test(lineText)) {
    const names = [...document.getText().matchAll(/<state\s[^>]*?name\s*=\s*["']([\w.-]+)["']/g)].map((m) => m[1]);
    return [...new Set(names)].map((n) => { const i = new vscode.CompletionItem(n, vscode.CompletionItemKind.Variable); i.insertText = n + "}"; i.detail = "estado"; return i; });
  }
  const nm = /<([\w-]*)$/.exec(lineText);
  if (nm) {
    const range = new vscode.Range(position.line, position.character - nm[1].length, position.line, position.character);
    return comps.map((c) => {
      const i = new vscode.CompletionItem(c.tag, vscode.CompletionItemKind.Class);
      i.detail = c.group + (c.alias ? " (apelido)" : ""); i.documentation = new vscode.MarkdownString(c.desc + (c.attrs ? "\n\n**Atributos:** `" + c.attrs.split(/\s+/).join("` `") + "`" : ""));
      i.insertText = new vscode.SnippetString(snippetFor(c)); i.range = range; i.sortText = (c.alias ? "1" : "0") + c.tag; return i;
    });
  }
  const tag = openTagAt(document, position);
  if (tag && tag.inQuote) {
    const m = /([\w:-]+)\s*=\s*["'][^"']*$/.exec(tag.frag); if (!m) return;
    const a = m[1].toLowerCase();
    let vals = ENUMS[tag.name + "." + a] || ENUMS[a];
    if (a === "icon" || (a === "name" && tag.name === "icon")) vals = gitml.icons;
    return vals ? vals.map((v) => { const i = new vscode.CompletionItem(v, vscode.CompletionItemKind.EnumMember); i.sortText = "0" + v; return i; }) : undefined;
  }
  if (tag) {
    const c = byTag.get(tag.name);
    const names = new Set(COMMON_ATTRS); if (c) String(c.attrs || "").split(/\s+/).filter(Boolean).forEach((a) => names.add(a));
    if (tag.name === "link") ["rel", "href"].forEach((a) => names.add(a));
    if (tag.name === "meta") ["name", "content", "charset", "property"].forEach((a) => names.add(a));
    const used = new Set([...tag.frag.matchAll(/\s([\w:-]+)\s*=/g)].map((m) => m[1]));
    return [...names].filter((n) => !used.has(n)).map((n) => {
      const i = new vscode.CompletionItem(n, vscode.CompletionItemKind.Property);
      i.insertText = new vscode.SnippetString(n + '="${1}"'); i.sortText = (c && String(c.attrs).split(/\s+/).includes(n) ? "0" : "1") + n; return i;
    });
  }
}
function hoverFor(document, position) {
  const range = document.getWordRangeAtPosition(position, /[\w-]+/); if (!range) return;
  const word = document.getText(range).toLowerCase();
  if (!/<\/?$/.test(document.lineAt(position).text.slice(0, range.start.character))) return;
  const c = byTag.get(word); if (!c) return;
  const md = new vscode.MarkdownString();
  md.appendMarkdown(`**\`<${c.tag}>\`** · ${c.group}\n\n${c.desc}`);
  if (c.attrs) md.appendMarkdown(`\n\n**Atributos:** ${c.attrs.split(/\s+/).map((a) => "`" + a + "`").join(" ")}`);
  const al = comps.filter((x) => x.main === c.main && x.tag !== c.tag).map((x) => "`<" + x.tag + ">`");
  if (al.length) md.appendMarkdown(`\n\n**Apelidos:** ${al.join(" ")}`);
  return new vscode.Hover(md, range);
}

/* ---------------- servidor local ---------------- */
const servers = new Map(); // pasta -> { handle, port }
let statusItem, channel;
function findServeRoot(file) {
  const wf = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(file));
  const stop = wf ? wf.uri.fsPath : path.parse(file).root;
  let dir = path.dirname(file);
  for (let i = 0; i < 8; i++) {
    if (["index.gitml", "app.gitml", "index.html"].some((n) => fs.existsSync(path.join(dir, n)))) return dir;
    if (dir === stop || path.dirname(dir) === dir) break;
    dir = path.dirname(dir);
  }
  return path.dirname(file);
}
async function ensureServer(root) {
  if (servers.has(root)) return servers.get(root);
  const handle = await startServer({
    root, gitml, enginePath: path.join(ROOT, "gitml.js"), port: cfg().get("server.port", 4173),
    log: (k, m) => channel.appendLine(`[${k}] ${m}`)
  });
  const entry = { handle, port: handle.port }; servers.set(root, entry); refreshStatus();
  channel.appendLine(`GITML servindo ${root} em ${handle.url}`);
  return entry;
}
function refreshStatus() {
  if (!servers.size) { statusItem.hide(); return; }
  statusItem.text = "$(globe) GITML " + [...servers.values()].map((s) => ":" + s.port).join(" ");
  statusItem.tooltip = "Servidores GITML ativos — clique para abrir ou parar"; statusItem.show();
}
async function stopAll() { for (const s of servers.values()) await s.handle.close(); servers.clear(); refreshStatus(); }
async function openInBrowser() {
  const ed = vscode.window.activeTextEditor;
  if (!ed || !["gitml", "html"].includes(ed.document.languageId) || ed.document.uri.scheme !== "file") { vscode.window.showWarningMessage("Abra um arquivo .gitml (ou .html com GITML) salvo em disco para abrir no navegador."); return; }
  if (ed.document.isDirty) await ed.document.save();
  const file = ed.document.uri.fsPath;
  try {
    const s = await ensureServer(findServeRoot(file));
    const url = s.handle.urlFor(file);
    await vscode.env.openExternal(await vscode.env.asExternalUri(vscode.Uri.parse(url)));
    statusItem.tooltip = url;
  } catch (e) { vscode.window.showErrorMessage("GITML: não consegui iniciar o servidor local — " + e.message); }
}

/* ---------------- ativação ---------------- */
function activate(context) {
  const sub = (d) => context.subscriptions.push(d);
  channel = vscode.window.createOutputChannel("GITML"); sub(channel);

  /* ---- comando `gitml` nos terminais do VS Code (gitml start, gitml serve 3000, gitml new site…) ---- */
  try {
    const binDir = path.join(ROOT, "bin");
    try { fs.chmodSync(path.join(binDir, "gitml"), 0o755); } catch (_) { }
    context.environmentVariableCollection.prepend("PATH", binDir + path.delimiter);
    context.environmentVariableCollection.description = "Adiciona o comando `gitml` (GITML) ao terminal";
    if (!context.globalState.get("gitml.pathHint")) {
      context.globalState.update("gitml.pathHint", true);
      vscode.window.showInformationMessage("GITML: o comando `gitml` já funciona nos NOVOS terminais do VS Code. Experimente: gitml start");
    }
  } catch (e) { channel.appendLine("PATH: " + e.message); }
  statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0); statusItem.command = "gitml.serverMenu"; sub(statusItem);
  sub({ dispose() { servers.forEach((s) => s.handle.close()); servers.clear(); } });

  /* ---- diagnósticos (.gitml e blocos GITML dentro de .html) ---- */
  const diagnostics = vscode.languages.createDiagnosticCollection("gitml"); sub(diagnostics);
  const timers = new Map();
  function check(document) {
    if (!["gitml", "html"].includes(document.languageId)) return;
    if (!cfg().get("diagnostics.enable", true)) { diagnostics.delete(document.uri); return; }
    const items = [], file = document.uri.scheme === "file" ? document.uri.fsPath : "";
    const add = (issue, sev, offsetLine) => {
      const ln = Math.max(0, Math.min(document.lineCount - 1, (issue.line || 1) - 1 + offsetLine)), line = document.lineAt(ln);
      const d = new vscode.Diagnostic(new vscode.Range(ln, line.firstNonWhitespaceCharacterIndex, ln, line.range.end.character), issue.message, sev);
      d.source = "GITML"; items.push(d);
    };
    if (document.languageId === "gitml") {
      const r = compileText(document.getText(), file);
      r.errors.forEach((e) => add(e, vscode.DiagnosticSeverity.Error, 0)); r.warnings.forEach((w) => add(w, vscode.DiagnosticSeverity.Warning, 0));
    } else {
      const text = document.getText();
      gitmlBlocks(text).forEach((b) => {
        const off = document.positionAt(b.start).line, r = compileText(text.slice(b.start, b.end), file);
        r.errors.forEach((e) => add(e, vscode.DiagnosticSeverity.Error, off)); r.warnings.forEach((w) => add(w, vscode.DiagnosticSeverity.Warning, off));
      });
    }
    diagnostics.set(document.uri, items);
  }
  const checkSoon = (document) => { const k = document.uri.toString(); clearTimeout(timers.get(k)); timers.set(k, setTimeout(() => check(document), 250)); };
  vscode.workspace.textDocuments.forEach(check);
  sub(vscode.workspace.onDidOpenTextDocument(check));
  sub(vscode.workspace.onDidChangeTextDocument((e) => checkSoon(e.document)));
  sub(vscode.workspace.onDidCloseTextDocument((d) => diagnostics.delete(d.uri)));
  sub(vscode.workspace.onDidChangeConfiguration(() => vscode.workspace.textDocuments.forEach(check)));

  /* ---- prévia dentro do VS Code ---- */
  const panels = new Map();
  sub({ dispose() { panels.forEach((p) => p.dispose()); } });
  sub(vscode.commands.registerCommand("gitml.preview", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !["gitml", "html"].includes(editor.document.languageId)) { vscode.window.showWarningMessage("Abra um arquivo .gitml para iniciar a prévia."); return; }
    const document = editor.document, key = document.uri.toString();
    if (panels.has(key)) { panels.get(key).reveal(vscode.ViewColumn.Beside, true); return; }
    const panel = vscode.window.createWebviewPanel("gitmlPreview", "Prévia · " + path.basename(document.fileName), { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, { enableScripts: true, retainContextWhenHidden: true });
    panels.set(key, panel);
    let t;
    const refresh = () => { const allow = vscode.workspace.isTrusted && cfg().get("preview.allowScripts", true); panel.webview.html = compileDoc(document, { allowScripts: allow }).html; };
    refresh();
    const change = vscode.workspace.onDidChangeTextDocument((e) => { if (e.document.uri.toString() === key) { clearTimeout(t); t = setTimeout(refresh, 250); } });
    panel.onDidDispose(() => { change.dispose(); clearTimeout(t); panels.delete(key); });
  }));

  /* ---- abrir no navegador (localhost) ---- */
  sub(vscode.commands.registerCommand("gitml.openBrowser", openInBrowser));
  sub(vscode.commands.registerCommand("gitml.startTerminal", () => {
    const ed = vscode.window.activeTextEditor;
    const file = ed && ed.document.uri.scheme === "file" ? ed.document.uri.fsPath : null;
    const wf = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
    const cwd = file ? findServeRoot(file) : wf ? wf.uri.fsPath : undefined;
    const cli = path.join(ROOT, "bin", "gitml.js").replace(/\\/g, "/");
    const term = vscode.window.createTerminal({ name: "GITML", cwd });
    term.show();
    term.sendText(`node "${cli}" start`);   // caminho completo: funciona mesmo sem o PATH
  }));
  sub(vscode.commands.registerCommand("gitml.serve", openInBrowser));
  sub(vscode.commands.registerCommand("gitml.stopServer", async () => { await stopAll(); vscode.window.showInformationMessage("Servidor GITML parado."); }));
  sub(vscode.commands.registerCommand("gitml.serverMenu", async () => {
    const items = [...servers.entries()].map(([root, s]) => ({ label: "$(globe) Abrir " + s.handle.url, description: root, url: s.handle.url }));
    items.push({ label: "$(debug-stop) Parar todos os servidores", stop: true });
    const pick = await vscode.window.showQuickPick(items, { placeHolder: "Servidores GITML ativos" });
    if (!pick) return;
    if (pick.stop) { await stopAll(); return; }
    vscode.env.openExternal(await vscode.env.asExternalUri(vscode.Uri.parse(pick.url)));
  }));

  /* ---- gerar HTML (nunca sobrescreve um .html que não seja do GITML sem avisar) ---- */
  sub(vscode.commands.registerCommand("gitml.build", async () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed || ed.document.languageId !== "gitml") { vscode.window.showWarningMessage("Abra um arquivo .gitml para gerar o HTML."); return; }
    const input = ed.document;
    const defaultUri = vscode.Uri.file(path.join(path.dirname(input.fileName), "dist", path.basename(input.fileName).replace(/\.gitml$/i, ".html")));
    const destination = await vscode.window.showSaveDialog({ defaultUri, filters: { "Arquivo HTML": ["html"] }, saveLabel: "Gerar HTML" });
    if (!destination) return;
    if (fs.existsSync(destination.fsPath) && !/<meta name="generator" content="GITML/.test(fs.readFileSync(destination.fsPath, "utf8"))) {
      const ok = await vscode.window.showWarningMessage(`${path.basename(destination.fsPath)} já existe e NÃO foi gerado pelo GITML (pode ser um arquivo seu). Sobrescrever?`, { modal: true }, "Sobrescrever");
      if (ok !== "Sobrescrever") return;
    }
    const result = compileDoc(input, { allowScripts: true });
    await fs.promises.mkdir(path.dirname(destination.fsPath), { recursive: true });
    await fs.promises.writeFile(destination.fsPath, result.html, "utf8");
    const message = `HTML gerado: ${path.basename(destination.fsPath)}`;
    if (result.errors.length) vscode.window.showWarningMessage(`${message} (${result.errors.length} erro(s)); confira os diagnósticos.`);
    else vscode.window.showInformationMessage(message);
  }));

  /* ---- explorar e inserir componentes ---- */
  sub(vscode.commands.registerCommand("gitml.components", async () => {
    const main = comps.filter((c) => !c.alias), items = [];
    [...new Set(main.map((c) => c.group))].forEach((g) => {
      items.push({ label: g, kind: vscode.QuickPickItemKind.Separator });
      main.filter((c) => c.group === g).forEach((c) => items.push({ label: "<" + c.tag + ">", description: c.attrs || "", detail: c.desc, c }));
    });
    const pick = await vscode.window.showQuickPick(items, { placeHolder: `Catálogo GITML — ${main.length} componentes · Enter insere no cursor`, matchOnDescription: true, matchOnDetail: true });
    if (!pick || !pick.c) return;
    const ed = vscode.window.activeTextEditor;
    if (ed && ["gitml", "html"].includes(ed.document.languageId)) ed.insertSnippet(new vscode.SnippetString("<" + snippetFor(pick.c)));
    else vscode.window.showInformationMessage(`<${pick.c.tag}> — ${pick.c.desc}`);
  }));

  /* ---- autocompletar e hover ---- */
  sub(vscode.languages.registerCompletionItemProvider(["gitml", "html"], {
    provideCompletionItems(document, position) { const d = gitmlDocAt(document, position); return d ? completionItems(d, position) : undefined; }
  }, "<", " ", '"', "'", "$"));
  sub(vscode.languages.registerHoverProvider(["gitml", "html"], {
    provideHover(document, position) { const d = gitmlDocAt(document, position); return d ? hoverFor(d, position) : undefined; }
  }));

  /* ---- formatador ---- */
  sub(vscode.languages.registerDocumentFormattingEditProvider("gitml", {
    provideDocumentFormattingEdits(document, options) {
      const text = document.getText(), out = gitml.format(text, options.insertSpaces ? " ".repeat(options.tabSize) : "\t");
      return out === text ? [] : [vscode.TextEdit.replace(new vscode.Range(document.positionAt(0), document.positionAt(text.length)), out)];
    }
  }));

  /* ---- fechar tag automaticamente ao digitar '>' ---- */
  sub(vscode.workspace.onDidChangeTextDocument((e) => {
    if (!["gitml", "html"].includes(e.document.languageId) || !cfg().get("autoCloseTags", true) || e.reason || e.contentChanges.length !== 1) return;
    const ch = e.contentChanges[0];
    if (ch.text !== ">" || ch.rangeLength !== 0) return;
    const ed = vscode.window.activeTextEditor; if (!ed || ed.document !== e.document) return;
    const pos = ch.range.start.translate(0, 1);
    const vd = gitmlDocAt(e.document, ch.range.start); if (!vd) return;
    const upto = vd.getText(new vscode.Range(new vscode.Position(Math.max(0, pos.line - 20), 0), pos));
    const m = /<([A-Za-z][\w-]*)(?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?>$/.exec(upto);
    if (!m || /\/>$/.test(upto) || VOID.has(m[1].toLowerCase())) return;
    // <link>/<meta>/<base> dentro de <head> são void
    if (/^(link|meta|base)$/i.test(m[1]) && /<head[\s>][\s\S]*$/i.test(upto) && !/<\/head>/i.test(upto.slice(upto.search(/<head[\s>]/i)))) return;
    const rest = e.document.getText(new vscode.Range(pos, pos.translate(0, m[1].length + 3)));
    if (rest.toLowerCase().startsWith("</" + m[1].toLowerCase())) return;
    ed.insertSnippet(new vscode.SnippetString("$0</" + m[1] + ">"), pos);
  }));
}
function deactivate() { return stopAll(); }
module.exports = { activate, deactivate };
