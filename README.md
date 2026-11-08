 
<p align="center">
  <img src="assets/gitml-logo.png" alt="GITML Logo" width="180">
</p>

<h1 align="center">GITML</h1>

<p align="center">
  <strong>Crie sites modernos com GITML puro.</strong><br>
  HTML semântico, componentes declarativos, CLI e extensão para VS Code.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/gitml">
    <img src="https://img.shields.io/npm/v/gitml?color=blue&logo=npm&label=npm" alt="NPM Version">
  </a>
  <a href="https://www.npmjs.com/package/gitml">
    <img src="https://img.shields.io/npm/dm/gitml?color=blue&logo=npm&label=downloads" alt="NPM Downloads">
  </a>
  <a href="https://github.com/Gislaine-web3/gitml-language-NPM">
    <img src="https://img.shields.io/github/stars/Gislaine-web3/gitml-language-NPM?style=flat&color=yellow&logo=github" alt="GitHub Stars">
  </a>
  <a href="https://github.com/Gislaine-web3/gitml-language-NPM/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Gislaine-web3/gitml-language-NPM?color=green" alt="License">
  </a>
</p>

<p align="center">
  <a href="https://github.com/Gislaine-web3/gitml-language-NPM">
    GitHub
  </a>
  ·
  <a href="https://www.npmjs.com/package/gitml">
    NPM
  </a>
  ·
  <a href="https://marketplace.visualstudio.com/">
    VS Code
  </a>
</p>

---





# GITML 0.1.1

**GITML** é uma linguagem de marcação declarativa para criar páginas e pequenos apps web modernos com componentes prontos. Você escreve `.gitml`; o motor entrega HTML, CSS e JavaScript de navegador — **sem build, sem dependências**.

- **124 componentes GITML** (hero, grid, cards, tabs, gráficos, formulários, tabelas…) **+ 45 tags HTML** aceitas como estão (`div`, `span`, `a`, `details`…) → HTML e GITML se misturam.
- **Rotas** (`<route path="/sobre">`), **estado reativo** (`<state>`, `{$n}`, `action="inc:n"`) e **arquivos importáveis** (`<include>`), sem escrever JavaScript.
- Funciona **dentro do HTML** *e* **fora dele** (CLI, Node, VS Code).
- Visual padrão: tema escuro, destaque violeta, grade e brilho no topo — `theme="light|dark|auto"`.

> **Escopo, com honestidade:** o GITML roda no navegador (SPA com rotas por `#/caminho`). Não faz SSR/hidratação, não tem ecossistema npm de componentes, e não substitui React/Next em apps grandes. Para sites, landing pages, painéis, documentação e protótipos ele dispensa HTML/CSS/JS; para o resto, pode ser usado como formato de autoria junto com eles.

---

## Comece em 1 minuto

### Fora do HTML (CLI)

```bash
node bin/gitml.js new meu-site      # cria o projeto (rotas, componentes, páginas)
cd meu-site
node ../bin/gitml.js dev            # http://localhost:4173 — recarrega ao salvar
```

Para usar o comando `gitml` em qualquer pasta: `npm link` dentro desta pasta.

| Comando | O que faz |
| --- | --- |
| `gitml new <nome>` | cria um projeto novo |
| `gitml start [arquivo\|pasta\|porta]` | **abre o site no navegador** em `http://localhost:4173` (recarrega ao salvar) |
| `gitml serve [porta]` | igual, sem abrir o navegador — ex.: `gitml serve 3000` |
| `gitml dev [arquivo\|pasta]` | igual ao `serve`, com `--port 3000 --open --lan` |
| `gitml build [arquivo]` | gera `dist/arquivo.html` (nunca sobrescreve um `.html` seu); com `--out pasta` gera o site pronto para publicar |
| `gitml check [arquivos]` | procura erros e avisos (saída 1 se houver erro — bom para CI) |
| `gitml fmt <arquivo> [--write]` | formata o código |
| `gitml components [--md\|--json]` | lista os componentes |

### Abrir no navegador (localhost) — e por que `npx serve` não basta

Um arquivo `.gitml` **não é uma página**: o navegador não sabe o que fazer com ele. Servidores estáticos comuns (`npx serve`, `python -m http.server`) entregam o `.gitml` como arquivo qualquer → o navegador **baixa** ou mostra o código. Quem transforma o `.gitml` em site é o motor do GITML. Três jeitos de abrir, todos testados:

| Jeito | Como | Funciona com |
| --- | --- | --- |
| **VS Code** | botão 🌐 no topo do editor, `Ctrl+Alt+B` ou *GITML: Abrir no navegador* | `.gitml` **e** `.html` com GITML |
| **Terminal do VS Code** | `gitml start` · `gitml serve 3000` — o comando `gitml` é instalado **pela extensão** em todo terminal novo | `.gitml` puro, HTML com GITML, `<include>`, rotas |
| **Terminal (CLI)** | `node bin/gitml.js start` (ou `npm link` para ter `gitml` em qualquer lugar) | idem |
| **Servidor estático** (`npx serve`, `python -m http.server`, Live Server) | abra um **`.html`** que carrega o `gitml.js`, ou `viewer.html?src=index.gitml` | qualquer servidor |

O `gitml start`/`serve` abre `.gitml` direto (`http://localhost:4173/index.gitml`), serve a pasta toda, recarrega a aba ao salvar e usa sempre o `gitml.js` local (mesmo que o seu HTML aponte para a CDN).

**Tela branca?** Quase sempre é um destes:
1. O arquivo foi aberto por `file://` (duplo clique) — use um dos jeitos acima; a página agora mostra um painel explicando isso.
2. **O `gitml.js` não está na pasta servida** — é o caso clássico de `npx serve .` rodado na pasta errada (por exemplo, na pasta de cima): o navegador mostra o `<title>` da página, mas o corpo fica vazio, porque o `npx serve` não conhece o GITML e o `gitml.js` não foi encontrado. Com `gitml start` isso não acontece (o servidor entrega o motor sozinho). Nos HTML do projeto e nos modelos (`gitml new`, snippets `gitml-html`) agora aparece um cartão explicando o problema em vez de uma página em branco.
3. Você rodou o servidor na pasta errada (confira o endereço `localhost:PORTA/` e a pasta do terminal).
4. Abra o Console (`F12`) — erros do GITML aparecem com `[GITML]` e, em `localhost`, num painel no canto da página.

### Documento HTML completo em `.gitml`

`<html>`, `<head>`, `<body>`, `<main>`, `<div>`… funcionam como em HTML. Tudo do `<head>` (`title`, `meta`, `link rel`, `style`, `script`, `base`) vai para o `<head>` real; `class`/`style` do `<body>` vão para o `<body>` real.

```gitml
<!DOCTYPE html>
<html lang="pt-BR" theme="dark" accent="violet" font="space-grotesk">
  <head>
    <title>Meu site</title>
    <meta name="description" content="Descrição">
    <link rel="icon" href="favicon.png">
    <style>.destaque { color: gold }</style>
  </head>
  <body class="minha-classe">
    <nav brand="Meu site" sticky><link href="#sobre">Sobre</link><theme-toggle /></nav>
    <main>
      <hero title="Olá, **mundo!**"></hero>
      <div class="destaque">HTML puro também vale</div>
    </main>
  </body>
</html>
```

### Dentro do HTML

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <script src="./gitml.js" data-src="index.gitml"></script>   <!-- lê um arquivo .gitml -->
</head>
<body></body>
</html>
```

ou escreva o GITML na própria página:

```html
<script src="./gitml.js"></script>
<script type="text/gitml">
  <gitml theme="dark" accent="violet" title="Meu projeto">
    <hero title="Olá, **mundo!**" subtitle="Feito com GITML." cta="Começar" href="#"></hero>
  </gitml>
</script>
```

> Para buscar arquivos `.gitml` (`data-src`, `<include>`, `<route src>`) abra a página por um servidor (`gitml dev`, `python -m http.server`…), não por `file://`.

### Pela API (Node)

```js
const gitml = require("./gitml.js");
const out = gitml.compile(source, { allowScripts: false, resolve, file });
out.html; out.errors; out.warnings;   // documento completo, erros, avisos
gitml.format(source);                  // formatador
gitml.components();                    // catálogo
```

---

## Apps com várias páginas (estilo Next/React)

```gitml
<gitml theme="dark" accent="violet" title="Meu app">
  <include src="components/menu.gitml" />          <!-- menu e rodapé fora das rotas = layout -->

  <route path="/" title="Início">
    <hero title="Olá" subtitle="Um app em GITML"></hero>
  </route>

  <route path="/produtos" title="Produtos" src="pages/produtos.gitml" />   <!-- como a pasta pages/ -->
  <route path="/post/:id" title="Post">Post <param name="id" /></route>     <!-- rota dinâmica -->
  <notfound><empty title="404 — não encontrada" /></notfound>

  <include src="components/rodape.gitml" />
</gitml>
```

Links como `<link href="/produtos">` funcionam sozinhos (`#/produtos`), o link da página atual recebe `aria-current`, o título da aba muda por rota e links diretos (`#/dashboard`) abrem na página certa.

## Estado reativo sem JavaScript

```gitml
<state name="n" value="0" persist />          <!-- persist guarda no navegador -->
<p>Contador: {$n}</p>
<button action="inc:n">+1</button>
<button action="reset:n" variant="ghost">Zerar</button>
<show when="n >= 5"><alert type="success" title="Passou de 5!"></alert></show>
<switch label="Avançado" bind="ativo" />      <!-- bind liga o controle ao estado -->
<range label="Volume" bind="vol" />  <p>{$vol}</p>
```

Ações: `inc:n`, `dec:n`, `set:n=10`, `toggle:aberto`, `reset:n` (separe várias com `;`). Condições de `show`: `ativo`, `!ativo`, `n > 3`, `plano == "pro"`. Em JavaScript: `GitmlState.get/set`, `GitmlToast("mensagem")`.

## Repetição, componentes próprios e includes

```gitml
<each items="Rápido,Moderno,Completo" as="x">
  <feature icon="sparkles" title="{{x}}">Item {{index}}</feature>
</each>

<define name="aviso">
  <alert type="success" title="{{titulo}}">{{children}}</alert>
</define>
<aviso titulo="Tudo certo">Compilou.</aviso>
```

`<if value="{{x}}" is="pro">…</if>` decide em tempo de compilação. `<style>` aceita CSS próprio; `<script>` só roda com `allowScripts` (o navegador e a CLI ligam; o `compile()` da API vem desligado).

## Os componentes

A lista completa, gerada do código, está em **[docs/COMPONENTES.md](docs/COMPONENTES.md)** (ou `gitml components`). Resumo por grupo:

| Grupo | Exemplos |
| --- | --- |
| Estrutura / Layout | `gitml` `section` `container` `grid` `row` `stack` `split` `bento` `center` `docs` `sidebar` `spacer` `divider` |
| Navegação | `nav` `link` `breadcrumb` `footer` `dropdown` `toc` `pagination` `stepper` `backtotop` `theme-toggle` |
| Destaque / Tipografia | `hero` `heading` `h1`–`h4` `p` `lead` `grad` `typed` `quote` `kbd` `mark` `ul` `ol` `code` |
| Cards e dados | `card` `feature` `stat` `metric` `pricing` `testimonial` `product` `post` `team` `table` `progress` `rating` `countdown` |
| Gráficos (SVG) | `chart` (`bar` `line` `area` `donut` `pie`) `sparkline` |
| Feedback | `badge` `alert` `toast` `tooltip` `banner` `skeleton` `spinner` `empty` `cookie` `status` |
| Interativos | `accordion` `tabs` `modal` `drawer` `carousel` `marquee` `gallery` `copy` |
| Formulários | `form` `input` `textarea` `select` `checkbox` `radio` `switch` `range` `search` `upload` `newsletter` `login` `contact` |
| Mídia | `image` `figure` `video` `audio` `map` `embed` `browser` `icon` (82 ícones) `social` |
| App / Estado | `route` `notfound` `param` `include` `state` `bind` `show` `trigger` `each` `if` |
| HTML puro | `div` `span` `a` `b` `i` `em` `strong` `header` `main` `article` `aside` `details` `dl` … |

Atributos de layout aceitos em qualquer componente: `class` `id` `style` `bg` `color` `pad` `gap` `width` `mt` `mb` `radius` `shadow` `hide="mobile|tablet|desktop"` `animate="up|fade|zoom"` `align`.

Atributos da raiz `<gitml>`: `theme` (`dark` · `light` · `auto`), `accent` (`violet blue green orange pink red teal black` ou `#hex`), `font` (`space-grotesk inter sora manrope outfit dm-sans serif poppins jakarta geist mono` ou qualquer fonte do Google Fonts), `title`, `description`, `icon` (URL ou emoji), `lang`, `radius`, `container`, `og-image`, `canonical`, `theme-color`, `motion="off"`.

---

## VS Code

Instale `gitml-0.4.2.vsix` (na raiz desta pasta: **Extensions → ⋯ → Install from VSIX…**) e recarregue a janela. A extensão traz:

- **ícone** do `.gitml` no Explorer, nas abas e no Ctrl+P (declarado como ícone da *linguagem*, funciona com o tema de ícones padrão);
- realce de sintaxe (CSS e JS dentro de `<style>`/`<script>`), **autocompletar** de tags, atributos, valores e ícones, **hover** com documentação;
- **erros e avisos** ao vivo (com "você quis dizer `<hero>`?"), **formatador**, fechamento automático de tags, snippets;
- **prévia ao vivo** (`Ctrl+Alt+G`), *Abrir no navegador*, *Gerar HTML* e *Explorar e inserir componentes*.

Se o ícone não aparecer: **Developer: Reload Window**; se usar Material Icon Theme (ou outro que ignore ícones de linguagem), escolha **Preferences: File Icon Theme → GITML File Icons**.

Para gerar um `.vsix` novo: `npm run vsix` — regenera gramática e snippets, copia o motor único para um pacote temporário e grava `gitml-<versão>.vsix` na raiz.

## Desenvolvimento

```bash
node test/run.js            # 50+ testes (motor, segurança, CLI, extensão)
node test/runtime.test.js   # comportamento no navegador (precisa: npm i -D jsdom)
node scripts/sync.js        # regenera gramática, snippets e docs a partir do motor
node test/extension.test.js # extensão do VS Code (com um "vscode" simulado)
```

### Mapa da pasta (um único motor)

| Caminho | O que é |
| --- | --- |
| `gitml.js` | **o motor** (compilador + runtime). Existe uma só cópia: a extensão e o CLI usam este arquivo |
| `server.js` | servidor local (`gitml start` / `serve`, botão 🌐 da extensão) |
| `bin/` | o comando `gitml` (`gitml.js` + atalhos `gitml` e `gitml.cmd`) |
| `gitml-0.4.2.vsix` | a extensão do VS Code, pronta para instalar |
| `vscode-extension/` | código-fonte da extensão (sem cópia do motor; o `npm run vsix` o inclui no pacote) |
| `examples/` · `sites-de-teste/` | exemplos e sites completos (Orbit, etc.) |
| `index.gitml` · `loja.gitml` · `pagina.gitml` · `projeto.gitml` | páginas de teste |
| `playground/` · `docs/` · `scripts/` · `test/` · `assets/` | editor local, documentação gerada, scripts, testes, logos |

## Segurança

Textos e URLs são escapados; `javascript:`, `vbscript:` e `data:` perigosos são bloqueados (inclusive disfarçados com tab/quebra de linha); `on*=` é removido em HTML puro e em `<raw>`; `<script>`/`<raw><script>` só com `allowScripts`. Mesmo assim, não compile conteúdo de terceiros com `allowScripts: true`, e revise formulários, links e scripts antes de publicar.

## Licença

MIT. Consulte `LICENSE`.
