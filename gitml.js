/*!
 * GITML Engine v0.1.0 — linguagem declarativa para páginas modernas.
 * MIT License · https://github.com/Gislaine-web3/gitml
 *
 * Funciona em 3 lugares com o MESMO código:
 *   1. Node.js / VS Code   → const gitml = require('./gitml.js'); gitml.compile(src)
 *   2. Navegador (runtime) → <script src="gitml.js"></script>
 *                            <script type="text/gitml"> ... </script>
 *                            ou <script src="gitml.js" data-src="pagina.gitml"></script>
 *   3. CLI                 → npx gitml serve pagina.gitml
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module && module.exports) module.exports = api;
  if (root) root.GITML = api;
  if (typeof globalThis !== "undefined") globalThis.GITML = api;
  if (typeof document !== "undefined") api.__autoboot();
})(typeof self !== "undefined" ? self : (typeof globalThis !== "undefined" ? globalThis : this), function () {
  "use strict";
  var VERSION = "0.1.2";

  /* ------------------------------------------------------------------ *
   * 1. PARSER — tolerante a erros, com tags "raw" e auto-fechamento
   * ------------------------------------------------------------------ */
  var VOID = toSet("image img divider hr progress avatar spacer input icon br wbr meta rating countdown video map embed theme-toggle theme-switch include import use state bind param spinner skeleton toc backtotop sparkline search upload checkbox switch toggle radio range slider-input audio pagination stepper social".split(" "));
  var RAW = toSet("code style script".split(" "));
  var HEADVOID = toSet("link meta base".split(" "));
  function inHead(st) { for (var i = st.length - 1; i > 0; i--) if (st[i].tag === "head") return true; return false; }

  function toSet(arr) { var o = {}; for (var i = 0; i < arr.length; i++) o[arr[i]] = true; return o; }

  function parse(src) {
    var root = { tag: "#root", attrs: {}, children: [], line: 1 };
    var stack = [root], i = 0, n = src.length, errors = [];
    function line(at) { return src.slice(0, at).split("\n").length; }
    while (i < n) {
      if (src.startsWith("<!--", i)) {
        var e = src.indexOf("-->", i + 4); i = e < 0 ? n : e + 3; continue;
      }
      if (src[i] === "<" && src[i + 1] === "/") {
        var m = /^<\/([A-Za-z][\w-]*)\s*>/.exec(src.slice(i));
        if (m) {
          var t = m[1].toLowerCase(), idx = -1;
          for (var k = stack.length - 1; k > 0; k--) if (stack[k].tag === t) { idx = k; break; }
          if (idx > 0) { for (var q = stack.length - 1; q > idx; q--) errors.push({ line: stack[q].line, message: "<" + stack[q].tag + "> não foi fechado" }); stack.length = idx; }
          else if (!VOID[t] && !HEADVOID[t]) errors.push({ line: line(i), message: "</" + t + "> fechado sem abrir" });
          i += m[0].length; continue;
        }
      }
      if (src[i] === "<" && /[A-Za-z]/.test(src[i + 1] || "")) {
        var end = findTagEnd(src, i);
        if (end > 0) {
          var raw = src.slice(i + 1, end), selfClose = /\/\s*$/.test(raw);
          if (selfClose) raw = raw.replace(/\/\s*$/, "");
          var nm = /^([A-Za-z][\w-]*)/.exec(raw);
          var node = { tag: nm[1].toLowerCase(), attrs: parseAttrs(raw.slice(nm[1].length)), children: [], line: line(i) };
          stack[stack.length - 1].children.push(node);
          i = end + 1;
          if (RAW[node.tag] && !selfClose) {
            var close = src.toLowerCase().indexOf("</" + node.tag, i);
            if (close < 0) close = n;
            node.children.push(dedent(src.slice(i, close)));
            var gt = src.indexOf(">", close); i = gt < 0 ? n : gt + 1;
          } else if (!selfClose && !VOID[node.tag] && !(HEADVOID[node.tag] && inHead(stack))) stack.push(node);
          continue;
        }
      }
      var next = src.indexOf("<", i + 1); if (next < 0) next = n;
      stack[stack.length - 1].children.push(src.slice(i, next));
      i = next;
    }
    for (var s = stack.length - 1; s > 0; s--)
      errors.push({ line: stack[s].line, message: "<" + stack[s].tag + "> não foi fechado" });
    return { children: root.children, errors: errors };
  }
  function findTagEnd(src, i) {
    var q = null;
    for (var j = i + 1; j < src.length; j++) {
      var c = src[j];
      if (q) { if (c === q) q = null; }
      else if (c === '"' || c === "'") q = c;
      else if (c === ">") return j;
      else if (c === "<") return -1;
    }
    return -1;
  }
  function parseAttrs(s) {
    var a = {}, re = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g, m;
    while ((m = re.exec(s))) a[m[1].toLowerCase()] = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : "true";
    return a;
  }
  function dedent(s) {
    s = s.replace(/^\n/, "").replace(/\s+$/, "");
    var ls = s.split("\n"), min = Infinity;
    ls.forEach(function (l) { if (l.trim()) min = Math.min(min, l.match(/^ */)[0].length); });
    return min === Infinity ? s : ls.map(function (l) { return l.slice(min); }).join("\n");
  }

  /* ------------------------------------------------------------------ *
   * 2. HELPERS
   * ------------------------------------------------------------------ */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* ---- v0.1: helpers de segurança/estilo ---- */
  function safeUrl(u) {
    u = String(u == null || u === "" ? "#" : u).trim();
    var flat = u.replace(/[\u0000-\u0020\u00a0\u200b]/g, "").toLowerCase();
    if (/^(javascript|vbscript|livescript):/.test(flat)) return "#";
    if (/^data:/.test(flat) && !/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/.test(flat)) return "#";
    return esc(u);
  }
  function num(v, d, lo, hi) { var x = Number(v); if (!isFinite(x)) x = d; return Math.max(lo, Math.min(hi, x)); }
  function inline(text) {
    // **negrito**, *itálico*, ~~riscado~~, ==marca==, `código`, [link](url) e {$estado}
    return esc(text)
      .replace(/`([^`]+)`/g, "<code class='g-inline-code'>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>")
      .replace(/~~(.+?)~~/g, "<s>$1</s>")
      .replace(/==(.+?)==/g, "<mark class='g-mark'>$1</mark>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) { return "<a href='" + safeUrl(u) + "'>" + t + "</a>"; })
      .replace(/\{\$([\w.-]+)\}/g, "<span data-g-bind='$1'></span>");
  }
  var SIZES = { none: "0", xs: "4px", sm: "8px", md: "16px", lg: "32px", xl: "48px" };
  var WIDTHS = { small: "640px", medium: "960px", large: "1200px", wide: "1400px", full: "100%" };
  function unit(v) { v = String(v).trim(); if (SIZES[v]) return SIZES[v]; return /^-?\d+(\.\d+)?$/.test(v) ? v + "px" : v; }
  function commonAttrs(a, extraClass, extraStyle) {
    var cls = ["g-" + (extraClass || "")];
    if (a["class"]) cls.push(esc(a["class"]));
    if (a.animate) cls.push("g-anim g-anim-" + esc(a.animate === "true" ? "up" : a.animate));
    if (a.align) cls.push("g-align-" + esc(a.align));
    if (a.hide) cls.push("g-hide-" + esc(a.hide));
    if (a.shadow) cls.push("g-shadow");
    var out = ' class="' + cls.join(" ").trim() + '"';
    if (a.id) out += ' id="' + esc(a.id) + '"';
    var st = [];
    if (extraStyle) st.push(extraStyle);
    if (a.bg) st.push("background:" + cssColor(a.bg));
    if (a.color) st.push("color:" + cssColor(a.color));
    if (a.pad) st.push("padding:" + esc(unit(a.pad)));
    if (a.gap) st.push("gap:" + esc(unit(a.gap)));
    if (a.width) st.push("max-width:" + esc(WIDTHS[a.width] || unit(a.width)));
    if (a.mt) st.push("margin-top:" + esc(unit(a.mt)));
    if (a.mb) st.push("margin-bottom:" + esc(unit(a.mb)));
    if (a.radius) st.push("border-radius:" + esc(unit(a.radius)));
    if (a.style) st.push(esc(a.style));
    if (st.length) out += ' style="' + st.join(";") + '"';
    return out;
  }
  function cssColor(c) {
    var named = { primary: "var(--g-primary)", accent: "var(--g-accent)", muted: "var(--g-muted)", surface: "var(--g-surface)", soft: "var(--g-soft)", gradient: "var(--g-gradient)", dark: "#07080d", light: "#fbfbfd" };
    return named[c] || esc(c);
  }
  var CUR = { allowScripts: false };

  /* includes: <include src="parte.gitml"> e <route src="pages/x.gitml" /> */
  var INC_RE = /<(include|import)\s+([^>]*?)\/?>(?:\s*<\/\1>)?/gi;
  function resolveIncludes(src, loader, from, depth) {
    depth = depth || 0;
    return String(src).replace(INC_RE, function (m, tag, rest) {
      var p = parseAttrs(" " + rest).src;
      if (!p) return "";
      if (depth > 8) return "<!-- include: profundidade máxima em " + p + " -->";
      var r = null; try { r = loader(p, from); } catch (e) { r = null; }
      if (r == null || (typeof r === "object" && r.src == null)) return "<!-- include não encontrado: " + String(p).replace(/-->/g, "") + " -->";
      var text = typeof r === "string" ? r : r.src, path = typeof r === "string" ? p : (r.path || p);
      return resolveIncludes(text.replace(/<route\b([^>]*?)\bsrc\s*=\s*(["'])([^"']+)\2([^>]*?)\/>/gi, routeSrc), loader, path, depth + 1);
    });
  }
  function routeSrc(m, pre, q, p, post) { return "<route" + pre + post + '><include src="' + p + '"></include></route>'; }

  /* Ícones SVG embutidos (traço estilo Lucide) */
  var ICONS = {
    zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
    star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z",
    check: "M20 6 9 17l-5-5",
    x: "M18 6 6 18M6 6l12 12",
    heart: "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z",
    rocket: "M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    code: "m16 18 6-6-6-6M8 6l-6 6 6 6",
    globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z",
    mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
    phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    chart: "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
    lock: "M5 11h14v11H5zM7 11V7a5 5 0 0 1 10 0v4",
    cloud: "M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z",
    layers: "m12 2 10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5",
    sparkles: "M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2zM5 3v4M3 5h4M19 17v4M17 19h4",
    arrow: "M5 12h14M12 5l7 7-7 7",
    play: "M6 3l14 9-14 9z",
    github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5 5 0 0 0 19.9 1S18.7.7 16 2.5a13.4 13.4 0 0 0-7 0C6.3.7 5.1 1 5.1 1A5 5 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.7c0 5.5 3.3 6.7 6.4 7A3.4 3.4 0 0 0 9 18.1V22",
    cpu: "M4 4h16v16H4zM9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
    menu: "M3 6h18M3 12h18M3 18h18",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
    moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    copy: "M9 9h13v13H9zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
    alert: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01",
    map: "M1 6v16l7-4 8 4 7-4V2l-7 4-8-4zM8 2v16M16 6v16",
    cart: "M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6",
    graduation: "M22 10 12 5 2 10l10 5zM6 12v5c3 3 9 3 12 0v-5"
  };
  Object.assign(ICONS, {
    search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
    sliders: "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
    trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    external: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
    calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
    image: "M3 3h18v18H3zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
    tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01",
    bookmark: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z",
    share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
    trending: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
    award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.2 13.9 7 23l5-3 5 3-1.2-9.1",
    target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    key: "M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4",
    "chevron-down": "m6 9 6 6 6-6",
    "chevron-up": "m18 15-6-6-6 6",
    "chevron-right": "m9 18 6-6-6-6",
    "chevron-left": "m15 18-6-6 6-6",
    twitter: "M23 3a10.9 10.9 0 0 1-3.1 1.6 4.5 4.5 0 0 0-7.7 4.1A12.9 12.9 0 0 1 1.7 3.9a4.5 4.5 0 0 0 1.4 6 4.4 4.4 0 0 1-2-.6 4.5 4.5 0 0 0 3.6 4.5 4.5 4.5 0 0 1-2 .1 4.5 4.5 0 0 0 4.2 3.1A9 9 0 0 1 1 18.5a12.8 12.8 0 0 0 6.9 2c8.3 0 12.8-6.9 12.8-12.8v-.6A9.1 9.1 0 0 0 23 3z",
    linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    instagram: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM16 11.4a4 4 0 1 1-7.9 1.2 4 4 0 0 1 7.9-1.2zM17.5 6.5h.01",
    youtube: "M22.5 6.4a2.8 2.8 0 0 0-2-2C18.8 4 12 4 12 4s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2C1 8.1 1 12 1 12s0 3.9.5 5.6a2.8 2.8 0 0 0 2 2C5.2 20 12 20 12 20s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2C23 15.9 23 12 23 12s0-3.9-.5-5.6zM9.7 15.5v-7l6 3.5z",
    facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
    "check-circle": "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14l-3-3",
    "x-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6",
    database: "M12 8c5 0 9-1.3 9-3s-4-3-9-3-9 1.3-9 3 4 3 9 3zM21 12c0 1.7-4 3-9 3s-9-1.3-9-3M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5",
    terminal: "M4 17l6-6-6-6M12 19h8",
    smartphone: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01",
    monitor: "M2 3h20v14H2zM8 21h8M12 17v4",
    package: "M16.5 9.4 7.5 4.2M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7 12 12l8.7-5M12 22V12",
    "credit-card": "M1 4h22v16H1zM1 10h22",
    link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
    "log-in": "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
    "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    filter: "M22 3H2l8 9.5V19l4 2v-8.5z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
    briefcase: "M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",
    dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
    wifi: "M5 12.6a11 11 0 0 1 14.1 0M1.4 9a16 16 0 0 1 21.2 0M8.5 16.1a6 6 0 0 1 7 0M12 20h.01",
    refresh: "M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"
  });

  function icon(name, size) {
    var d = ICONS[name];
    if (!d) return '<span class="g-emoji" style="font-size:' + (size || 22) + 'px">' + esc(name) + "</span>";
    return '<svg class="g-icon" width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  /* ------------------------------------------------------------------ *
   * 3. COMPONENTES — cada um recebe (attrs, innerHtml, node, ctx)
   * ------------------------------------------------------------------ */
  var C = {};
  function def(names, info, fn) { info.main = names.split(" ")[0]; names.split(" ").forEach(function (nm) { C[nm] = { render: fn, info: info, group: info.group }; }); }

  // --- Estrutura
  def("gitml page html", { group: "Estrutura", desc: "Raiz do documento (<gitml> ou <html>): theme, accent, font, lang, title", attrs: "theme accent font lang title" },
    function (a, h) { return '<div class="g-page">' + h + "</div>"; });
  def("body", { group: "Estrutura", desc: "Corpo do documento: class, style, id (aplicados ao <body> real)", attrs: "class style id" },
    function (a, h, n, ctx) { ctx.bodyAttrs = a; return h; });
  def("title", { group: "Estrutura", desc: "Título da aba (use dentro de <head>)", attrs: "" }, function () { return ""; });
  def("base", { group: "Estrutura", desc: "Endereço base dos links (dentro de <head>): href", attrs: "href" }, function () { return ""; });
  def("head meta", { group: "Estrutura", desc: "Metadados da página (title, description, icon)", attrs: "title description icon lang" }, function () { return ""; });
  def("section", { group: "Estrutura", desc: "Seção com título opcional", attrs: "title subtitle eyebrow id bg" },
    function (a, h) {
      var head = a.title || a.eyebrow ? '<header class="g-section-head">' + (a.eyebrow ? '<span class="g-eyebrow">' + esc(a.eyebrow) + "</span>" : "") + (a.title ? "<h2>" + inline(a.title) + "</h2>" : "") + (a.subtitle ? "<p>" + inline(a.subtitle) + "</p>" : "") + "</header>" : "";
      return "<section" + commonAttrs(a, "section") + '><div class="g-wrap">' + head + h + "</div></section>";
    });
  def("container", { group: "Estrutura", desc: "Centraliza o conteúdo", attrs: "width" }, function (a, h) { return "<div" + commonAttrs(a, "wrap") + ">" + h + "</div>"; });
  def("grid", { group: "Layout", desc: "Grade responsiva", attrs: "cols gap" },
    function (a, h) { return "<div" + commonAttrs(a, "grid", "--cols:" + num(a.cols, 3, 1, 6)) + ">" + h + "</div>"; });
  def("row stack", { group: "Layout", desc: "Linha flexível (row) ou pilha vertical (stack)", attrs: "gap align justify wrap" },
    function (a, h, n) { return "<div" + commonAttrs(a, n.tag) + (a.justify ? ' data-justify="' + esc(a.justify) + '"' : "") + ">" + h + "</div>"; });
  def("col", { group: "Layout", desc: "Coluna dentro de row (span)", attrs: "span" },
    function (a, h) { return '<div class="g-col" style="flex:' + num(a.span, 1, 1, 12) + '">' + h + "</div>"; });
  def("split", { group: "Layout", desc: "Duas colunas: texto + mídia", attrs: "reverse" },
    function (a, h) { return "<div" + commonAttrs(a, "split" + (a.reverse === "true" ? " g-reverse" : "")) + ">" + h + "</div>"; });
  def("bento", { group: "Layout", desc: "Grade estilo bento (Apple)", attrs: "" }, function (a, h) { return "<div" + commonAttrs(a, "bento") + ">" + h + "</div>"; });
  def("spacer", { group: "Layout", desc: "Espaço vertical", attrs: "size" }, function (a) { return '<div style="height:' + num(a.size, 32, 0, 400) + 'px"></div>'; });
  def("divider hr", { group: "Layout", desc: "Linha divisória com texto opcional", attrs: "text" },
    function (a) { return a.text ? '<div class="g-divider-t"><span>' + esc(a.text) + "</span></div>" : '<hr class="g-divider">'; });

  // --- Navegação
  def("nav navbar", { group: "Navegação", desc: "Barra de navegação fixa com menu mobile", attrs: "brand logo sticky" },
    function (a, h) {
      var brand = (a.logo ? '<img src="' + safeUrl(a.logo) + '" alt="">' : "") + esc(a.brand || "GITML");
      return '<header class="g-nav' + (a.sticky === "false" ? "" : " g-sticky") + '"><div class="g-wrap g-nav-in"><a class="g-brand" href="#">' + brand + '</a><button class="g-burger" aria-label="Menu" data-g-burger>' + icon("menu") + '</button><nav class="g-nav-links">' + h + "</nav></div></header>";
    });
  def("link", { group: "Navegação", desc: "Link de texto", attrs: "href" }, function (a, h) { return '<a class="g-link" href="' + safeUrl(a.href) + '">' + (h || esc(a.text)) + "</a>"; });
  def("breadcrumb", { group: "Navegação", desc: "Trilha: items=\"Início/Docs/API\"", attrs: "items" },
    function (a) { return '<nav class="g-crumb">' + String(a.items || "").split("/").map(function (x) { return "<span>" + esc(x.trim()) + "</span>"; }).join('<i>/</i>') + "</nav>"; });
  def("footer", { group: "Navegação", desc: "Rodapé", attrs: "brand" },
    function (a, h) { return '<footer class="g-footer"><div class="g-wrap">' + (a.brand ? '<strong class="g-brand">' + esc(a.brand) + "</strong>" : "") + '<div class="g-footer-in">' + h + "</div></div></footer>"; });
  def("theme-toggle", { group: "Navegação", desc: "Botão claro/escuro", attrs: "" },
    function () { return '<button class="g-btn g-btn-ghost g-icon-btn" data-g-theme aria-label="Alternar tema">' + icon("moon", 18) + "</button>"; });

  // --- Conteúdo / Hero
  def("hero", { group: "Destaque", desc: "Cabeçalho principal impactante", attrs: "title subtitle eyebrow cta href cta2 href2 image variant" },
    function (a, h) {
      var title = a.title ? "<h1>" + inline(a.title) + "</h1>" : "";
      var acts = (a.cta ? '<a class="g-btn g-btn-primary g-btn-lg" href="' + safeUrl(a.href) + '">' + esc(a.cta) + icon("arrow", 18) + "</a>" : "") + (a.cta2 ? '<a class="g-btn g-btn-outline g-btn-lg" href="' + safeUrl(a.href2) + '">' + esc(a.cta2) + "</a>" : "");
      var body = (a.eyebrow ? '<span class="g-pill">' + icon("sparkles", 14) + esc(a.eyebrow) + "</span>" : "") + title + (a.subtitle ? '<p class="g-lead">' + inline(a.subtitle) + "</p>" : "") + h + (acts ? '<div class="g-actions">' + acts + "</div>" : "");
      var img = a.image ? '<div class="g-hero-media"><img src="' + safeUrl(a.image) + '" alt=""></div>' : "";
      return '<section class="g-hero g-hero-' + esc(a.variant || "center") + '"><div class="g-hero-glow"></div><div class="g-wrap g-hero-in"><div class="g-hero-body g-anim g-anim-up">' + body + "</div>" + img + "</div></section>";
    });
  def("grad gradient", { group: "Tipografia", desc: "Texto com degradê", attrs: "" }, function (a, h) { return '<span class="g-grad">' + (h || esc(a.text)) + "</span>"; });
  def("h1 h2 h3 h4", { group: "Tipografia", desc: "Títulos", attrs: "align" }, function (a, h, n) { return "<" + n.tag + commonAttrs(a, "h") + ">" + h + "</" + n.tag + ">"; });
  def("p text", { group: "Tipografia", desc: "Parágrafo (aceita **negrito**, *itálico*, `código`, [link](url))", attrs: "size muted" },
    function (a, h) { return "<p" + commonAttrs(a, "p" + (a.muted ? " g-muted" : "") + (a.size === "lg" ? " g-lead" : "")) + ">" + h + "</p>"; });
  def("quote blockquote", { group: "Tipografia", desc: "Citação", attrs: "author" },
    function (a, h) { return '<blockquote class="g-quote">' + h + (a.author ? "<cite>— " + esc(a.author) + "</cite>" : "") + "</blockquote>"; });
  def("kbd", { group: "Tipografia", desc: "Tecla de atalho", attrs: "" }, function (a, h) { return '<kbd class="g-kbd">' + h + "</kbd>"; });
  def("mark", { group: "Tipografia", desc: "Texto marcado", attrs: "" }, function (a, h) { return '<mark class="g-mark">' + h + "</mark>"; });
  def("ul list", { group: "Tipografia", desc: "Lista com ícones (icon=check)", attrs: "icon" },
    function (a, h) { return '<ul class="g-list' + (a.icon ? " g-list-icon" : "") + '"' + (a.icon ? ' data-icon="' + esc(a.icon) + '"' : "") + ">" + h + "</ul>"; });
  def("ol", { group: "Tipografia", desc: "Lista numerada", attrs: "" }, function (a, h) { return '<ol class="g-list">' + h + "</ol>"; });
  def("li item", { group: "Tipografia", desc: "Item de lista", attrs: "" }, function (a, h, n, ctx) { return "<li>" + (ctx.parentIcon ? '<span class="g-li-ic">' + icon(ctx.parentIcon, 16) + "</span>" : "") + "<span>" + h + "</span></li>"; });
  def("code", { group: "Tipografia", desc: "Bloco de código com botão copiar", attrs: "lang title" },
    function (a, h, n) {
      var txt = typeof n.children[0] === "string" ? n.children[0] : "";
      return '<div class="g-code"><div class="g-code-bar"><span class="g-dots"><i></i><i></i><i></i></span><span>' + esc(a.title || a.lang || "código") + '</span><button data-g-copy aria-label="Copiar">' + icon("copy", 14) + '</button></div><pre><code>' + esc(txt) + "</code></pre></div>";
    });

  // --- Ações
  def("button btn", { group: "Ações", desc: "Botão: variant=primary|outline|ghost|soft size=sm|lg icon", attrs: "href variant size icon" },
    function (a, h) {
      var v = a.variant || "primary";
      return '<a class="g-btn g-btn-' + esc(v) + (a.size ? " g-btn-" + esc(a.size) : "") + '" href="' + safeUrl(a.href) + '"' + (a.target ? ' target="' + esc(a.target) + '" rel="noopener"' : "") + ">" + (a.icon ? icon(a.icon, 18) : "") + (h || esc(a.text || "Botão")) + "</a>";
    });
  def("actions", { group: "Ações", desc: "Agrupa botões", attrs: "align" }, function (a, h) { return "<div" + commonAttrs(a, "actions") + ">" + h + "</div>"; });

  // --- Dados / Cards
  def("card", { group: "Cards", desc: "Cartão: title, icon, image, href, variant=glass|soft|outline", attrs: "title icon image href variant" },
    function (a, h) {
      var tag = a.href ? "a" : "article";
      return "<" + tag + commonAttrs(a, "card g-card-" + esc(a.variant || "default")) + (a.href ? ' href="' + safeUrl(a.href) + '"' : "") + ">" + (a.image ? '<img class="g-card-img" src="' + safeUrl(a.image) + '" alt="">' : "") + (a.icon ? '<div class="g-card-icon">' + icon(a.icon) + "</div>" : "") + (a.title ? "<h3>" + inline(a.title) + "</h3>" : "") + h + "</" + tag + ">";
    });
  def("feature", { group: "Cards", desc: "Recurso com ícone", attrs: "icon title" },
    function (a, h) { return '<article class="g-feature g-anim g-anim-up"><div class="g-card-icon">' + icon(a.icon || "sparkles") + "</div><h3>" + inline(a.title || "") + "</h3><p>" + h + "</p></article>"; });
  def("stat", { group: "Cards", desc: "Número de destaque (anima ao aparecer)", attrs: "num label prefix suffix" },
    function (a, h) { return '<div class="g-stat"><strong data-g-count="' + esc(String(a.num || a.value || "0")) + '">' + esc(a.num || a.value || "0") + "</strong><span>" + (esc(a.label || "") || h) + "</span></div>"; });
  def("pricing plan", { group: "Cards", desc: "Plano de preço", attrs: "tier price period featured cta href" },
    function (a, h) {
      var f = a.featured === "true";
      return '<article class="g-pricing' + (f ? " g-featured" : "") + '">' + (f ? '<span class="g-pricing-tag">Mais popular</span>' : "") + "<h3>" + esc(a.tier || a.name || "Plano") + '</h3><div class="g-price">' + esc(a.price || "R$ 0") + "<small>" + esc(a.period || "/mês") + '</small></div><div class="g-pricing-body">' + h + '</div><a class="g-btn ' + (f ? "g-btn-primary" : "g-btn-outline") + '" href="' + safeUrl(a.href) + '">' + esc(a.cta || "Começar") + "</a></article>";
    });
  def("testimonial", { group: "Cards", desc: "Depoimento com avatar", attrs: "name role avatar rating" },
    function (a, h) {
      var stars = a.rating ? '<div class="g-stars">' + new Array(Math.round(num(a.rating, 5, 1, 5)) + 1).join("★") + "</div>" : "";
      return '<figure class="g-testimonial">' + stars + "<blockquote>“" + h.trim() + '”</blockquote><figcaption>' + avatarHtml(a.name, a.avatar) + "<div><strong>" + esc(a.name || "Cliente") + "</strong><span>" + esc(a.role || "") + "</span></div></figcaption></figure>";
    });
  function avatarHtml(name, src, size) {
    var s = size || 40;
    return src ? '<img class="g-avatar" style="width:' + s + "px;height:" + s + 'px" src="' + safeUrl(src) + '" alt="">' : '<span class="g-avatar" style="width:' + s + "px;height:" + s + 'px">' + esc(String(name || "G").split(" ").map(function (p) { return p[0]; }).slice(0, 2).join("")) + "</span>";
  }
  def("avatar", { group: "Cards", desc: "Avatar com iniciais ou imagem", attrs: "name src size" }, function (a) { return avatarHtml(a.name, a.src, num(a.size, 40, 16, 200)); });
  def("avatars", { group: "Cards", desc: "Grupo de avatares sobrepostos", attrs: "" }, function (a, h) { return '<div class="g-avatars">' + h + "</div>"; });
  def("team member", { group: "Cards", desc: "Membro da equipe", attrs: "name role src" },
    function (a, h) { return '<article class="g-member">' + avatarHtml(a.name, a.src, 88) + "<strong>" + esc(a.name || "") + "</strong><span>" + esc(a.role || "") + "</span>" + (h ? "<p>" + h + "</p>" : "") + "</article>"; });
  def("table", { group: "Dados", desc: "Tabela: primeira linha vira cabeçalho", attrs: "" }, function (a, h) { return '<div class="g-table-wrap"><table class="g-table">' + h + "</table></div>"; });
  def("tr", { group: "Dados", desc: "Linha de tabela", attrs: "" }, function (a, h) { return "<tr>" + h + "</tr>"; });
  def("td th", { group: "Dados", desc: "Célula", attrs: "" }, function (a, h, n) { return "<" + n.tag + ">" + h + "</" + n.tag + ">"; });
  def("progress", { group: "Dados", desc: "Barra de progresso", attrs: "value label" },
    function (a) { var v = num(a.value, 50, 0, 100); return '<div class="g-progress-w">' + (a.label ? '<div class="g-progress-l"><span>' + esc(a.label) + "</span><span>" + v + "%</span></div>" : "") + '<div class="g-progress"><span style="width:' + v + '%"></span></div></div>'; });
  def("rating", { group: "Dados", desc: "Estrelas de avaliação", attrs: "value" },
    function (a) { var v = num(a.value, 5, 0, 5); return '<span class="g-stars">' + new Array(Math.round(v) + 1).join("★") + '<i>' + new Array(6 - Math.round(v)).join("★") + "</i></span>"; });
  def("countdown", { group: "Dados", desc: "Contagem regressiva até to=\"2026-12-31\"", attrs: "to" },
    function (a) { return '<div class="g-countdown" data-g-countdown="' + esc(a.to || "") + '">' + ["dias", "horas", "min", "seg"].map(function (l) { return "<div><strong>00</strong><span>" + l + "</span></div>"; }).join("") + "</div>"; });

  // --- Feedback
  def("badge chip tag", { group: "Feedback", desc: "Etiqueta: variant=primary|success|warning|danger", attrs: "variant" },
    function (a, h) { return '<span class="g-badge g-badge-' + esc(a.variant || "primary") + '">' + (h || esc(a.text)) + "</span>"; });
  def("alert callout", { group: "Feedback", desc: "Aviso: type=info|success|warning|danger", attrs: "type title" },
    function (a, h) { var t = a.type || "info"; var ic = { info: "info", success: "check", warning: "alert", danger: "alert" }[t] || "info"; return '<aside class="g-alert g-alert-' + esc(t) + '">' + icon(ic, 20) + "<div>" + (a.title ? "<strong>" + esc(a.title) + "</strong>" : "") + "<div>" + h + "</div></div></aside>"; });
  def("tooltip", { group: "Feedback", desc: "Dica ao passar o mouse", attrs: "text" }, function (a, h) { return '<span class="g-tip" data-tip="' + esc(a.text || "") + '">' + h + "</span>"; });
  def("banner announcement", { group: "Feedback", desc: "Faixa de anúncio no topo", attrs: "href" },
    function (a, h) { return '<div class="g-banner">' + h + (a.href ? ' <a href="' + safeUrl(a.href) + '">Saiba mais →</a>' : "") + "</div>"; });

  // --- Interativos
  def("accordion faq", { group: "Interativos", desc: "Pergunta expansível (title ou q)", attrs: "title q open" },
    function (a, h) { return '<details class="g-acc"' + (a.open === "true" ? " open" : "") + "><summary>" + esc(a.title || a.q || "Pergunta") + '<span class="g-acc-i">+</span></summary><div class="g-acc-b">' + h + "</div></details>"; });
  def("tabs", { group: "Interativos", desc: "Abas (contém <tab label>)", attrs: "" },
    function (a, h, n) {
      var labels = n.children.filter(function (c) { return typeof c !== "string" && c.tag === "tab"; }).map(function (c, i) { return '<button role="tab" data-g-tab="' + i + '"' + (i === 0 ? ' aria-selected="true"' : "") + ">" + esc(c.attrs.label || "Aba " + (i + 1)) + "</button>"; }).join("");
      return '<div class="g-tabs" data-g-tabs><div class="g-tabs-list" role="tablist">' + labels + "</div>" + h + "</div>";
    });
  def("tab", { group: "Interativos", desc: "Conteúdo de uma aba", attrs: "label" }, function (a, h, n, ctx) { var i = ctx.tabIndex++; return '<div class="g-tab-panel" data-g-panel="' + i + '"' + (i ? " hidden" : "") + ">" + h + "</div>"; });
  def("modal", { group: "Interativos", desc: "Janela modal aberta por botão", attrs: "trigger title" },
    function (a, h, n, ctx) { var id = "gm" + ctx.uid++; return '<button class="g-btn g-btn-primary" data-g-open="' + id + '">' + esc(a.trigger || "Abrir") + '</button><dialog class="g-modal" id="' + id + '"><form method="dialog"><button class="g-modal-x" aria-label="Fechar">' + icon("x", 18) + "</button></form>" + (a.title ? "<h3>" + esc(a.title) + "</h3>" : "") + h + "</dialog>"; });
  def("carousel slider", { group: "Interativos", desc: "Carrossel horizontal com rolagem", attrs: "" }, function (a, h) { return '<div class="g-carousel">' + h + "</div>"; });
  def("marquee logos", { group: "Interativos", desc: "Faixa de logos/textos em movimento", attrs: "" },
    function (a, h) { return '<div class="g-marquee"><div class="g-marquee-t"><span class="g-m-i">' + h + '</span><span class="g-m-i" aria-hidden="true">' + h + "</span></div></div>"; });

  // --- Mídia
  def("image img", { group: "Mídia", desc: "Imagem arredondada", attrs: "src alt rounded" },
    function (a) { return '<img class="g-image" src="' + safeUrl(a.src) + '" alt="' + esc(a.alt || "") + '" loading="lazy">'; });
  def("video", { group: "Mídia", desc: "Vídeo (arquivo ou YouTube)", attrs: "src" },
    function (a) {
      var yt = /(?:youtu\.be\/|v=)([\w-]{11})/.exec(a.src || "");
      return yt ? '<div class="g-embed"><iframe src="https://www.youtube.com/embed/' + yt[1] + '" allowfullscreen loading="lazy"></iframe></div>' : '<video class="g-image" src="' + safeUrl(a.src) + '" controls></video>';
    });
  def("map", { group: "Mídia", desc: "Mapa do Google: q=\"São Paulo\"", attrs: "q" },
    function (a) { return '<div class="g-embed"><iframe loading="lazy" src="https://maps.google.com/maps?q=' + encodeURIComponent(a.q || "") + '&output=embed"></iframe></div>'; });
  def("icon", { group: "Mídia", desc: "Ícone embutido: name=" + Object.keys(ICONS).slice(0, 6).join("|") + "… ou emoji", attrs: "name size" }, function (a) { return icon(a.name || "star", num(a.size, 22, 8, 128)); });
  def("browser", { group: "Mídia", desc: "Moldura de navegador para screenshots", attrs: "url" },
    function (a, h) { return '<div class="g-browser"><div class="g-code-bar"><span class="g-dots"><i></i><i></i><i></i></span><span class="g-url">' + esc(a.url || "seusite.com") + "</span></div>" + h + "</div>"; });

  // --- Formulários
  def("form", { group: "Formulários", desc: "Formulário (action, method)", attrs: "action method" },
    function (a, h) { return '<form class="g-form" action="' + safeUrl(a.action || "#") + '" method="' + esc(a.method || "post") + '">' + h + "</form>"; });
  def("input field", { group: "Formulários", desc: "Campo: label, type, placeholder, name", attrs: "label type placeholder name required" },
    function (a) { return '<label class="g-field">' + (a.label ? "<span>" + esc(a.label) + "</span>" : "") + '<input type="' + esc(a.type || "text") + '" name="' + esc(a.name || "") + '" placeholder="' + esc(a.placeholder || "") + '"' + (a.required ? " required" : "") + "></label>"; });
  def("textarea", { group: "Formulários", desc: "Texto longo", attrs: "label name placeholder" },
    function (a, h) { return '<label class="g-field">' + (a.label ? "<span>" + esc(a.label) + "</span>" : "") + '<textarea name="' + esc(a.name || "") + '" placeholder="' + esc(a.placeholder || "") + '" rows="4">' + h + "</textarea></label>"; });
  def("select", { group: "Formulários", desc: "Lista: options=\"A,B,C\"", attrs: "label name options" },
    function (a) { return '<label class="g-field">' + (a.label ? "<span>" + esc(a.label) + "</span>" : "") + '<select name="' + esc(a.name || "") + '">' + String(a.options || "").split(",").map(function (o) { return "<option>" + esc(o.trim()) + "</option>"; }).join("") + "</select></label>"; });
  def("submit", { group: "Formulários", desc: "Botão de enviar", attrs: "" }, function (a, h) { return '<button type="submit" class="g-btn g-btn-primary">' + (h || "Enviar") + "</button>"; });
  def("newsletter", { group: "Formulários", desc: "Captura de e-mail em linha", attrs: "placeholder button action" },
    function (a) { return '<form class="g-newsletter" action="' + safeUrl(a.action || "#") + '"><input type="email" required placeholder="' + esc(a.placeholder || "seu@email.com") + '"><button class="g-btn g-btn-primary">' + esc(a.button || "Inscrever") + "</button></form>"; });

  // --- Seções prontas
  def("timeline", { group: "Seções", desc: "Linha do tempo vertical", attrs: "" }, function (a, h) { return '<ol class="g-timeline">' + h + "</ol>"; });
  def("step", { group: "Seções", desc: "Etapa da timeline", attrs: "title date" },
    function (a, h) { return '<li class="g-step"><span class="g-step-dot"></span>' + (a.date ? '<span class="g-eyebrow">' + esc(a.date) + "</span>" : "") + (a.title ? "<h3>" + esc(a.title) + "</h3>" : "") + "<div>" + h + "</div></li>"; });
  def("cta", { group: "Seções", desc: "Chamada final para ação", attrs: "title button href" },
    function (a, h) { return '<section class="g-wrap"><div class="g-cta g-anim g-anim-up"><h2>' + inline(a.title || "Vamos começar?") + "</h2>" + (h ? "<p>" + h + "</p>" : "") + (a.button ? '<a class="g-btn g-btn-light g-btn-lg" href="' + safeUrl(a.href) + '">' + esc(a.button) + "</a>" : "") + "</div></section>"; });

  /* ================================================================== *
   * v0.1 — COMPONENTES NOVOS: App, Estado, Dados, Formulários, HTML…
   * ================================================================== */
  function textOf(n) { return (n.children || []).map(function (c) { return typeof c === "string" ? c : textOf(c); }).join("").replace(/\s+/g, " ").trim(); }
  function truthy(v) { return v != null && v !== "" && v !== "false" && v !== "0"; }
  function csv(s) { return String(s || "").split(",").map(function (x) { return x.trim(); }).filter(Boolean); }
  function starsHtml(v) { var r = Math.round(num(v, 5, 0, 5)); return new Array(r + 1).join("★") + "<i>" + new Array(6 - r).join("★") + "</i>"; }
  function bindAttr(a) { return a.bind ? ' data-g-set="' + esc(a.bind) + '"' : ""; }

  // --- melhorias em componentes antigos
  def("theme-toggle theme-switch", { group: "Navegação", desc: "Botão claro/escuro (lembra a escolha)", attrs: "" },
    function () { return '<button class="g-btn g-btn-ghost g-icon-btn" data-g-theme aria-label="Alternar tema"><span class="g-i-moon">' + icon("moon", 18) + '</span><span class="g-i-sun">' + icon("sun", 18) + "</span></button>"; });
  var _btn = C.button.render;
  def("button btn", Object.assign({}, C.button.info, { attrs: "href variant size icon action target" }),
    function (a, h, n, ctx) { var o = _btn(a, h, n, ctx); return a.action ? o.replace("<a ", '<a role="button" data-g-action="' + esc(a.action) + '" ') : o; });

  def("stat", { group: "Cards", desc: "Número de destaque que conta ao aparecer: num, label, prefix, suffix", attrs: "num label prefix suffix" },
    function (a, h) { var v = (a.prefix || "") + (a.num || a.value || "0") + (a.suffix || ""); return '<div class="g-stat"><strong data-g-count="' + esc(v) + '">' + esc(v) + "</strong><span>" + (esc(a.label || "") || h) + "</span></div>"; });

  // --- App: rotas (estilo Next/React Router)
  def("route", { group: "App", desc: 'Página do app (SPA): path="/sobre" title="Sobre" ou src="pages/sobre.gitml"', attrs: "path title src" },
    function (a, h, n, ctx) { ctx.hasRoutes = true; var first = !ctx.routeN; ctx.routeN = (ctx.routeN || 0) + 1; return '<main class="g-route" data-g-route="' + esc(a.path || "/") + '"' + (a.title ? ' data-title="' + esc(a.title) + '"' : "") + (first ? "" : " hidden") + ">" + h + "</main>"; });
  def("notfound 404", { group: "App", desc: "Página 404 (quando nenhuma rota combina)", attrs: "title" },
    function (a, h, n, ctx) { ctx.hasRoutes = true; return '<main class="g-route" data-g-route="*" data-title="' + esc(a.title || "Não encontrado") + '" hidden>' + h + "</main>"; });
  def("param", { group: "App", desc: 'Mostra um parâmetro da rota: <param name="id"> (rota /post/:id)', attrs: "name" },
    function (a) { return '<span data-g-param="' + esc(a.name || "id") + '"></span>'; });
  def("include import", { group: "App", desc: 'Importa outro arquivo .gitml: <include src="partes/menu.gitml">', attrs: "src" }, function () { return ""; });

  // --- Estado (reatividade sem JavaScript)
  def("state", { group: "Estado", desc: 'Variável reativa: <state name="n" value="0" persist>', attrs: "name value persist" },
    function (a) { return '<i hidden data-g-state="' + esc(a.name || "x") + '" data-v="' + esc(a.value || "") + '"' + (a.persist ? " data-persist" : "") + "></i>"; });
  def("bind", { group: "Estado", desc: 'Mostra o valor de um estado (ou use {$nome} em qualquer texto)', attrs: "name" },
    function (a) { return '<span data-g-bind="' + esc(a.name || "x") + '"></span>'; });
  def("show", { group: "Estado", desc: 'Mostra o conteúdo se a condição for verdadeira: when="aberto" | "n > 3" | "!ok"', attrs: "when" },
    function (a, h) { return '<div class="g-show" data-g-show="' + esc(a.when || "false") + '" hidden>' + h + "</div>"; });
  def("trigger", { group: "Estado", desc: 'Torna qualquer bloco clicável: do="toggle:menu" (inc, dec, set, toggle, reset)', attrs: "do" },
    function (a, h) { return '<span class="g-trigger" role="button" tabindex="0" data-g-action="' + esc(a["do"] || "") + '">' + h + "</span>"; });

  // --- Repetição e condição em tempo de compilação (tratadas em renderNode)
  def("each", { group: "Estado", desc: 'Repete o conteúdo: <each items="A,B,C" as="x"> usa {{x}} e {{index}}', attrs: "items as" }, function () { return ""; });
  def("if", { group: "Estado", desc: 'Condição de compilação: <if value="{{x}}" is="pro">', attrs: "value is not" }, function () { return ""; });

  // --- Layout / tipografia
  def("center", { group: "Layout", desc: "Centraliza conteúdo na horizontal", attrs: "" }, function (a, h) { return "<div" + commonAttrs(a, "center") + ">" + h + "</div>"; });
  def("heading", { group: "Tipografia", desc: "Bloco de título: eyebrow, title, subtitle", attrs: "eyebrow title subtitle align" },
    function (a, h) { return '<header class="g-section-head g-heading' + (a.align === "left" ? " g-left" : "") + '">' + (a.eyebrow ? '<span class="g-eyebrow">' + esc(a.eyebrow) + "</span>" : "") + (a.title ? "<h2>" + inline(a.title) + "</h2>" : "") + (a.subtitle ? "<p>" + inline(a.subtitle) + "</p>" : "") + h + "</header>"; });
  def("lead", { group: "Tipografia", desc: "Parágrafo de destaque", attrs: "" }, function (a, h) { return '<p class="g-lead">' + h + "</p>"; });
  def("small", { group: "Tipografia", desc: "Texto pequeno", attrs: "" }, function (a, h) { return '<small class="g-small">' + h + "</small>"; });
  def("typed", { group: "Tipografia", desc: 'Texto que digita sozinho: words="rápido,bonito,moderno"', attrs: "words" },
    function (a) { var w = csv(a.words); return '<span class="g-typed" data-g-typed="' + esc(w.join("|")) + '"><span>' + esc(w[0] || "") + "</span></span>"; });

  // --- Navegação extra
  def("sidebar", { group: "Navegação", desc: "Menu lateral (docs)", attrs: "title" },
    function (a, h) { return '<aside class="g-sidebar">' + (a.title ? "<strong>" + esc(a.title) + "</strong>" : "") + h + "</aside>"; });
  def("docs", { group: "Layout", desc: "Layout de documentação: <sidebar> + <content>", attrs: "" }, function (a, h) { return "<div" + commonAttrs(a, "docs") + ">" + h + "</div>"; });
  def("content", { group: "Layout", desc: "Área principal ao lado da sidebar", attrs: "" }, function (a, h) { return '<div class="g-content">' + h + "</div>"; });
  def("dropdown menu", { group: "Navegação", desc: 'Menu suspenso: <dropdown label="Produtos"> links </dropdown>', attrs: "label" },
    function (a, h) { return '<details class="g-dd"><summary class="g-btn g-btn-outline">' + esc(a.label || "Menu") + icon("chevron-down", 16) + '</summary><div class="g-dd-menu">' + h + "</div></details>"; });
  def("toc", { group: "Navegação", desc: "Sumário automático (h2/h3 da página)", attrs: "title target" },
    function (a) { return '<nav class="g-toc" data-g-toc="' + esc(a.target || "body") + '"><strong>' + esc(a.title || "Nesta página") + "</strong><ul></ul></nav>"; });
  def("pagination", { group: "Navegação", desc: 'Paginação: pages="9" current="2" href="?p="', attrs: "pages current href" },
    function (a) {
      var total = num(a.pages, 5, 1, 999), cur = num(a.current, 1, 1, total), base = a.href || "?page=", out = [], last = 0;
      function item(p, label, off, active) { return off ? '<span class="g-pg g-off">' + label + "</span>" : '<a class="g-pg' + (active ? " g-on" : "") + '" href="' + safeUrl(base + p) + '"' + (active ? ' aria-current="page"' : "") + ">" + label + "</a>"; }
      out.push(item(cur - 1, icon("chevron-left", 16), cur === 1));
      for (var p = 1; p <= total; p++) { if (p === 1 || p === total || Math.abs(p - cur) <= 1) { if (last && p - last > 1) out.push('<span class="g-pg g-off">…</span>'); out.push(item(p, p, false, p === cur)); last = p; } }
      out.push(item(cur + 1, icon("chevron-right", 16), cur === total));
      return '<nav class="g-pagination" aria-label="Paginação">' + out.join("") + "</nav>";
    });
  def("stepper", { group: "Navegação", desc: 'Etapas: steps="Conta,Plano,Pagamento" current="2"', attrs: "steps current" },
    function (a) {
      var cur = num(a.current, 1, 1, 99);
      return '<ol class="g-stepper">' + csv(a.steps).map(function (s, i) { var st = i + 1 < cur ? "done" : i + 1 === cur ? "now" : ""; return '<li class="' + st + '"><b>' + (i + 1 < cur ? icon("check", 14) : i + 1) + "</b><span>" + esc(s) + "</span></li>"; }).join("") + "</ol>";
    });
  def("backtotop", { group: "Navegação", desc: "Botão flutuante 'voltar ao topo'", attrs: "" },
    function () { return '<button class="g-totop" data-g-top aria-label="Voltar ao topo" hidden>' + icon("chevron-up", 20) + "</button>"; });

  // --- Feedback extra
  def("toast", { group: "Feedback", desc: 'Notificação flutuante: <toast trigger="Salvar" type="success">Salvo!</toast>', attrs: "trigger type message" },
    function (a, h, n) { return '<button class="g-btn g-btn-soft" data-g-toast="' + esc(a.message || textOf(n) || "Pronto!") + '" data-type="' + esc(a.type || "info") + '">' + esc(a.trigger || "Mostrar aviso") + "</button>"; });
  def("skeleton", { group: "Feedback", desc: "Carregando (placeholder): lines, type=avatar|card", attrs: "lines type" },
    function (a) { var t = a.type; if (t === "avatar") return '<span class="g-skel g-skel-avatar"></span>'; if (t === "card") return '<div class="g-skel g-skel-card"></div>'; var o = ""; for (var i = 0; i < num(a.lines, 3, 1, 12); i++) o += '<span class="g-skel g-skel-line" style="width:' + (i % 3 === 2 ? 60 : 100) + '%"></span>'; return '<div class="g-skel-wrap">' + o + "</div>"; });
  def("spinner loading", { group: "Feedback", desc: "Indicador de carregamento", attrs: "size" },
    function (a) { return '<span class="g-spinner" style="--s:' + num(a.size, 24, 8, 96) + 'px" role="status" aria-label="Carregando"></span>'; });
  def("empty", { group: "Feedback", desc: "Estado vazio: icon, title", attrs: "icon title" },
    function (a, h) { return '<div class="g-empty"><div class="g-card-icon">' + icon(a.icon || "layers", 24) + "</div><h3>" + esc(a.title || "Nada por aqui") + "</h3>" + (h ? '<p class="g-muted">' + h + "</p>" : "") + "</div>"; });
  def("cookie", { group: "Feedback", desc: "Aviso de cookies (lembra a escolha)", attrs: "button" },
    function (a, h) { return '<div class="g-cookie" data-g-cookie hidden><p>' + (h || "Usamos cookies para melhorar sua experiência.") + '</p><button class="g-btn g-btn-primary g-btn-sm" data-g-cookie-ok>' + esc(a.button || "Aceitar") + "</button></div>"; });
  def("status", { group: "Feedback", desc: "Ponto de status: type=online|busy|offline|warning", attrs: "type" },
    function (a, h) { return '<span class="g-status g-status-' + esc(a.type || "online") + '"><i></i>' + h + "</span>"; });
  def("drawer", { group: "Interativos", desc: 'Painel lateral: trigger, title, side=right|left', attrs: "trigger title side" },
    function (a, h, n, ctx) { var id = "gd" + ctx.uid++; return '<button class="g-btn g-btn-outline" data-g-open="' + id + '">' + esc(a.trigger || "Abrir") + '</button><dialog class="g-modal g-drawer g-drawer-' + esc(a.side || "right") + '" id="' + id + '"><form method="dialog"><button class="g-modal-x" aria-label="Fechar">' + icon("x", 18) + "</button></form>" + (a.title ? "<h3>" + esc(a.title) + "</h3>" : "") + h + "</dialog>"; });
  def("copy", { group: "Interativos", desc: 'Botão que copia um texto: text="npm i gitml"', attrs: "text label" },
    function (a, h) { return '<button class="g-btn g-btn-soft g-btn-sm" data-g-copytext="' + esc(a.text || "") + '">' + icon("copy", 16) + "<span>" + (h || esc(a.label || "Copiar")) + "</span></button>"; });
  def("gallery", { group: "Mídia", desc: "Galeria de imagens com zoom ao clicar", attrs: "cols" },
    function (a, h) { return "<div" + commonAttrs(a, "gallery", "--cols:" + num(a.cols, 3, 1, 6)) + ">" + h + "</div>"; });
  def("audio", { group: "Mídia", desc: "Player de áudio", attrs: "src" }, function (a) { return '<audio class="g-audio" controls src="' + safeUrl(a.src) + '"></audio>'; });
  def("embed iframe", { group: "Mídia", desc: "Incorpora uma página https: src, height", attrs: "src height title" },
    function (a) { return /^https?:\/\//i.test(a.src || "") ? '<div class="g-embed" style="aspect-ratio:auto;height:' + num(a.height, 420, 80, 1200) + 'px"><iframe loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" title="' + esc(a.title || "Conteúdo incorporado") + '" src="' + safeUrl(a.src) + '"></iframe></div>' : ""; });
  def("figure", { group: "Mídia", desc: "Imagem com legenda: src, caption", attrs: "src caption alt" },
    function (a, h) { return '<figure class="g-figure">' + (a.src ? '<img class="g-image" src="' + safeUrl(a.src) + '" alt="' + esc(a.alt || a.caption || "") + '" loading="lazy">' : h) + (a.caption ? "<figcaption>" + esc(a.caption) + "</figcaption>" : "") + "</figure>"; });
  def("social", { group: "Mídia", desc: "Ícones de redes: github, twitter, linkedin, instagram, youtube, facebook, mail, site", attrs: "github twitter linkedin instagram youtube facebook mail site" },
    function (a) {
      var map = { github: "github", twitter: "twitter", linkedin: "linkedin", instagram: "instagram", youtube: "youtube", facebook: "facebook", mail: "mail", site: "globe" };
      return '<div class="g-social">' + Object.keys(map).filter(function (k) { return a[k]; }).map(function (k) { var u = a[k]; if (k === "mail" && u.indexOf("@") > 0 && !/^mailto:/i.test(u)) u = "mailto:" + u; return '<a class="g-social-a" href="' + safeUrl(u) + '" aria-label="' + k + '" rel="noopener">' + icon(map[k], 20) + "</a>"; }).join("") + "</div>";
    });

  // --- Cards extra
  def("product", { group: "Cards", desc: "Produto: name, price, old, image, badge, rating, href, cta", attrs: "name price old image badge rating href cta" },
    function (a, h) { return '<article class="g-card g-product">' + (a.badge ? '<span class="g-badge g-product-badge">' + esc(a.badge) + "</span>" : "") + (a.image ? '<img class="g-card-img" src="' + safeUrl(a.image) + '" alt="' + esc(a.name || "") + '" loading="lazy">' : "") + "<h3>" + esc(a.name || "Produto") + "</h3>" + (a.rating ? '<span class="g-stars">' + starsHtml(a.rating) + "</span>" : "") + (h ? '<p class="g-muted">' + h + "</p>" : "") + '<div class="g-price-row"><strong>' + esc(a.price || "") + "</strong>" + (a.old ? "<s>" + esc(a.old) + "</s>" : "") + '</div><a class="g-btn g-btn-primary g-btn-sm" href="' + safeUrl(a.href) + '">' + icon("cart", 16) + esc(a.cta || "Comprar") + "</a></article>"; });
  def("post blog-card", { group: "Cards", desc: "Card de artigo: title, date, author, tag, image, href", attrs: "title date author tag image href" },
    function (a, h) { return '<a class="g-card g-post" href="' + safeUrl(a.href) + '">' + (a.image ? '<img class="g-card-img" src="' + safeUrl(a.image) + '" alt="" loading="lazy">' : "") + '<div class="g-post-meta">' + (a.tag ? '<span class="g-badge">' + esc(a.tag) + "</span>" : "") + (a.date ? "<span>" + esc(a.date) + "</span>" : "") + "</div><h3>" + esc(a.title || "Artigo") + "</h3>" + (h ? '<p class="g-muted">' + h + "</p>" : "") + (a.author ? '<div class="g-post-by">' + avatarHtml(a.author, "", 28) + "<span>" + esc(a.author) + "</span></div>" : "") + "</a>"; });
  def("metric kpi", { group: "Dados", desc: 'Indicador: label, value, delta="+12%"', attrs: "label value delta icon" },
    function (a) { var d = a.delta || "", up = !/^\s*-/.test(d); return '<div class="g-card g-metric"><div class="g-metric-top"><span class="g-muted">' + esc(a.label || "") + "</span>" + (a.icon ? '<span class="g-metric-ic">' + icon(a.icon, 18) + "</span>" : "") + "</div><strong>" + esc(a.value || "0") + "</strong>" + (d ? '<span class="g-delta g-delta-' + (up ? "up" : "down") + '">' + icon("trending", 14) + esc(d) + "</span>" : "") + "</div>"; });

  // --- Gráficos em SVG (sem biblioteca)
  function chartSvg(a, ctx) {
    var type = a.type || "bar", W = 560, H = num(a.height, 260, 120, 600), id = "gc" + ctx.uid++;
    var pts = csv(a.data).map(function (s) { var i = s.lastIndexOf(":"); return { l: i < 0 ? s : s.slice(0, i), v: i < 0 ? 0 : parseFloat(s.slice(i + 1)) || 0 }; });
    if (!pts.length) return "";
    var n = pts.length, max = Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([1])), g = "";
    if (type === "donut" || type === "pie") {
      var total = pts.reduce(function (s, p) { return s + p.v; }, 0) || 1, r = 70, c = 2 * Math.PI * r, off = 0, leg = "";
      pts.forEach(function (p, i) { var len = p.v / total * c; g += '<circle cx="110" cy="' + H / 2 + '" r="' + r + '" fill="none" stroke="var(--g-c' + (i % 6 + 1) + ')" stroke-width="' + (type === "pie" ? 140 : 34) + '" stroke-dasharray="' + len.toFixed(2) + " " + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 110 ' + H / 2 + ')"/>'; off += len; leg += '<g transform="translate(250 ' + (H / 2 - n * 14 + i * 28 + 10) + ')"><rect width="12" height="12" rx="3" fill="var(--g-c' + (i % 6 + 1) + ')"/><text x="22" y="10" font-size="13" fill="var(--g-ink)">' + esc(p.l) + ' <tspan fill="var(--g-muted)">' + Math.round(p.v / total * 100) + "%</tspan></text></g>"; });
      return '<svg class="g-chart-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(a.title || "Gráfico") + '">' + g + leg + "</svg>";
    }
    var L = 40, R = 12, T = 14, B = 30, iw = W - L - R, ih = H - T - B;
    function Y(v) { return T + ih - v / max * ih; }
    for (var k = 0; k <= 4; k++) { var gy = T + ih * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--g-line)"/><text x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="var(--g-muted)">' + Math.round(max * (1 - k / 4)) + "</text>"; }
    if (type === "bar") {
      var slot = iw / n, bw = Math.min(46, slot * .6);
      pts.forEach(function (p, i) { var x = L + slot * i + (slot - bw) / 2, y = Y(p.v); g += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (T + ih - y).toFixed(1) + '" rx="6" fill="url(#' + id + ')"/><text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="var(--g-muted)">' + esc(p.l) + "</text>"; });
    } else {
      var X = function (i) { return L + (n === 1 ? iw / 2 : i * iw / (n - 1)); }, line = pts.map(function (p, i) { return X(i).toFixed(1) + "," + Y(p.v).toFixed(1); }).join(" ");
      if (type === "area") g += '<polygon points="' + X(0).toFixed(1) + "," + (T + ih) + " " + line + " " + X(n - 1).toFixed(1) + "," + (T + ih) + '" fill="url(#' + id + ')" opacity=".35"/>';
      g += '<polyline points="' + line + '" fill="none" stroke="var(--g-primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      pts.forEach(function (p, i) { g += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="4" fill="var(--g-surface)" stroke="var(--g-primary)" stroke-width="2.5"/><text x="' + X(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="var(--g-muted)">' + esc(p.l) + "</text>"; });
    }
    return '<svg class="g-chart-svg" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(a.title || "Gráfico") + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--g-primary)"/><stop offset="1" stop-color="var(--g-primary)" stop-opacity=".35"/></linearGradient></defs>' + g + "</svg>";
  }
  def("dataset", { group: "Dados", desc: 'Série de dados dentro de <chart>: label, values="5,10,15", color', attrs: "label values color" }, function () { return ""; });
  def("chart", { group: "Dados", desc: 'Gráfico SVG: type=bar|line|area|donut|pie data="Jan:10,Fev:30" ou <dataset values="5,10,15">', attrs: "type data labels title height" },
    function (a, h, n, ctx) {
      var ds = (n.children || []).filter(function (c) { return typeof c !== "string" && c.tag === "dataset"; });
      if (ds.length) {
        var vals = csv(ds[0].attrs.values), labs = csv(a.labels);
        a = Object.assign({}, a, { data: vals.map(function (v, i) { return (labs[i] || (i + 1)) + ":" + (parseFloat(v) || 0); }).join(",") });
        if (ds.length > 1) ctx.warnings.push({ line: ds[1].line, message: "<chart> desenha só o primeiro <dataset> por enquanto" });
      }
      return "<figure" + commonAttrs(a, "chart") + ">" + (a.title ? "<figcaption>" + esc(a.title) + "</figcaption>" : "") + chartSvg(a, ctx) + "</figure>"; });
  def("sparkline", { group: "Dados", desc: 'Mini gráfico de linha: values="1,4,2,8"', attrs: "values" },
    function (a) {
      var v = csv(a.values).map(Number).filter(isFinite); if (v.length < 2) return "";
      var mx = Math.max.apply(null, v), mn = Math.min.apply(null, v), rg = mx - mn || 1;
      return '<svg class="g-spark" viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="var(--g-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="' + v.map(function (y, i) { return (i * 120 / (v.length - 1)).toFixed(1) + "," + (32 - (y - mn) / rg * 28).toFixed(1); }).join(" ") + '"/></svg>';
    });

  // --- Formulários extra
  def("checkbox", { group: "Formulários", desc: "Caixa de seleção: label, name, checked, bind", attrs: "label name checked required bind" },
    function (a) { return '<label class="g-check"><input type="checkbox" name="' + esc(a.name || "") + '"' + (truthy(a.checked) ? " checked" : "") + (a.required ? " required" : "") + bindAttr(a) + '><span class="g-check-box"></span><span>' + esc(a.label || "") + "</span></label>"; });
  def("switch toggle", { group: "Formulários", desc: "Interruptor liga/desliga: label, name, checked, bind", attrs: "label name checked bind" },
    function (a) { return '<label class="g-check g-switch"><input type="checkbox" role="switch" name="' + esc(a.name || "") + '"' + (truthy(a.checked) ? " checked" : "") + bindAttr(a) + '><span class="g-switch-track"></span><span>' + esc(a.label || "") + "</span></label>"; });
  def("radio", { group: "Formulários", desc: 'Grupo de opções: label, name, options="A,B,C", value', attrs: "label name options value" },
    function (a) { var nm = esc(a.name || "r"); return '<fieldset class="g-radio-group">' + (a.label ? "<legend>" + esc(a.label) + "</legend>" : "") + csv(a.options).map(function (o, i) { return '<label class="g-check"><input type="radio" name="' + nm + '" value="' + esc(o) + '"' + ((a.value ? a.value === o : i === 0) ? " checked" : "") + '><span class="g-check-box g-radio"></span><span>' + esc(o) + "</span></label>"; }).join("") + "</fieldset>"; });
  def("range slider-input", { group: "Formulários", desc: "Controle deslizante: label, min, max, value, step, bind", attrs: "label name min max value step bind" },
    function (a) { return '<label class="g-field"><span class="g-range-l"><span>' + esc(a.label || "") + "</span>" + (a.bind ? '<output data-g-bind="' + esc(a.bind) + '"></output>' : "") + '</span><input type="range" class="g-range" name="' + esc(a.name || "") + '" min="' + num(a.min, 0, -1e9, 1e9) + '" max="' + num(a.max, 100, -1e9, 1e9) + '" value="' + num(a.value, 50, -1e9, 1e9) + '" step="' + num(a.step, 1, 0.001, 1e9) + '"' + bindAttr(a) + "></label>"; });
  def("search", { group: "Formulários", desc: 'Busca; com target=".g-card" filtra os elementos ao digitar', attrs: "placeholder target" },
    function (a) { return '<label class="g-search">' + icon("search", 18) + '<input type="search" placeholder="' + esc(a.placeholder || "Buscar…") + '"' + (a.target ? ' data-g-filter="' + esc(a.target) + '"' : "") + "></label>"; });
  def("upload file", { group: "Formulários", desc: "Área de envio de arquivos: label, hint, accept, name, multiple", attrs: "label hint accept name multiple" },
    function (a) { return '<label class="g-upload">' + icon("upload", 26) + "<strong>" + esc(a.label || "Escolher arquivo") + '</strong><small data-g-file>' + esc(a.hint || "ou arraste aqui") + '</small><input type="file" name="' + esc(a.name || "") + '" accept="' + esc(a.accept || "") + '"' + (a.multiple ? " multiple" : "") + "></label>"; });
  def("login", { group: "Formulários", desc: "Formulário de login pronto: title, action, button", attrs: "title action button" },
    function (a) { return '<form class="g-form g-card g-authform" action="' + safeUrl(a.action || "#") + '" method="post"><h3>' + esc(a.title || "Entrar") + '</h3><label class="g-field"><span>E-mail</span><input type="email" name="email" placeholder="voce@email.com" required></label><label class="g-field"><span>Senha</span><input type="password" name="senha" placeholder="••••••••" required></label><button type="submit" class="g-btn g-btn-primary">' + esc(a.button || "Entrar") + "</button></form>"; });
  def("contact", { group: "Formulários", desc: "Formulário de contato pronto: title, action, button", attrs: "title action button" },
    function (a) { return '<form class="g-form g-card g-authform" action="' + safeUrl(a.action || "#") + '" method="post"><h3>' + esc(a.title || "Fale com a gente") + '</h3><label class="g-field"><span>Nome</span><input name="nome" placeholder="Seu nome" required></label><label class="g-field"><span>E-mail</span><input type="email" name="email" placeholder="voce@email.com" required></label><label class="g-field"><span>Mensagem</span><textarea name="mensagem" rows="4" placeholder="Escreva aqui…"></textarea></label><button type="submit" class="g-btn g-btn-primary">' + esc(a.button || "Enviar") + "</button></form>"; });

  // --- HTML puro: o GITML aceita as tags HTML comuns (com atributos seguros)
  var PASS = "div span a b i u s em strong sub sup main article aside header time address pre abbr cite del ins q label fieldset legend details summary figcaption dl dt dd h5 h6 thead tbody tfoot caption colgroup picture source hgroup output br wbr".split(" ");
  PASS.forEach(function (t) {
    if (C[t]) return;
    def(t, { group: "HTML", desc: "Elemento HTML <" + t + "> (atributos seguros: class, id, style, href, data-*…)", attrs: "class id style" },
      function (a, h, n) {
        var o = "<" + n.tag;
        for (var k in a) {
          if (/^on/.test(k) || !/^[\w:-]+$/.test(k)) continue;
          var v = (k === "href" || k === "src" || k === "action" || k === "poster") ? safeUrl(a[k]) : esc(a[k]);
          o += " " + k + (a[k] === "true" && !/^(href|src|class|id|style|title|alt|name|value|for)$/.test(k) ? "" : '="' + v + '"');
        }
        if (n.tag === "a" && a.target === "_blank") o += ' rel="noopener noreferrer"';
        return (n.tag === "br" || n.tag === "wbr") ? o + ">" : o + ">" + h + "</" + n.tag + ">";
      });
  });

  // --- Extensibilidade
  def("style", { group: "Avançado", desc: "CSS próprio (bruto)", attrs: "" }, function (a, h, n) { return "<style>" + String(n.children[0] || "").replace(/<\/style/gi, "") + "</style>"; });
  def("script", { group: "Avançado", desc: "JavaScript próprio (apenas se allowScripts)", attrs: "" }, function (a, h, n, ctx) { return ctx.allowScripts ? "<script>" + String(n.children[0] || "") + "</script>" : ""; });
  def("define component", { group: "Avançado", desc: "Cria seu componente: <define name=\"x\"> usa {{attr}} e {{children}}", attrs: "name" }, function () { return ""; });
  def("raw", { group: "Avançado", desc: "HTML puro dentro do GITML", attrs: "" }, function (a, h, n) { return n.children.map(function (c) { return typeof c === "string" ? c : rebuild(c); }).join(""); });

  var VOIDH = toSet("img br hr input meta link source wbr".split(" "));
  function rebuild(n) {
    if (n.tag === "script" && !CUR.allowScripts) return "";
    var at = Object.keys(n.attrs).filter(function (k) { return !/^on/i.test(k) && /^[\w:-]+$/.test(k); }).map(function (k) { var v = /^(href|src|action|poster|formaction)$/.test(k) ? safeUrl(n.attrs[k]) : esc(n.attrs[k]); return " " + k + '="' + v + '"'; }).join("");
    if (VOIDH[n.tag]) return "<" + n.tag + at + ">";
    return "<" + n.tag + at + ">" + n.children.map(function (c) { return typeof c === "string" ? c : rebuild(c); }).join("") + "</" + n.tag + ">";
  }

  /* ------------------------------------------------------------------ *
   * 4. RENDERIZAÇÃO
   * ------------------------------------------------------------------ */
  function renderNodes(nodes, ctx, parent) {
    var out = "";
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (typeof nd === "string") { out += inline(nd.replace(/\{\{\s*([\w-]+)\s*\}\}/g, function (m, k) { return ctx.vars[k] != null ? ctx.vars[k] : m; })); continue; }
      out += renderNode(nd, ctx, parent);
    }
    return out;
  }
  function renderNode(nd, ctx, parent) {
    if (nd.tag === "head" && nd.children.length) return ""; // <head> completo é lido em collect()
    // componentes definidos pelo usuário
    if (ctx.custom[nd.tag]) {
      var tpl = ctx.custom[nd.tag], inner = renderNodes(nd.children, ctx, nd);
      var vars = Object.assign({}, ctx.vars, nd.attrs, { children: inner });
      var saved = ctx.vars; ctx.vars = vars;
      var parsed = parse(tpl.replace(/\{\{\s*children\s*\}\}/g, "\u0000CH\u0000")).children;
      var html = renderNodes(parsed, ctx, nd).replace(/\u0000CH\u0000/g, inner);
      ctx.vars = saved; return html;
    }
    function sv(s) { return String(s == null ? "" : s).replace(/\{\{\s*([\w-]+)\s*\}\}/g, function (m, key) { return ctx.vars[key] != null ? ctx.vars[key] : ""; }); }
    if (nd.tag === "each") {
      var items = csv(sv(nd.attrs.items)), nm = nd.attrs.as || "item", o = "", saved0 = ctx.vars;
      items.forEach(function (it, i) { var v = {}; v[nm] = it; v.index = i + 1; ctx.vars = Object.assign({}, saved0, v); o += renderNodes(nd.children, ctx, nd); });
      ctx.vars = saved0; return o;
    }
    if (nd.tag === "if") {
      var val = sv(nd.attrs.value), ok = nd.attrs.is != null ? val === sv(nd.attrs.is) : truthy(val);
      if (nd.attrs.not != null) ok = !ok;
      return ok ? renderNodes(nd.children, ctx, nd) : "";
    }
    var comp = C[nd.tag];
    var a = {};
    for (var k in nd.attrs) a[k] = String(nd.attrs[k]).replace(/\{\{\s*([\w-]+)\s*\}\}/g, function (m, key) { return ctx.vars[key] != null ? ctx.vars[key] : ""; });
    var prevIcon = ctx.parentIcon;
    if (nd.tag === "ul" || nd.tag === "list") ctx.parentIcon = a.icon || null;
    if (nd.tag === "tabs") ctx.tabIndex = 0;
    var h = RAW[nd.tag] ? "" : renderNodes(nd.children, ctx, nd);
    ctx.parentIcon = (nd.tag === "ul" || nd.tag === "list") ? prevIcon : ctx.parentIcon;
    if (!comp) {
      ctx.warnings.push({ line: nd.line, message: "Tag desconhecida <" + nd.tag + ">" + didYouMean(nd.tag, ctx) + " — renderizada como bloco" });
      return '<div class="g-unknown" data-tag="' + esc(nd.tag) + '">' + h + "</div>";
    }
    try { return comp.render(a, h, nd, ctx); }
    catch (err) {
      // um componente com valor inesperado NUNCA derruba a página inteira
      ctx.warnings.push({ line: nd.line, message: "Erro ao renderizar <" + nd.tag + ">: " + (err && err.message || err) + " — verifique os atributos" });
      return '<div class="g-unknown" data-tag="' + esc(nd.tag) + '" title="Erro neste componente">' + h + "</div>";
    }
  }
  function lev(a, b) { var m = [], i, j; for (i = 0; i <= a.length; i++) m[i] = [i]; for (j = 0; j <= b.length; j++) m[0][j] = j; for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
  function didYouMean(tag, ctx) {
    var best = null, bd = 99, all = Object.keys(C).concat(Object.keys(ctx.custom));
    all.forEach(function (k) { var d = lev(tag, k); if (d < bd) { bd = d; best = k; } });
    return best && bd <= Math.max(1, Math.floor(tag.length / 3)) ? " — você quis dizer <" + best + ">?" : "";
  }
  var LINK_ATTRS = toSet("rel href as crossorigin type media sizes hreflang integrity title".split(" "));
  function headLink(a) {
    return "<link" + Object.keys(a).filter(function (k) { return LINK_ATTRS[k]; }).map(function (k) { return " " + k + '="' + (k === "href" ? safeUrl(a[k]) : esc(a[k])) + '"'; }).join("") + ">";
  }
  function collectHead(h, ctx) {
    h.children.forEach(function (c) {
      if (typeof c === "string") return;
      var a = c.attrs, t = c.tag;
      if (t === "title") { ctx.page.title = textOf(c); }
      else if (t === "meta") {
        if (a.charset) return;
        var k = a.name || a.property || a["http-equiv"];
        if (!k) { Object.assign(ctx.page, a); return; }
        var low = String(k).toLowerCase();
        if (low === "viewport") return;
        if (low === "description" || low === "theme-color") ctx.page[low] = a.content || "";
        else ctx.headExtra.push("<meta " + (a.name ? "name" : a.property ? "property" : "http-equiv") + '="' + esc(k) + '" content="' + esc(a.content || "") + '">');
      }
      else if (t === "link") ctx.headExtra.push(headLink(a));
      else if (t === "base" && a.href) ctx.headExtra.push('<base href="' + safeUrl(a.href) + '">');
      else if (t === "style") ctx.headStyles.push(String(c.children[0] || "").replace(/<\/style/gi, ""));
      else if (t === "script") { var sc = rebuild(c); if (sc) ctx.headExtra.push(sc); }
    });
  }
  function collect(nodes, ctx, inHeadCtx) {
    nodes.forEach(function (n) {
      if (typeof n === "string") return;
      if (n.tag === "gitml" || n.tag === "page" || n.tag === "html") Object.assign(ctx.page, n.attrs);
      if (n.tag === "body") ctx.bodyAttrs = n.attrs;
      if (n.tag === "head") { Object.assign(ctx.page, n.attrs); if (n.children.length) collectHead(n, ctx); }
      else if (n.tag === "meta" && !inHeadCtx) Object.assign(ctx.page, n.attrs);
      if ((n.tag === "define" || n.tag === "component") && n.attrs.name) ctx.custom[n.attrs.name.toLowerCase()] = n.__src || "";
      collect(n.children, ctx, inHeadCtx || n.tag === "head");
    });
  }
  function extractDefines(src) {
    var defs = {}, re = /<(define|component)\s+name\s*=\s*["']([\w-]+)["'][^>]*>([\s\S]*?)<\/\1>/gi, m;
    while ((m = re.exec(src))) defs[m[2].toLowerCase()] = m[3];
    return { defs: defs, src: src.replace(re, "") };
  }

  var FONTS = {
    inter: ["Inter", "Inter:wght@400;500;600;700;800"],
    "space-grotesk": ["Space Grotesk", "Space+Grotesk:wght@400;500;600;700"],
    sora: ["Sora", "Sora:wght@400;500;600;700;800"],
    manrope: ["Manrope", "Manrope:wght@400;500;600;700;800"],
    outfit: ["Outfit", "Outfit:wght@400;500;600;700;800"],
    "dm-sans": ["DM Sans", "DM+Sans:wght@400;500;700"],
    serif: ["Instrument Serif", "Instrument+Serif"]
  };
  var ACCENTS = { violet: "#7c5cff", blue: "#2f6bff", green: "#12b981", orange: "#ff7a1a", pink: "#ec4899", red: "#ef4444", teal: "#14b8a6", black: "#111111" };

  var FONTS_EXTRA = {
    poppins: ["Poppins", "Poppins:wght@400;500;600;700;800"],
    jakarta: ["Plus Jakarta Sans", "Plus+Jakarta+Sans:wght@400;500;600;700;800"],
    geist: ["Geist", "Geist:wght@400;500;600;700;800"],
    mono: ["JetBrains Mono", "JetBrains+Mono:wght@400;500;700"]
  };
  function pickFont(name) {
    if (!name) return FONTS["space-grotesk"];
    if (FONTS[name]) return FONTS[name];
    if (FONTS_EXTRA[name]) return FONTS_EXTRA[name];
    if (/^[A-Za-z][A-Za-z0-9 ]{1,40}$/.test(name)) return [name, name.replace(/ /g, "+") + ":wght@400;500;600;700;800"];
    return FONTS["space-grotesk"];
  }
  function emojiIcon(i) { return "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>" + i + "</text></svg>"); }

  function compile(source, opts) {
    opts = opts || {};
    CUR = { allowScripts: !!opts.allowScripts };
    var src = String(source || "").replace(/^\uFEFF?\s*<!doctype[^>]*>/i, "").replace(/<route\b([^>]*?)\bsrc\s*=\s*(["'])([^"']+)\2([^>]*?)\/>/gi, routeSrc);
    src = opts.resolve ? resolveIncludes(src, opts.resolve, opts.file || "", 0) : src.replace(INC_RE, "");
    var ex = extractDefines(src);
    var parsed = parse(ex.src);
    var ctx = { page: {}, custom: ex.defs, vars: {}, warnings: [], uid: 1, tabIndex: 0, parentIcon: null, allowScripts: !!opts.allowScripts, hasRoutes: false, headExtra: [], headStyles: [], bodyAttrs: {} };
    collect(parsed.children, ctx);
    var body = renderNodes(parsed.children, ctx, null);
    var p = ctx.page;
    var bodyAttrStr = Object.keys(ctx.bodyAttrs || {}).filter(function (k) { return /^(class|id|style|dir|data-[\w-]+|aria-[\w-]+)$/.test(k); }).map(function (k) { return " " + k + '="' + esc(ctx.bodyAttrs[k]) + '"'; }).join("");
    var accent = ACCENTS[p.accent] || (p.accent && /^#|^rgb|^hsl|^oklch/.test(p.accent) ? p.accent : ACCENTS.violet);
    var font = pickFont(p.font);
    var theme = p.theme === "light" ? "light" : "dark";
    var auto = p.theme === "auto";
    var title = p.title || "Página GITML";
    var img = p["og-image"] || p.image;
    var icon0 = p.icon ? (/^[a-z]+:|^[\/.#]|\.\w{2,4}($|\?)/i.test(p.icon) ? safeUrl(p.icon) : emojiIcon(esc(p.icon))) : "";
    var vars = ":root{--g-primary:" + esc(accent) + ";--g-font:'" + font[0] + "',ui-sans-serif,system-ui,sans-serif" + (p.radius ? ";--g-radius:" + num(p.radius, 18, 0, 64) + "px" : "") + (p.container ? ";--g-max:" + num(p.container, 1180, 480, 2400) + "px" : "") + "}";
    var head = '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="generator" content="GITML ' + VERSION + '">\n<title>' + esc(title) + "</title>\n" +
      '<meta name="theme-color" content="' + esc(p["theme-color"] || accent) + '">\n' +
      (p.description ? '<meta name="description" content="' + esc(p.description) + '">\n' : "") +
      '<meta property="og:title" content="' + esc(title) + '">\n' + (p.description ? '<meta property="og:description" content="' + esc(p.description) + '">\n' : "") +
      (img ? '<meta property="og:image" content="' + safeUrl(img) + '">\n<meta name="twitter:card" content="summary_large_image">\n' : "") +
      (p.canonical ? '<link rel="canonical" href="' + safeUrl(p.canonical) + '">\n' : "") +
      (icon0 ? '<link rel="icon" href="' + icon0 + '">\n' : "") +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=' + font[1] + '&family=JetBrains+Mono:wght@400;600&display=swap">\n' +
      "<script>(function(){try{var h=document.documentElement,t=localStorage.getItem('g-theme');if(!t&&h.hasAttribute('data-auto'))t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';if(t)h.setAttribute('data-theme',t)}catch(e){}})()<\/script>\n" +
      "<style>" + vars + CSS + NEWCSS + (p.motion === "off" ? "*{animation:none!important;transition:none!important}.g-anim{opacity:1;transform:none}" : "") + "</style>" + (ctx.headStyles.length ? "\n<style>" + ctx.headStyles.join("\n") + "</style>" : "") + (ctx.headExtra.length ? "\n" + ctx.headExtra.join("\n") : "");
    var html = "<!doctype html>\n<html lang=\"" + esc(p.lang || "pt-BR") + "\" data-theme=\"" + (auto ? "dark" : theme) + "\"" + (auto ? " data-auto" : "") + ">\n<head>\n" + head + "\n</head>\n<body" + bodyAttrStr + ">\n" + body + "\n<script>" + RUNTIME + RUNTIME2 + "<\/script>\n</body>\n</html>";
    return { html: html, body: body, errors: parsed.errors, warnings: ctx.warnings, page: p, routes: ctx.hasRoutes };
  }

  /* ------------------------------------------------------------------ *
   * 5. CSS DO DESIGN SYSTEM
   * ------------------------------------------------------------------ */
  var CSS = [
    ":root{--g-accent:#19c6b3;--g-gradient:linear-gradient(110deg,var(--g-primary),var(--g-accent));--g-bg:#fbfbfd;--g-surface:#fff;--g-soft:#eef1fb;--g-ink:#0d1120;--g-muted:#5d6577;--g-line:#e8eaf0;--g-radius:18px;--g-shadow:0 1px 2px rgba(16,24,40,.04),0 12px 32px -12px rgba(16,24,40,.12)}",
    "[data-theme=dark]{--g-bg:#07080d;--g-surface:#10121a;--g-soft:#141722;--g-ink:#f2f4f8;--g-muted:#9aa3b5;--g-line:#1f2330;--g-shadow:0 1px 2px rgba(0,0,0,.4),0 16px 40px -16px rgba(0,0,0,.6)}",
    "@supports (color:color-mix(in oklab,red,blue)){:root{--g-accent:color-mix(in oklab,var(--g-primary),#19c6b3 55%);--g-soft:color-mix(in oklab,var(--g-primary) 7%,#fff)}[data-theme=dark]{--g-soft:color-mix(in oklab,var(--g-primary) 14%,#07080d)}}",
    "*,*::before,*::after{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--g-bg);color:var(--g-ink);font-family:var(--g-font);line-height:1.6;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}",
    "a{color:inherit}img{max-width:100%;display:block}h1,h2,h3,h4{line-height:1.1;letter-spacing:-.03em;margin:0 0 .5em}h2{font-size:clamp(28px,4vw,44px)}h3{font-size:19px;letter-spacing:-.01em}p{margin:0 0 1em}",
    ".g-wrap{max-width:1180px;margin:0 auto;padding:0 24px;width:100%}.g-section{padding:clamp(56px,9vw,112px) 0}.g-section-head{text-align:center;max-width:720px;margin:0 auto 48px}.g-section-head p{color:var(--g-muted);font-size:18px}",
    ".g-eyebrow{display:inline-block;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--g-primary);margin-bottom:12px}.g-muted{color:var(--g-muted)}.g-lead{font-size:clamp(17px,2vw,20px);color:var(--g-muted);max-width:640px}",
    ".g-align-center{text-align:center;margin-left:auto;margin-right:auto;justify-content:center}.g-align-right{text-align:right;justify-content:flex-end}",
    ".g-grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:20px}.g-row{display:flex;gap:20px;flex-wrap:wrap;align-items:center}.g-row[data-justify=between]{justify-content:space-between}.g-row[data-justify=center]{justify-content:center}.g-stack{display:flex;flex-direction:column;gap:16px}",
    ".g-split{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}.g-reverse>:first-child{order:2}",
    ".g-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(180px,auto);gap:16px}.g-bento>:nth-child(1){grid-column:span 2;grid-row:span 2}.g-bento>:nth-child(4){grid-column:span 2}",
    ".g-divider{border:0;border-top:1px solid var(--g-line);margin:32px 0}.g-divider-t{display:flex;align-items:center;gap:16px;color:var(--g-muted);font-size:14px;margin:32px 0}.g-divider-t::before,.g-divider-t::after{content:'';flex:1;border-top:1px solid var(--g-line)}",
    /* nav */
    ".g-nav{position:relative;z-index:50;border-bottom:1px solid transparent;transition:.3s}.g-sticky{position:sticky;top:0;backdrop-filter:saturate(180%) blur(14px);background:color-mix(in oklab,var(--g-bg) 75%,transparent)}.g-nav.g-scrolled{border-color:var(--g-line)}",
    ".g-nav-in{display:flex;align-items:center;justify-content:space-between;height:68px}.g-brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;letter-spacing:-.03em;text-decoration:none}.g-brand img{height:28px}",
    ".g-nav-links{display:flex;align-items:center;gap:6px}.g-nav-links .g-link{padding:8px 14px;border-radius:10px;text-decoration:none;color:var(--g-muted);font-weight:500;font-size:15px;transition:.2s}.g-nav-links .g-link:hover{color:var(--g-ink);background:var(--g-soft)}.g-burger{display:none;background:none;border:0;color:inherit;cursor:pointer}",
    ".g-crumb{display:flex;gap:8px;font-size:14px;color:var(--g-muted)}.g-crumb span:last-child{color:var(--g-ink);font-weight:600}.g-crumb i{opacity:.4;font-style:normal}",
    ".g-footer{border-top:1px solid var(--g-line);padding:48px 0;margin-top:48px;color:var(--g-muted);font-size:14px}.g-footer .g-wrap{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center}.g-footer-in{display:flex;gap:20px;flex-wrap:wrap;align-items:center}.g-footer .g-link{text-decoration:none}.g-footer .g-link:hover{color:var(--g-ink)}",
    /* hero */
    ".g-hero{position:relative;overflow:hidden;padding:clamp(72px,12vw,150px) 0 clamp(64px,10vw,120px)}.g-hero-glow{position:absolute;inset:-30% -10% auto;height:640px;background:radial-gradient(closest-side,color-mix(in oklab,var(--g-primary) 30%,transparent),transparent),radial-gradient(closest-side at 70% 40%,color-mix(in oklab,var(--g-accent) 22%,transparent),transparent);filter:blur(40px);opacity:.8;pointer-events:none;animation:g-float 12s ease-in-out infinite alternate}",
    ".g-hero::after{content:'';position:absolute;inset:0;background-image:linear-gradient(var(--g-line) 1px,transparent 1px),linear-gradient(90deg,var(--g-line) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse at top,#000 20%,transparent 70%);opacity:.5;pointer-events:none}",
    ".g-hero-in{position:relative;z-index:1}.g-hero-center .g-hero-body{text-align:center;max-width:880px;margin:0 auto;display:flex;flex-direction:column;align-items:center}.g-hero-center .g-hero-media{margin-top:64px}",
    ".g-hero-split .g-hero-in{display:grid;grid-template-columns:1.1fr 1fr;gap:56px;align-items:center}",
    ".g-hero h1{font-size:clamp(42px,7.4vw,84px);font-weight:800;letter-spacing:-.05em;line-height:1.02;margin:20px 0}.g-hero-media img{border-radius:24px;border:1px solid var(--g-line);box-shadow:0 40px 80px -30px color-mix(in oklab,var(--g-primary) 45%,transparent)}",
    ".g-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:600;background:var(--g-surface);border:1px solid var(--g-line);box-shadow:var(--g-shadow);color:var(--g-ink)}.g-pill svg{color:var(--g-primary)}",
    ".g-grad{background:var(--g-gradient);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:200% auto;animation:g-shine 6s linear infinite}",
    /* botões */
    ".g-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}.g-hero-center .g-actions{justify-content:center}",
    ".g-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 20px;border-radius:12px;font:600 15px/1 var(--g-font);text-decoration:none;border:1px solid transparent;cursor:pointer;transition:transform .2s,box-shadow .2s,background .2s;white-space:nowrap}.g-btn:hover{transform:translateY(-2px)}.g-btn:active{transform:translateY(0)}",
    ".g-btn-primary{background:var(--g-primary);color:#fff;box-shadow:0 8px 24px -8px var(--g-primary),inset 0 1px 0 rgba(255,255,255,.2)}.g-btn-primary:hover{box-shadow:0 14px 32px -10px var(--g-primary)}",
    ".g-btn-outline,.g-btn-secondary{background:var(--g-surface);border-color:var(--g-line);color:var(--g-ink)}.g-btn-ghost{background:transparent;color:var(--g-ink)}.g-btn-ghost:hover{background:var(--g-soft)}.g-btn-soft{background:var(--g-soft);color:var(--g-primary)}.g-btn-gradient{background:var(--g-gradient);color:#fff}.g-btn-light{background:#fff;color:#0d1120}",
    ".g-btn-sm{padding:8px 14px;font-size:13px}.g-btn-lg{padding:15px 26px;font-size:16px;border-radius:14px}.g-icon-btn{padding:9px}",
    /* cards */
    ".g-card,.g-feature,.g-pricing,.g-testimonial,.g-stat,.g-member{background:var(--g-surface);border:1px solid var(--g-line);border-radius:var(--g-radius);padding:28px;box-shadow:var(--g-shadow);transition:transform .3s,box-shadow .3s,border-color .3s;text-decoration:none;display:block;position:relative}",
    ".g-card:hover,.g-feature:hover{transform:translateY(-4px);border-color:color-mix(in oklab,var(--g-primary) 40%,var(--g-line))}.g-card p,.g-feature p{color:var(--g-muted);margin:0}",
    ".g-card-glass{background:color-mix(in oklab,var(--g-surface) 60%,transparent);backdrop-filter:blur(16px)}.g-card-soft{background:var(--g-soft);border-color:transparent;box-shadow:none}.g-card-outline{box-shadow:none}.g-card-gradient{background:var(--g-gradient);color:#fff;border:0}.g-card-gradient p{color:rgba(255,255,255,.85)}",
    ".g-card-img{margin:-28px -28px 20px;width:calc(100% + 56px);max-width:none;aspect-ratio:16/9;object-fit:cover;border-radius:var(--g-radius) var(--g-radius) 0 0}",
    ".g-card-icon{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;background:var(--g-soft);color:var(--g-primary);margin-bottom:18px}",
    ".g-stat{text-align:center}.g-stat strong{display:block;font-size:clamp(34px,5vw,48px);font-weight:800;letter-spacing:-.04em;background:var(--g-gradient);-webkit-background-clip:text;background-clip:text;color:transparent}.g-stat span{color:var(--g-muted);font-size:15px}",
    ".g-pricing{display:flex;flex-direction:column;gap:14px}.g-pricing h3{font-size:16px;color:var(--g-muted);font-weight:600}.g-price{font-size:46px;font-weight:800;letter-spacing:-.04em}.g-price small{font-size:15px;color:var(--g-muted);font-weight:500;margin-left:4px}.g-pricing-body{flex:1}",
    ".g-featured{border:2px solid var(--g-primary);transform:scale(1.03);box-shadow:0 30px 60px -24px color-mix(in oklab,var(--g-primary) 50%,transparent)}.g-pricing-tag{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--g-gradient);color:#fff;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px}",
    ".g-testimonial{margin:0}.g-testimonial blockquote{margin:0 0 20px;font-size:17px;line-height:1.6}.g-testimonial figcaption{display:flex;gap:12px;align-items:center}.g-testimonial figcaption span{display:block;color:var(--g-muted);font-size:14px}",
    ".g-avatar{display:inline-grid;place-items:center;border-radius:50%;background:var(--g-gradient);color:#fff;font-weight:700;font-size:14px;object-fit:cover;flex:none;border:2px solid var(--g-surface)}.g-avatars{display:flex}.g-avatars .g-avatar{margin-left:-10px}.g-avatars .g-avatar:first-child{margin:0}",
    ".g-member{text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}.g-member span{color:var(--g-muted);font-size:14px}.g-member .g-avatar{font-size:28px;margin-bottom:10px}",
    ".g-stars{color:#f5b301;letter-spacing:2px}.g-stars i{color:var(--g-line);font-style:normal}",
    /* tipografia extra */
    ".g-quote{border-left:3px solid var(--g-primary);padding:4px 0 4px 20px;margin:24px 0;font-size:20px;font-style:italic}.g-quote cite{display:block;margin-top:10px;font-size:14px;font-style:normal;color:var(--g-muted)}",
    ".g-kbd{font:600 12px 'JetBrains Mono',monospace;padding:3px 7px;border-radius:6px;border:1px solid var(--g-line);border-bottom-width:3px;background:var(--g-surface)}.g-mark{background:color-mix(in oklab,var(--g-primary) 22%,transparent);color:inherit;padding:0 4px;border-radius:4px}",
    ".g-inline-code{font:500 .9em 'JetBrains Mono',monospace;background:var(--g-soft);padding:2px 6px;border-radius:6px;color:var(--g-primary)}",
    ".g-list{padding-left:20px;margin:0 0 1em}.g-list li{margin:8px 0}.g-list-icon{list-style:none;padding:0}.g-list-icon li{display:flex;gap:10px;align-items:flex-start}.g-li-ic{color:var(--g-primary);margin-top:4px;flex:none}",
    ".g-code,.g-browser{border-radius:14px;overflow:hidden;background:#0c0e16;border:1px solid #1e2230;box-shadow:var(--g-shadow);margin:16px 0;color:#e6e9f5}.g-code-bar{display:flex;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid #1e2230;font-size:12px;color:#8b93a7;font-family:'JetBrains Mono',monospace}.g-code-bar button{margin-left:auto;background:none;border:0;color:inherit;cursor:pointer}",
    ".g-dots{display:flex;gap:6px}.g-dots i{width:11px;height:11px;border-radius:50%;background:#ff5f57}.g-dots i:nth-child(2){background:#febc2e}.g-dots i:nth-child(3){background:#28c840}.g-url{flex:1;text-align:center;background:#161926;border-radius:6px;padding:3px}",
    ".g-code pre{margin:0;padding:18px;overflow:auto;font:14px/1.7 'JetBrains Mono',monospace}.g-browser{background:var(--g-surface);border-color:var(--g-line)}.g-browser .g-code-bar{background:#0c0e16}",
    /* feedback */
    ".g-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;font-size:12.5px;font-weight:600;background:var(--g-soft);color:var(--g-primary)}.g-badge-success{background:#e7f8ef;color:#0f8a4f}.g-badge-warning{background:#fff4e0;color:#b25e00}.g-badge-danger{background:#fdecec;color:#c42b2b}.g-badge-dark{background:var(--g-ink);color:var(--g-bg)}",
    ".g-alert{display:flex;gap:14px;padding:16px 18px;border-radius:14px;border:1px solid;margin:16px 0}.g-alert strong{display:block;margin-bottom:2px}.g-alert svg{flex:none;margin-top:2px}.g-alert-info{background:color-mix(in oklab,#2f6bff 8%,var(--g-surface));border-color:color-mix(in oklab,#2f6bff 25%,transparent);color:#2f6bff}.g-alert-success{background:color-mix(in oklab,#12b981 8%,var(--g-surface));border-color:color-mix(in oklab,#12b981 30%,transparent);color:#0d8a60}.g-alert-warning{background:color-mix(in oklab,#f59e0b 10%,var(--g-surface));border-color:color-mix(in oklab,#f59e0b 35%,transparent);color:#b25e00}.g-alert-danger{background:color-mix(in oklab,#ef4444 8%,var(--g-surface));border-color:color-mix(in oklab,#ef4444 30%,transparent);color:#c42b2b}.g-alert div div{color:var(--g-ink)}",
    ".g-tip{position:relative;border-bottom:1px dashed var(--g-muted);cursor:help}.g-tip::after{content:attr(data-tip);position:absolute;bottom:130%;left:50%;transform:translate(-50%,4px);background:var(--g-ink);color:var(--g-bg);padding:6px 10px;border-radius:8px;font-size:13px;white-space:nowrap;opacity:0;pointer-events:none;transition:.2s}.g-tip:hover::after{opacity:1;transform:translate(-50%,0)}",
    ".g-banner{background:var(--g-gradient);color:#fff;text-align:center;padding:10px 16px;font-size:14px;font-weight:500}.g-banner a{color:#fff;font-weight:700}",
    ".g-progress-l{display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px;font-weight:500}.g-progress{height:8px;background:var(--g-line);border-radius:99px;overflow:hidden}.g-progress span{display:block;height:100%;background:var(--g-gradient);border-radius:99px;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}",
    ".g-countdown{display:flex;gap:12px;justify-content:center}.g-countdown div{background:var(--g-surface);border:1px solid var(--g-line);border-radius:14px;padding:14px 18px;min-width:80px;text-align:center}.g-countdown strong{display:block;font-size:32px;font-weight:800;font-variant-numeric:tabular-nums}.g-countdown span{font-size:12px;color:var(--g-muted);text-transform:uppercase;letter-spacing:.1em}",
    ".g-table-wrap{overflow:auto;border:1px solid var(--g-line);border-radius:14px;background:var(--g-surface)}.g-table{width:100%;border-collapse:collapse;font-size:15px}.g-table td,.g-table th{padding:14px 18px;text-align:left;border-bottom:1px solid var(--g-line)}.g-table tr:first-child{background:var(--g-soft);font-weight:700}.g-table tr:last-child td{border-bottom:0}",
    /* interativos */
    ".g-acc{border:1px solid var(--g-line);border-radius:14px;background:var(--g-surface);margin-bottom:10px;overflow:hidden}.g-acc summary{padding:18px 20px;font-weight:600;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:16px}.g-acc summary::-webkit-details-marker{display:none}.g-acc-i{transition:transform .3s;color:var(--g-primary);font-size:22px;line-height:1}.g-acc[open] .g-acc-i{transform:rotate(45deg)}.g-acc-b{padding:0 20px 18px;color:var(--g-muted)}",
    ".g-tabs-list{display:inline-flex;gap:4px;padding:4px;border-radius:12px;background:var(--g-soft);margin-bottom:20px}.g-tabs-list button{border:0;background:none;padding:8px 16px;border-radius:9px;font:600 14px var(--g-font);color:var(--g-muted);cursor:pointer}.g-tabs-list button[aria-selected=true]{background:var(--g-surface);color:var(--g-ink);box-shadow:var(--g-shadow)}",
    ".g-modal{border:1px solid var(--g-line);border-radius:20px;padding:32px;max-width:520px;width:92%;background:var(--g-surface);color:var(--g-ink);box-shadow:0 40px 80px -20px rgba(0,0,0,.4)}.g-modal::backdrop{background:rgba(5,7,15,.5);backdrop-filter:blur(4px)}.g-modal[open]{animation:g-pop .3s}.g-modal-x{position:absolute;right:14px;top:14px;background:none;border:0;color:inherit;cursor:pointer}",
    ".g-carousel{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px}.g-carousel>*{flex:0 0 min(340px,85%);scroll-snap-align:start}",
    ".g-marquee{overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);padding:20px 0}.g-marquee-t{display:flex;gap:56px;width:max-content;animation:g-marquee 30s linear infinite;align-items:center;color:var(--g-muted);font-weight:700;font-size:20px}.g-marquee-t img{height:30px;opacity:.7}",
    /* mídia/forms */
    ".g-image{border-radius:var(--g-radius);border:1px solid var(--g-line);width:100%}.g-embed{position:relative;aspect-ratio:16/9;border-radius:var(--g-radius);overflow:hidden;border:1px solid var(--g-line)}.g-embed iframe{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".g-form{display:grid;gap:16px;max-width:560px}.g-field{display:grid;gap:6px;font-size:14px;font-weight:600}.g-field input,.g-field textarea,.g-field select,.g-newsletter input{font:15px var(--g-font);padding:12px 14px;border-radius:12px;border:1px solid var(--g-line);background:var(--g-surface);color:var(--g-ink);outline:none;transition:.2s}.g-field input:focus,.g-field textarea:focus,.g-newsletter input:focus{border-color:var(--g-primary);box-shadow:0 0 0 4px color-mix(in oklab,var(--g-primary) 18%,transparent)}",
    ".g-newsletter{display:flex;gap:8px;max-width:440px;margin:16px auto 0}.g-newsletter input{flex:1}",
    /* seções */
    ".g-timeline{list-style:none;padding:0 0 0 28px;margin:0;border-left:2px solid var(--g-line)}.g-step{position:relative;padding:0 0 36px}.g-step-dot{position:absolute;left:-36px;top:4px;width:14px;height:14px;border-radius:50%;background:var(--g-primary);box-shadow:0 0 0 5px var(--g-soft)}.g-step div{color:var(--g-muted)}",
    ".g-cta{position:relative;overflow:hidden;text-align:center;padding:clamp(48px,8vw,88px) 24px;border-radius:28px;background:var(--g-gradient);color:#fff;margin:48px 0}.g-cta::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 20% 0,rgba(255,255,255,.3),transparent 50%)}.g-cta>*{position:relative}.g-cta h2{font-size:clamp(30px,5vw,52px)}.g-cta p{opacity:.9;font-size:18px;max-width:560px;margin:0 auto 28px}",
    ".g-unknown{outline:1px dashed #ef4444;outline-offset:4px}",
    /* animações */
    ".g-anim{opacity:0;transform:translateY(24px);transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1)}.g-anim-fade{transform:none}.g-anim-zoom{transform:scale(.94)}.g-anim.g-in{opacity:1;transform:none}",
    "@keyframes g-float{to{transform:translate3d(0,40px,0) scale(1.08)}}@keyframes g-shine{to{background-position:200% center}}@keyframes g-marquee{to{transform:translateX(-50%)}}@keyframes g-pop{from{opacity:0;transform:scale(.95)}}",
    "@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.g-anim{opacity:1;transform:none}}",
    "@media(max-width:900px){.g-grid{grid-template-columns:repeat(min(var(--cols),2),1fr)}.g-split,.g-hero-split .g-hero-in{grid-template-columns:1fr}.g-bento{grid-template-columns:1fr 1fr}.g-featured{transform:none}}",
    "@media(max-width:640px){.g-grid,.g-bento{grid-template-columns:1fr}.g-bento>*{grid-column:auto!important;grid-row:auto!important}.g-burger{display:block}.g-nav-links{display:none;position:absolute;top:68px;left:0;right:0;flex-direction:column;align-items:stretch;padding:16px;background:var(--g-surface);border-bottom:1px solid var(--g-line)}.g-nav.g-open .g-nav-links{display:flex}.g-newsletter{flex-direction:column}}"
  ].join("");

  /* ------------------------------------------------------------------ *
   * 6. RUNTIME (interatividade na página gerada)
   * ------------------------------------------------------------------ */
  var RUNTIME = "(function(){var d=document;" +
    "var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('g-in');var c=e.target.querySelector&&e.target.querySelectorAll('[data-g-count]');io.unobserve(e.target)}})},{threshold:.12});" +
    "d.querySelectorAll('.g-anim,.g-grid>*,.g-bento>*').forEach(function(el,i){el.classList.add('g-anim');el.style.transitionDelay=(i%4)*80+'ms';io.observe(el)});" +
    "var co=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var el=e.target,raw=el.getAttribute('data-g-count'),m=raw.match(/^(\\D*)([\\d.,]+)(.*)$/);co.unobserve(el);if(!m)return;var target=parseFloat(m[2].replace(/\\./g,'').replace(',','.')),t0=performance.now();function f(t){var p=Math.min(1,(t-t0)/1400),v=target*(1-Math.pow(1-p,3));el.textContent=m[1]+(target%1?v.toFixed(1):Math.round(v).toLocaleString('pt-BR'))+m[3];if(p<1)requestAnimationFrame(f);else el.textContent=raw}requestAnimationFrame(f)})});d.querySelectorAll('[data-g-count]').forEach(function(el){co.observe(el)});" +
    "var nav=d.querySelector('.g-nav');addEventListener('scroll',function(){nav&&nav.classList.toggle('g-scrolled',scrollY>8)});" +
    "d.addEventListener('click',function(e){var t=e.target.closest('[data-g-burger]');if(t)t.closest('.g-nav').classList.toggle('g-open');" +
    "t=e.target.closest('[data-g-theme]');if(t){var h=d.documentElement;h.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'light':'dark')}" +
    "t=e.target.closest('[data-g-copy]');if(t){navigator.clipboard&&navigator.clipboard.writeText(t.closest('.g-code').querySelector('code').innerText);t.style.color='#28c840'}" +
    "t=e.target.closest('[data-g-open]');if(t){var m=d.getElementById(t.getAttribute('data-g-open'));m&&m.showModal()}" +
    "t=e.target.closest('[data-g-tab]');if(t){var w=t.closest('[data-g-tabs]'),i=t.getAttribute('data-g-tab');w.querySelectorAll('[data-g-tab]').forEach(function(b){b.setAttribute('aria-selected',b===t)});w.querySelectorAll('[data-g-panel]').forEach(function(p){p.hidden=p.getAttribute('data-g-panel')!==i})}});" +
    "d.querySelectorAll('[data-g-countdown]').forEach(function(el){var to=new Date(el.getAttribute('data-g-countdown')).getTime();function tick(){var s=Math.max(0,Math.floor((to-Date.now())/1000)),v=[Math.floor(s/86400),Math.floor(s%86400/3600),Math.floor(s%3600/60),s%60];el.querySelectorAll('strong').forEach(function(x,i){x.textContent=String(v[i]).padStart(2,'0')})}tick();setInterval(tick,1000)});" +
    "})();";

  /* ------------------------------------------------------------------ *
   * 5b. CSS DOS COMPONENTES NOVOS (v0.1)
   * ------------------------------------------------------------------ */
  var NEWCSS = [
    ":root{--g-c1:var(--g-primary);--g-c2:var(--g-accent);--g-c3:#f59e0b;--g-c4:#ec4899;--g-c5:#22c55e;--g-c6:#0ea5e9}",
    "[hidden]{display:none!important}.g-wrap{max-width:var(--g-max,1180px)}.g-unknown{outline:0}[data-dev] .g-unknown{outline:1px dashed #ef4444;outline-offset:4px}",
    ".g-i-sun{display:none}[data-theme=dark] .g-i-sun{display:inline-flex}[data-theme=dark] .g-i-moon{display:none}.g-i-sun,.g-i-moon{line-height:0}",
    ".g-route{display:block;min-height:55vh}.g-route-in{animation:g-route .5s cubic-bezier(.2,.8,.2,1)}@keyframes g-route{from{opacity:0;transform:translateY(12px)}}",
    ".g-center{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px}.g-left{text-align:left;margin-left:0}.g-shadow{box-shadow:var(--g-shadow)}.g-small{font-size:13px;color:var(--g-muted)}",
    ".g-trigger{cursor:pointer;display:inline-block}.g-trigger:focus-visible,.g-btn:focus-visible,.g-link:focus-visible{outline:2px solid var(--g-primary);outline-offset:3px}",
    ".g-nav-links a[aria-current=page]{color:var(--g-ink);background:var(--g-soft)}",
    ".g-docs{display:grid;grid-template-columns:240px minmax(0,1fr);gap:40px;align-items:start}.g-sidebar{position:sticky;top:88px;display:flex;flex-direction:column;gap:2px;font-size:15px}.g-sidebar strong{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--g-muted);margin:0 0 8px 12px}.g-sidebar a{padding:7px 12px;border-radius:9px;text-decoration:none;color:var(--g-muted)}.g-sidebar a:hover,.g-sidebar a[aria-current=page]{background:var(--g-soft);color:var(--g-ink)}.g-content{min-width:0}",
    ".g-dd{position:relative;display:inline-block}.g-dd summary{list-style:none}.g-dd summary::-webkit-details-marker{display:none}.g-dd-menu{position:absolute;z-index:40;top:calc(100% + 8px);left:0;min-width:210px;padding:8px;border-radius:14px;background:var(--g-surface);border:1px solid var(--g-line);box-shadow:var(--g-shadow);display:flex;flex-direction:column;animation:g-pop .18s}.g-dd-menu a{padding:9px 12px;border-radius:9px;text-decoration:none;font-size:15px}.g-dd-menu a:hover{background:var(--g-soft)}",
    ".g-toc{position:sticky;top:88px;font-size:14px}.g-toc strong{display:block;margin-bottom:8px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--g-muted)}.g-toc ul{list-style:none;margin:0;padding:0;border-left:1px solid var(--g-line)}.g-toc li a{display:block;padding:5px 14px;color:var(--g-muted);text-decoration:none}.g-toc li a:hover{color:var(--g-primary)}.g-toc .g-sub a{padding-left:28px}",
    ".g-pagination{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}.g-pg{min-width:38px;height:38px;padding:0 10px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;border:1px solid var(--g-line);background:var(--g-surface);text-decoration:none;font-weight:600;font-size:14px;transition:.2s}a.g-pg:hover{border-color:var(--g-primary);color:var(--g-primary)}.g-pg.g-on{background:var(--g-primary);border-color:var(--g-primary);color:#fff}.g-pg.g-off{opacity:.45;border-style:dashed}",
    ".g-stepper{list-style:none;display:flex;gap:0;padding:0;margin:0 0 24px;counter-reset:s}.g-stepper li{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;font-size:14px;color:var(--g-muted);text-align:center}.g-stepper li::before{content:'';position:absolute;top:15px;left:-50%;width:100%;height:2px;background:var(--g-line)}.g-stepper li:first-child::before{display:none}.g-stepper b{position:relative;z-index:1;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--g-surface);border:2px solid var(--g-line);font-size:14px;color:var(--g-muted)}.g-stepper .done b,.g-stepper .now b{background:var(--g-primary);border-color:var(--g-primary);color:#fff}.g-stepper .done::before,.g-stepper .now::before{background:var(--g-primary)}.g-stepper .now{color:var(--g-ink);font-weight:600}",
    ".g-totop{position:fixed;right:20px;bottom:20px;z-index:60;width:46px;height:46px;border-radius:50%;border:1px solid var(--g-line);background:var(--g-surface);color:var(--g-ink);box-shadow:var(--g-shadow);cursor:pointer;display:grid;place-items:center;transition:.2s}.g-totop:hover{background:var(--g-primary);color:#fff;transform:translateY(-3px)}",
    ".g-toasts{position:fixed;right:20px;bottom:20px;z-index:100;display:flex;flex-direction:column;gap:10px;max-width:min(380px,calc(100vw - 40px))}.g-toast{padding:14px 18px;border-radius:14px;background:var(--g-ink);color:var(--g-bg);font-size:15px;font-weight:500;box-shadow:0 20px 40px -12px rgba(0,0,0,.4);border-left:4px solid var(--g-primary);animation:g-toast .35s cubic-bezier(.2,.8,.2,1);transition:.3s}.g-toast.g-out{opacity:0;transform:translateX(24px)}.g-toast-success{border-color:#22c55e}.g-toast-warning{border-color:#f59e0b}.g-toast-danger{border-color:#ef4444}@keyframes g-toast{from{opacity:0;transform:translateY(16px) scale(.96)}}",
    ".g-skel{display:block;border-radius:10px;background:linear-gradient(90deg,var(--g-line) 25%,var(--g-soft) 50%,var(--g-line) 75%);background-size:200% 100%;animation:g-skel 1.4s infinite}.g-skel-wrap{display:grid;gap:10px}.g-skel-line{height:14px}.g-skel-avatar{width:44px;height:44px;border-radius:50%}.g-skel-card{height:180px;border-radius:var(--g-radius)}@keyframes g-skel{to{background-position:-200% 0}}",
    ".g-spinner{display:inline-block;width:var(--s,24px);height:var(--s,24px);border-radius:50%;border:3px solid var(--g-line);border-top-color:var(--g-primary);animation:g-spin .7s linear infinite}@keyframes g-spin{to{transform:rotate(360deg)}}",
    ".g-empty{text-align:center;padding:48px 24px;border:1px dashed var(--g-line);border-radius:var(--g-radius);display:flex;flex-direction:column;align-items:center}.g-empty .g-card-icon{margin-bottom:12px}.g-empty h3{margin-bottom:4px}.g-empty p{max-width:380px;margin:0}",
    ".g-cookie{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:90;display:flex;gap:16px;align-items:center;padding:14px 18px;border-radius:16px;background:var(--g-surface);border:1px solid var(--g-line);box-shadow:var(--g-shadow);width:min(640px,calc(100vw - 32px));font-size:14px}.g-cookie p{margin:0;flex:1}",
    ".g-status{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:500}.g-status i{width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px color-mix(in oklab,#22c55e 25%,transparent)}.g-status-busy i{background:#ef4444;box-shadow:0 0 0 4px color-mix(in oklab,#ef4444 25%,transparent)}.g-status-warning i{background:#f59e0b;box-shadow:0 0 0 4px color-mix(in oklab,#f59e0b 25%,transparent)}.g-status-offline i{background:#94a3b8;box-shadow:none}",
    ".g-drawer{position:fixed;margin:0;top:0;bottom:0;height:100%;max-height:none;width:min(420px,92vw);border-radius:0;border-width:0 0 0 1px}.g-drawer-right{right:0;left:auto}.g-drawer-left{left:0;right:auto;border-width:0 1px 0 0}.g-drawer[open]{animation:g-drawer .3s cubic-bezier(.2,.8,.2,1)}@keyframes g-drawer{from{transform:translateX(30px);opacity:0}}",
    ".g-gallery{display:grid;grid-template-columns:repeat(var(--cols,3),minmax(0,1fr));gap:14px}.g-gallery img{aspect-ratio:4/3;object-fit:cover;cursor:zoom-in;transition:.3s}.g-gallery img:hover{transform:scale(1.02);filter:brightness(1.05)}.g-lightbox{max-width:92vw;padding:0;background:none;border:0;box-shadow:none}.g-lightbox img{max-height:88vh;border-radius:16px}",
    ".g-audio{width:100%}.g-figure{margin:0}.g-figure figcaption{text-align:center;color:var(--g-muted);font-size:14px;margin-top:10px}",
    ".g-social{display:flex;gap:10px;flex-wrap:wrap}.g-social-a{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;border:1px solid var(--g-line);background:var(--g-surface);transition:.25s;text-decoration:none}.g-social-a:hover{background:var(--g-primary);color:#fff;border-color:var(--g-primary);transform:translateY(-3px)}",
    ".g-product{padding:28px;display:flex;flex-direction:column;gap:10px}.g-product .g-card-img{aspect-ratio:1;object-fit:cover}.g-product-badge{position:absolute;top:14px;left:14px;z-index:2}.g-product h3{margin:0}.g-price-row{display:flex;gap:10px;align-items:baseline;font-size:22px}.g-price-row s{color:var(--g-muted);font-size:15px}.g-product .g-btn{align-self:flex-start;margin-top:4px}",
    ".g-post{display:flex;flex-direction:column;gap:10px}.g-post-meta{display:flex;gap:12px;align-items:center;font-size:13px;color:var(--g-muted)}.g-post h3{margin:0;font-size:20px;line-height:1.25}.g-post-by{display:flex;gap:10px;align-items:center;margin-top:auto;font-size:14px;font-weight:600}",
    ".g-metric{display:flex;flex-direction:column;gap:6px}.g-metric-top{display:flex;justify-content:space-between;align-items:center;font-size:14px}.g-metric-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--g-soft);color:var(--g-primary)}.g-metric strong{font-size:34px;letter-spacing:-.04em;line-height:1.1}.g-delta{display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;width:fit-content;padding:2px 9px;border-radius:99px}.g-delta-up{color:#0f8a4f;background:color-mix(in oklab,#22c55e 15%,transparent)}.g-delta-down{color:#dc2626;background:color-mix(in oklab,#ef4444 15%,transparent)}.g-delta-down svg{transform:scaleY(-1)}",
    ".g-chart{margin:0;padding:22px;background:var(--g-surface);border:1px solid var(--g-line);border-radius:var(--g-radius);box-shadow:var(--g-shadow)}.g-chart figcaption{font-weight:700;margin-bottom:12px}.g-chart-svg{width:100%;height:auto;display:block}.g-spark{width:120px;height:36px}",
    ".g-check{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:15px;position:relative}.g-check input{position:absolute;opacity:0;width:0;height:0}.g-check-box{width:20px;height:20px;border-radius:6px;border:2px solid var(--g-line);background:var(--g-surface);display:grid;place-items:center;transition:.2s;flex:none}.g-check-box.g-radio{border-radius:50%}.g-check input:checked+.g-check-box{background:var(--g-primary);border-color:var(--g-primary)}.g-check input:checked+.g-check-box::after{content:'';width:9px;height:5px;border:2px solid #fff;border-top:0;border-right:0;transform:rotate(-45deg) translate(1px,-1px)}.g-check input:checked+.g-radio::after{width:8px;height:8px;border:0;border-radius:50%;background:#fff;transform:none}.g-check input:focus-visible+.g-check-box,.g-check input:focus-visible+.g-switch-track{outline:2px solid var(--g-primary);outline-offset:3px}",
    ".g-switch-track{width:42px;height:24px;border-radius:99px;background:var(--g-line);position:relative;transition:.25s;flex:none}.g-switch-track::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:.25s}.g-switch input:checked+.g-switch-track{background:var(--g-primary)}.g-switch input:checked+.g-switch-track::after{transform:translateX(18px)}",
    ".g-radio-group{border:0;padding:0;margin:0;display:grid;gap:10px}.g-radio-group legend{font-size:14px;font-weight:600;margin-bottom:8px;padding:0}",
    ".g-range-l{display:flex;justify-content:space-between}.g-range{width:100%;accent-color:var(--g-primary);padding:0;height:6px}.g-search{display:flex;align-items:center;gap:10px;padding:0 14px;border-radius:12px;border:1px solid var(--g-line);background:var(--g-surface);color:var(--g-muted);transition:.2s;max-width:420px}.g-search:focus-within{border-color:var(--g-primary);box-shadow:0 0 0 4px color-mix(in oklab,var(--g-primary) 18%,transparent)}.g-search input{flex:1;border:0;background:none;outline:0;font:15px var(--g-font);color:var(--g-ink);padding:12px 0}",
    ".g-upload{display:flex;flex-direction:column;align-items:center;gap:6px;padding:32px 20px;border:2px dashed var(--g-line);border-radius:var(--g-radius);background:var(--g-surface);cursor:pointer;text-align:center;transition:.2s;position:relative}.g-upload:hover{border-color:var(--g-primary);background:var(--g-soft)}.g-upload svg{color:var(--g-primary)}.g-upload small{color:var(--g-muted)}.g-upload input{position:absolute;inset:0;opacity:0;cursor:pointer}",
    ".g-authform{max-width:420px;padding:32px}.g-authform h3{font-size:24px;margin-bottom:4px}.g-typed span::after{content:'';display:inline-block;width:3px;height:.9em;margin-left:3px;vertical-align:-.1em;background:var(--g-primary);animation:g-blink 1s steps(1) infinite}@keyframes g-blink{50%{opacity:0}}.g-typed{color:var(--g-primary)}",
    ".g-hide-mobile{display:revert}.g-hide-desktop{display:revert}@media(min-width:901px){.g-hide-desktop{display:none!important}}@media(max-width:900px){.g-hide-tablet{display:none!important}.g-docs{grid-template-columns:1fr}.g-sidebar,.g-toc{position:static}}@media(max-width:640px){.g-hide-mobile{display:none!important}.g-stepper span{font-size:12px}.g-gallery{grid-template-columns:1fr 1fr}}",
    "header:has(>.g-nav){display:contents}",
    ".g-marquee-t .g-m-i{display:inline-block;padding-right:3rem;white-space:nowrap}",
    "dl.g-dl,dl{display:grid;grid-template-columns:max-content 1fr;gap:10px 24px;margin:0 0 1em}dt{font-weight:600}dd{margin:0;color:var(--g-muted)}"
  ].join("");

  /* ------------------------------------------------------------------ *
   * 6b. RUNTIME 2 — rotas, estado, tema, toasts, filtros… (sem libs)
   * ------------------------------------------------------------------ */
  function RT() {
    var d = document, W = window, S = {}, root = d.documentElement;
    if (/^(localhost|127\.|\[::1\]|)$/.test(location.hostname)) root.setAttribute("data-dev", "");
    function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
    function pv(v) { if (v === "true") return true; if (v === "false") return false; if (v !== "" && v != null && !isNaN(v)) return Number(v); return v; }
    function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }

    /* ---- estado ---- */
    $$("[data-g-state]").forEach(function (el) { var k = el.getAttribute("data-g-state"), v = pv(el.getAttribute("data-v")); if (el.hasAttribute("data-persist")) { var s = ls("gs:" + k); if (s != null) v = pv(s); } S[k] = v; });
    function cond(expr) {
      var m = /^\s*(!)?\s*([\w.-]+)\s*(?:(==|!=|>=|<=|>|<)\s*(.+?))?\s*$/.exec(expr); if (!m) return false;
      var a = S[m[2]], r;
      if (m[3]) { var b = pv(m[4].replace(/^['"]|['"]$/g, "")); r = m[3] === "==" ? a == b : m[3] === "!=" ? a != b : m[3] === ">=" ? a >= b : m[3] === "<=" ? a <= b : m[3] === ">" ? a > b : a < b; }
      else r = !!a && a !== "false" && a !== 0;
      return m[1] ? !r : r;
    }
    function paint() {
      $$("[data-g-bind]").forEach(function (e) { var v = S[e.getAttribute("data-g-bind")]; e.textContent = v == null ? "" : v; });
      $$("[data-g-show]").forEach(function (e) { e.hidden = !cond(e.getAttribute("data-g-show")); });
      $$("[data-g-set]").forEach(function (e) { var k = e.getAttribute("data-g-set"); if (k in S && d.activeElement !== e) { if (e.type === "checkbox") e.checked = !!S[k]; else e.value = S[k]; } });
    }
    function set(k, v) { S[k] = v; if (d.querySelector('[data-g-state="' + k + '"][data-persist]')) ls("gs:" + k, String(v)); paint(); }
    function act(str) {
      String(str).split(";").forEach(function (p) {
        var m = /^\s*(inc|dec|set|toggle|reset)\s*:\s*([\w.-]+)(?:\s*[=:]\s*(.*))?\s*$/.exec(p); if (!m) return;
        var k = m[2], v = m[3], el;
        if (m[1] === "inc") set(k, (Number(S[k]) || 0) + (v ? Number(v) : 1));
        else if (m[1] === "dec") set(k, (Number(S[k]) || 0) - (v ? Number(v) : 1));
        else if (m[1] === "set") set(k, pv(v == null ? "" : v.trim()));
        else if (m[1] === "toggle") set(k, !S[k]);
        else { el = d.querySelector('[data-g-state="' + k + '"]'); set(k, pv(el ? el.getAttribute("data-v") : "")); }
      });
    }
    W.GitmlState = { get: function (k) { return S[k]; }, set: set, run: act };

    /* ---- rotas (hash: #/pagina) ---- */
    var routes = $$("[data-g-route]"), cur = null, baseTitle = d.title;
    function fixLinks() {
      if (!routes.length) return;
      $$('a[href^="/"]').forEach(function (a) { var h = a.getAttribute("href"); if (h.indexOf("//") === 0 || /\.\w{1,5}($|[?#])/.test(h)) return; a.setAttribute("href", "#" + h); });
      $$('a.g-brand[href="#"]').forEach(function (a) { a.setAttribute("href", "#/"); });
    }
    function mt(pat, path) {
      var pp = pat.split("/").filter(Boolean), cc = path.split("/").filter(Boolean), ps = {};
      if (pp.length !== cc.length) return null;
      for (var i = 0; i < pp.length; i++) { if (pp[i].charAt(0) === ":") ps[pp[i].slice(1)] = decodeURIComponent(cc[i]); else if (pp[i] !== cc[i]) return null; }
      return ps;
    }
    function go() {
      if (!routes.length) return;
      var h = location.hash;
      if (h.length > 1 && h.charAt(1) !== "/") { if (cur) return; h = ""; }
      var path = (h.slice(1) || "/").split("?")[0].replace(/\/+$/, "") || "/", hit = null, nf = null, params = {};
      routes.forEach(function (r) { var p = r.getAttribute("data-g-route"); if (p === "*") { nf = r; return; } var m = !hit && mt(p, path); if (m) { hit = r; params = m; } });
      hit = hit || nf;
      routes.forEach(function (r) { r.hidden = r !== hit; });
      if (hit && hit !== cur) { hit.classList.remove("g-route-in"); void hit.offsetWidth; hit.classList.add("g-route-in"); if (cur) scrollTo(0, 0); }
      cur = hit;
      if (hit) { var t = hit.getAttribute("data-title"); d.title = t ? t + " · " + baseTitle : baseTitle; }
      $$("[data-g-param]").forEach(function (e) { e.textContent = params[e.getAttribute("data-g-param")] || ""; });
      $$("a[href]").forEach(function (a) { var on = a.getAttribute("href") === "#" + path; if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      $$(".g-nav").forEach(function (n) { n.classList.remove("g-open"); });
      W.dispatchEvent(new CustomEvent("gitml:route", { detail: { path: path, params: params } }));
      toc();
    }

    /* ---- sumário automático ---- */
    function toc() {
      $$("[data-g-toc]").forEach(function (t) {
        var scope = $$(t.getAttribute("data-g-toc")).filter(function (x) { return !x.hidden; })[0] || d.body, ul = t.querySelector("ul"); ul.innerHTML = "";
        $$("h2,h3", cur || scope).forEach(function (h, i) { if (t.contains(h)) return; if (!h.id) h.id = "s-" + (h.textContent || "").toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") + "-" + i; var li = d.createElement("li"), a = d.createElement("a"); a.href = "#" + h.id; a.textContent = h.textContent; if (h.tagName === "H3") li.className = "g-sub"; li.appendChild(a); ul.appendChild(li); });
      });
    }

    /* ---- toasts ---- */
    function toast(msg, type) {
      var box = d.querySelector(".g-toasts"); if (!box) { box = d.createElement("div"); box.className = "g-toasts"; box.setAttribute("aria-live", "polite"); d.body.appendChild(box); }
      var t = d.createElement("div"); t.className = "g-toast g-toast-" + (type || "info"); t.textContent = msg; box.appendChild(t);
      setTimeout(function () { t.classList.add("g-out"); setTimeout(function () { t.remove(); }, 300); }, 3200);
    }
    W.GitmlToast = toast;

    /* ---- eventos globais ---- */
    d.addEventListener("click", function (e) {
      var t = e.target.closest ? e.target.closest("[data-g-action],[data-g-toast],[data-g-copytext],[data-g-top],[data-g-cookie-ok],[data-g-theme],.g-nav-links a,.g-gallery img") : null;
      if (e.target.tagName === "DIALOG") { e.target.close(); return; }
      if (!t) { $$(".g-dd[open]").forEach(function (x) { if (!x.contains(e.target)) x.removeAttribute("open"); }); return; }
      if (t.hasAttribute("data-g-theme")) { ls("g-theme", root.getAttribute("data-theme")); return; }
      if (t.hasAttribute("data-g-action")) { e.preventDefault(); act(t.getAttribute("data-g-action")); }
      else if (t.hasAttribute("data-g-toast")) toast(t.getAttribute("data-g-toast"), t.getAttribute("data-type"));
      else if (t.hasAttribute("data-g-copytext")) { try { navigator.clipboard.writeText(t.getAttribute("data-g-copytext")); } catch (x) { } var s = t.querySelector("span"), old = s.textContent; s.textContent = "Copiado!"; setTimeout(function () { s.textContent = old; }, 1400); }
      else if (t.hasAttribute("data-g-top")) scrollTo({ top: 0, behavior: "smooth" });
      else if (t.hasAttribute("data-g-cookie-ok")) { ls("g-cookie", "1"); t.closest("[data-g-cookie]").hidden = true; }
      else if (t.matches(".g-nav-links a")) { var n = t.closest(".g-nav"); n && n.classList.remove("g-open"); }
      else if (t.matches(".g-gallery img")) { var dl = d.createElement("dialog"); dl.className = "g-modal g-lightbox"; var im = d.createElement("img"); im.src = t.src; im.alt = t.alt; dl.appendChild(im); dl.addEventListener("close", function () { dl.remove(); }); d.body.appendChild(dl); dl.showModal(); }
    });
    d.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("g-trigger")) { e.preventDefault(); act(e.target.getAttribute("data-g-action")); } });
    d.addEventListener("input", function (e) {
      var t = e.target, k = t.getAttribute && t.getAttribute("data-g-set");
      if (k) set(k, t.type === "checkbox" ? t.checked : t.type === "range" || t.type === "number" ? Number(t.value) : t.value);
      var f = t.getAttribute && t.getAttribute("data-g-filter");
      if (f) { var q = t.value.toLowerCase().trim(); $$(f).forEach(function (el) { el.hidden = !!q && el.textContent.toLowerCase().indexOf(q) < 0; }); }
      if (t.type === "file") { var sm = t.closest("label").querySelector("[data-g-file]"); if (sm) sm.textContent = [].map.call(t.files, function (x) { return x.name; }).join(", ") || sm.textContent; }
    });
    addEventListener("hashchange", go);
    addEventListener("scroll", function () { $$(".g-totop").forEach(function (b) { b.hidden = scrollY < 480; }); }, { passive: true });

    /* ---- digitação ---- */
    $$("[data-g-typed]").forEach(function (el) {
      var ws = el.getAttribute("data-g-typed").split("|").filter(Boolean), i = 0, j = 0, del = false, box = el.firstChild;
      if (ws.length < 2 || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
      (function tick() { var w = ws[i]; j += del ? -1 : 1; box.textContent = w.slice(0, j); var wait = del ? 40 : 90; if (!del && j === w.length) { del = true; wait = 1400; } else if (del && j === 0) { del = false; i = (i + 1) % ws.length; wait = 300; } setTimeout(tick, wait); })();
    });
    $$("[data-g-cookie]").forEach(function (c) { c.hidden = !!ls("g-cookie"); });

    fixLinks(); paint(); go(); toc();
  }
  var RUNTIME2 = "(" + RT.toString() + ")();";

  /* ------------------------------------------------------------------ *
   * 7. AUTO-BOOT no navegador (monta a página sem document.write)
   * ------------------------------------------------------------------ */
  function autoboot() {
    function withExt(p) { return /\.\w{1,6}$/.test(p) ? p : p + ".gitml"; }
    function rawUrl(u) { var x = new URL(u, location.href); x.searchParams.set("raw", "1"); return x.href; }
    function loadIncludes(src, from, cache, depth) {
      if (depth > 8) return Promise.resolve();
      var re = /<(?:include|import)\s+[^>]*?\bsrc\s*=\s*["']([^"']+)["']|<route\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi, m, jobs = [];
      while ((m = re.exec(src))) {
        (function (p) {
          var url = new URL(withExt(p), from).href;
          if (cache[url] != null) return;
          cache[url] = "";
          jobs.push(fetch(rawUrl(url)).then(function (r) { return r.ok ? r.text() : null; }).then(function (t) { cache[url] = t; return t ? loadIncludes(t, url, cache, depth + 1) : null; }).catch(function () { cache[url] = null; }));
        })(m[1] || m[2]);
      }
      return Promise.all(jobs);
    }
    function clone(n) {
      if (n.tagName === "SCRIPT") { var s = document.createElement("script"); for (var i = 0; i < n.attributes.length; i++) s.setAttribute(n.attributes[i].name, n.attributes[i].value); s.text = n.textContent; return s; }
      return document.importNode(n, true);
    }
    function mount(out) {
      try {
        var doc = new DOMParser().parseFromString(out.html, "text/html"), h = document.documentElement;
        h.setAttribute("lang", doc.documentElement.getAttribute("lang") || "pt-BR");
        h.setAttribute("data-theme", doc.documentElement.getAttribute("data-theme") || "dark");
        if (doc.documentElement.hasAttribute("data-auto")) h.setAttribute("data-auto", ""); else h.removeAttribute("data-auto");
        document.head.innerHTML = ""; document.body.innerHTML = "";
        [].slice.call(doc.head.childNodes).forEach(function (n) { document.head.appendChild(clone(n)); });
        [].slice.call(doc.body.childNodes).forEach(function (n) { document.body.appendChild(clone(n)); });
      } catch (e) { document.open(); document.write(out.html); document.close(); }
    }
    function overlay(out) {
      var list = out.errors.map(function (e) { return ["erro", e]; }).concat(out.warnings.map(function (w) { return ["aviso", w]; }));
      if (!list.length || !/^(localhost|127\.|\[::1\]|)$/.test(location.hostname)) return;
      var box = document.createElement("div");
      box.setAttribute("style", "position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:min(520px,calc(100vw - 32px));max-height:40vh;overflow:auto;background:#1a0b0f;color:#ffd7dc;border:1px solid #ef4444;border-radius:12px;padding:12px 14px;font:13px/1.5 ui-monospace,monospace;box-shadow:0 20px 40px rgba(0,0,0,.4)");
      box.innerHTML = "<b>GITML · " + list.length + " problema(s)</b> <a href='#' style='color:#fff;float:right' onclick='this.parentNode.remove();return false'>×</a><br>" + list.map(function (x) { return "[" + x[0] + "] linha " + x[1].line + ": " + String(x[1].message).replace(/</g, "&lt;"); }).join("<br>");
      document.body.appendChild(box);
    }
    function problem(title, lines, code) {
      var esc = function (t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
      var html = "<div style=\"min-height:100vh;display:grid;place-items:center;background:#07080d;color:#e8eaf2;font:16px/1.6 system-ui,sans-serif;padding:24px\"><div style=\"max-width:680px;width:100%;background:#10121a;border:1px solid #262b3d;border-radius:18px;padding:32px;box-shadow:0 30px 60px -20px rgba(0,0,0,.6)\">" +
        "<div style=\"color:#7c5cff;font-weight:700;letter-spacing:.1em;font-size:12px\">GITML " + VERSION + "</div><h1 style=\"margin:6px 0 12px;font-size:26px\">" + esc(title) + "</h1>" +
        lines.map(function (l) { return "<p style=\"margin:0 0 10px;color:#c5cbdb\">" + l + "</p>"; }).join("") +
        (code ? "<pre style=\"background:#0b0d15;border:1px solid #1f2330;border-radius:12px;padding:14px;overflow:auto;font:13.5px/1.6 ui-monospace,Consolas,monospace;color:#e5e7eb\">" + esc(code) + "</pre>" : "") + "</div></div>";
      document.title = "GITML — " + title; document.body.innerHTML = html;
    }
    var HOWTO = ["<b>Como abrir:</b>", "• No VS Code: botão <b>🌐 GITML: Abrir no navegador</b> (ou <code>Ctrl+Shift+P</code> → <i>GITML: Abrir no navegador</i>)", "• No terminal: <code>node bin/gitml.js dev</code> e abra o endereço mostrado", "• Ou: <code>python -m http.server 8000</code> e abra <code>http://localhost:8000/index.html</code> (o endereço precisa começar com <b>http://</b>, não <b>file://</b>)"];
    function run(src, from) {
      var cache = {}; from = from || location.href;
      loadIncludes(src, from, cache, 0).then(function () {
        var out;
        try { out = compile(src, { allowScripts: true, file: from, resolve: function (p, f) { var u = new URL(withExt(p), f || from).href; return { src: cache[u], path: u }; } }); }
        catch (e) { problem("Erro ao compilar o GITML", ["O motor encontrou um problema inesperado:"], e && e.stack || String(e)); return; }
        mount(out); overlay(out);
        out.errors.concat(out.warnings).forEach(function (e) { console.warn("[GITML] linha " + e.line + ": " + e.message); });
      });
    }
    function load(url) {
      var abs = new URL(url, location.href).href;
      if (location.protocol === "file:") { problem("Abra por um servidor local", ["Esta página foi aberta direto do disco (<b>file://</b>). Nesse modo o navegador bloqueia a leitura de <code>" + url.replace(/</g, "&lt;") + "</code>."].concat(HOWTO)); return; }
      fetch(rawUrl(abs)).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }).then(function (t) { run(t, abs); })
        .catch(function (e) { problem("Não consegui carregar " + url, ["O arquivo <code>" + abs.replace(/</g, "&lt;") + "</code> não pôde ser lido (" + String(e.message || e).replace(/</g, "&lt;") + ").", "Confira se o nome está certo e se o arquivo está na mesma pasta de onde você abriu a página."]); });
    }
    function go() {
      var inlineEl = document.querySelector('script[type="text/gitml"]');
      var inlineSrc = inlineEl && !inlineEl.getAttribute("src") ? inlineEl : null;
      var me = document.querySelector("script[data-src]");
      var dsrc = me && me.getAttribute("data-src");
      var qsrc = new URLSearchParams(location.search).get("src");
      if (qsrc) return load(qsrc);
      if (inlineSrc) { if (dsrc) console.warn("[GITML] data-src=\"" + dsrc + "\" ignorado: a página tem um <script type=\"text/gitml\"> e ele tem prioridade."); return run(inlineSrc.textContent, location.href); }
      var url = dsrc || (inlineEl && inlineEl.getAttribute("src"));
      if (url) return load(url);
      if (/\.gitml$/i.test(location.pathname)) return load(location.href);
      console.warn("[GITML] nada para montar: adicione <script type=\"text/gitml\"> ou data-src=\"arquivo.gitml\" na tag do gitml.js.");
      if (!document.body || !document.body.textContent.trim()) problem("Não há GITML nesta página", ["O <code>gitml.js</code> carregou, mas a página não tem nada para montar.", "Use uma destas formas:", "• <code>&lt;script src=\"gitml.js\" data-src=\"index.gitml\"&gt;&lt;/script&gt;</code> (lê um arquivo)", "• <code>&lt;script type=\"text/gitml\"&gt; … &lt;/script&gt;</code> (GITML escrito na própria página)", "• ou abra <code>viewer.html?src=index.gitml</code>"]);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  }

  /* ------------------------------------------------------------------ *
   * 8. FORMATADOR — reindenta código .gitml (2 espaços)
   * ------------------------------------------------------------------ */
  function format(source, indent) {
    indent = indent || "  ";
    var lines = String(source).replace(/\r\n?/g, "\n").split("\n"), out = [], depth = 0, raw = null, pend = null;
    var tagRe = /<(\/?)([A-Za-z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
    function pad(n) { return new Array(Math.max(0, n) + 1).join(indent); }
    for (var li = 0; li < lines.length; li++) {
      var l = lines[li], t = l.trim(), m;
      if (raw) { // dentro de <style>/<script>/<code>/comentário: mantém o conteúdo
        var closeRe = raw === "--" ? /-->/ : new RegExp("</" + raw + "\\s*>", "i");
        if (closeRe.test(t)) { raw = null; depth = Math.max(0, depth - 1); out.push(pad(depth) + t); } else out.push(l.replace(/\s+$/, ""));
        continue;
      }
      if (!t) { out.push(""); continue; }
      if (pend) { // continuação de tag aberta em várias linhas
        out.push(pad(depth + 1) + t);
        if (/>\s*$/.test(t)) { if (!/\/>\s*$/.test(t) && !VOID[pend] && !RAW[pend]) depth++; else if (!/\/>\s*$/.test(t) && RAW[pend]) { raw = pend; depth++; } pend = null; }
        continue;
      }
      if (/^<!--/.test(t) && !/-->/.test(t)) { out.push(pad(depth) + t); raw = "--"; depth++; continue; }
      var lead = /^<\/[A-Za-z]/.test(t) ? 1 : 0, delta = 0, lastRaw = null, mm;
      tagRe.lastIndex = 0;
      var tmp = t.replace(/<!--[\s\S]*?-->/g, "");
      while ((mm = tagRe.exec(tmp))) {
        var closing = mm[1] === "/", name = mm[2].toLowerCase(), self = mm[4] === "/";
        if (closing) { delta--; continue; }
        if (self || VOID[name]) continue;
        if (RAW[name]) { var after = tmp.slice(tagRe.lastIndex); if (!new RegExp("</" + name, "i").test(after)) lastRaw = name; else { var cl = after.search(new RegExp("</" + name, "i")); tagRe.lastIndex += cl; } continue; }
        delta++;
      }
      var open = /<([A-Za-z][\w-]*)(?:"[^"]*"|'[^']*'|[^>"'])*$/.exec(tmp);
      var d0 = depth - lead;
      out.push(pad(d0) + t);
      depth = Math.max(0, depth + delta);
      if (lastRaw) { raw = lastRaw; depth++; }
      else if (open && !/>\s*$/.test(tmp)) { pend = open[1].toLowerCase(); }
    }
    return out.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "") + "\n";
  }

  function components() {
    return Object.keys(C).map(function (k) { return { tag: k, main: C[k].info.main || k, alias: (C[k].info.main || k) !== k, group: C[k].group, desc: C[k].info.desc, attrs: C[k].info.attrs }; });
  }

  return { version: VERSION, parse: parse, compile: compile, components: components, icons: Object.keys(ICONS), resolveIncludes: resolveIncludes, format: format, voidTags: Object.keys(VOID), __autoboot: autoboot };
});
