"use strict";
/* Testa o comportamento no navegador (rotas, estado, busca, tema) com jsdom.
 * Opcional: npm i -D jsdom && node test/runtime.test.js */
let JSDOM; try { ({ JSDOM } = require("jsdom")); } catch (e) { console.log("[--] jsdom não instalado — teste de runtime pulado (npm i -D jsdom)"); process.exit(0); }
const fs = require("fs"), path = require("path"), gitml = require("../gitml.js");
const entry = path.join(__dirname, "../examples/app.gitml");
const html = gitml.compile(fs.readFileSync(entry, "utf8"), { allowScripts: true, file: entry, resolve: (p, from) => { const f = path.resolve(path.dirname(from || entry), /\.\w+$/.test(p) ? p : p + ".gitml"); return fs.existsSync(f) ? { src: fs.readFileSync(f, "utf8"), path: f } : null; } }).html;
let fail = 0; const ok = (c, m) => { console.log((c ? "[ok] " : "[x]  ") + m); if (!c) fail++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function boot(hash) {
  const dom = new JSDOM(html, { runScripts: "dangerously", url: "http://localhost/" + (hash || ""), pretendToBeVisual: true, beforeParse(w) {
    w.IntersectionObserver = class { observe() { } unobserve() { } }; w.scrollTo = () => { };
    w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); }; w.HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  } });
  const errs = []; dom.window.addEventListener("error", (e) => errs.push(e.message));
  return { w: dom.window, d: dom.window.document, errs };
}
(async () => {
  let { w, d, errs } = boot("");
  const vis = () => [...d.querySelectorAll("[data-g-route]")].filter((r) => !r.hidden).map((r) => r.getAttribute("data-g-route")).join();
  ok(errs.length === 0, "sem erros de JavaScript na página"); ok(vis() === "/", "abre na rota /");
  ok(!!d.querySelector('.g-nav a[href="#/produtos"]'), "links /x viram #/x");
  w.location.hash = "#/produtos"; await wait(30); ok(vis() === "/produtos" && d.title.startsWith("Produtos"), "navega e muda o título");
  ok(d.querySelector('.g-nav a[href="#/produtos"]').getAttribute("aria-current") === "page", "link ativo recebe aria-current");
  const inp = d.querySelector("[data-g-filter]"); inp.value = "mouse"; inp.dispatchEvent(new w.Event("input", { bubbles: true }));
  ok([...d.querySelectorAll(".g-product")].filter((x) => !x.hidden).length === 1, "<search target> filtra a lista");
  w.location.hash = "#/post/42"; await wait(30); ok(d.querySelector("[data-g-param=id]").textContent === "42", "rota dinâmica /post/:id → <param>");
  w.location.hash = "#/nada"; await wait(30); ok(vis() === "*", "rota inexistente mostra <notfound>");
  w.location.hash = "#/dashboard"; await wait(30); ok(d.querySelectorAll(".g-chart-svg").length === 3 && d.querySelectorAll(".g-metric").length === 4, "dashboard: 3 gráficos e 4 métricas");
  w.location.hash = "#/"; await wait(30);
  const acts = [...d.querySelectorAll("[data-g-action]")], inc = acts.find((x) => x.getAttribute("data-g-action") === "inc:n"), val = () => d.querySelector("[data-g-bind=n]").textContent;
  for (let i = 0; i < 5; i++) inc.click(); ok(val() === "5", "estado: inc ×5");
  const sh = [...d.querySelectorAll("[data-g-show]")].find((x) => x.getAttribute("data-g-show") === "n >= 5"); ok(sh.hidden === false, "<show when='n >= 5'> aparece");
  acts.find((x) => x.getAttribute("data-g-action") === "reset:n").click(); ok(val() === "0" && sh.hidden, "reset volta e esconde");
  const sw = d.querySelector("input[data-g-set=ativo]"); sw.checked = true; sw.dispatchEvent(new w.Event("input", { bubbles: true }));
  ok([...d.querySelectorAll("[data-g-show]")].find((x) => x.getAttribute("data-g-show") === "ativo").hidden === false, "<switch bind> liga bloco");
  const t0 = d.documentElement.getAttribute("data-theme"); d.querySelector("[data-g-theme]").click(); ok(d.documentElement.getAttribute("data-theme") !== t0, "alternar tema");
  w.GitmlToast("oi", "success"); ok(!!d.querySelector(".g-toast-success"), "toast");
  ({ w, d } = boot("#/dashboard")); ok(vis() === "/dashboard", "deep link #/dashboard");
  console.log(fail ? "FALHAS: " + fail : "RUNTIME OK"); process.exit(fail ? 1 : 0);
})();
