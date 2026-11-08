# Changelog

## 0.1.2 — motor
- **Navegadores mais antigos** (Chrome < 111, Safari < 16.2, Firefox < 113): `--g-accent` e `--g-soft` agora têm cor fixa de reserva; antes, sem `color-mix()`, a barra de progresso ficava sem preenchimento e uma fatia do gráfico de rosca ficava preta.
- `<marquee>`: espaçamento entre as repetições do texto.
- Novo exemplo `sites-de-teste/orbit-site` (documento completo, rotas, includes, estado, gráficos).
- **Pasta única, motor único:** motor, CLI, extensão (fonte + `.vsix` pronto) e sites de teste na mesma pasta. A extensão deixou de ter uma segunda cópia do `gitml.js`; `npm run vsix` monta o pacote.

## Extensão 0.4.0
- **Comando `gitml` no terminal do VS Code**: instalado pela extensão em todo terminal novo (`gitml start`, `gitml serve 3000`, `gitml new site`, `gitml check`…). Funciona no PowerShell, cmd e Git Bash (precisa do Node instalado).
- Comando *GITML: Iniciar servidor no terminal*: abre um terminal já rodando `gitml start` na pasta certa.
- Os HTML de exemplo (`index.html`, `site.html`, `project.html`) mostram um aviso legível se o `gitml.js` não for encontrado (antes: tela branca só com o título, ex.: `npx serve .` na pasta errada).
- Gráficos: degradê das barras mais suave.

## 0.1.1 — motor · extensão 0.3.0
**Abrir no navegador**
- Servidor local novo (`server.js`), usado pela CLI **e** pela extensão: `.gitml` abre como página (não baixa), serve a pasta, recarrega ao salvar, usa o `gitml.js` local mesmo se o HTML apontar para a CDN. Escuta só em `127.0.0.1` (use `--lan` para liberar a rede).
- CLI: `gitml start [arquivo|pasta|porta]`, `gitml serve [porta]`.
- Extensão: *GITML: Abrir no navegador* funciona com `.gitml` **e** `.html` com GITML, abre o arquivo certo, mostra o servidor na barra de status e o encerra ao fechar.
- `viewer.html?src=arquivo.gitml` para servidores estáticos (`npx serve`, `python -m http.server`).
- O motor busca `.gitml` com `?raw=1`; `?src=` tem prioridade sobre o `<script type="text/gitml">`, que tem prioridade sobre `data-src`.
- **Nunca mais tela branca:** painel explicativo para `file://`, arquivo inexistente e erro de compilação; modelos mostram "Carregando GITML…" e avisam se o `gitml.js` faltar; a 1ª rota fica visível mesmo se o JS falhar.

**Documento completo**
- `<html>`, `<head>` (`title`, `meta`, `link rel`, `style`, `script`, `base`), `<body>` (`class`, `style`), `<!DOCTYPE>`; `<main>`, `<div>`… (`html` deixou de ser apelido de `<raw>`).

**Editor**
- GITML dentro de `<script type="text/gitml">` em arquivos `.html`: **realce**, autocompletar, hover, erros na linha certa e fechamento de tag.
- Snippets `gitml-html`, `gitml-inline` e `html` (documento completo).

**Corrigido**
- `rating="4.8"` (decimal) derrubava a página inteira; agora, se um componente falhar, só ele é isolado com um aviso.
- `<!doctype html>` no início do `.gitml` aparecia como texto.
- `pad="md"`, `mt="sm"`, `width="small"` (tamanhos nomeados) geravam CSS inválido.
- `gitml build` sobrescrevia o `index.html` ao lado do `index.gitml`; agora grava em `dist/` e nunca sobrescreve um `.html` que não seja do GITML.
- Servidor da CLI escutava em todas as interfaces.
- Novo: `<chart><dataset label values color/></chart>`.

## 0.1.0 — motor
**Novo**
- **Rotas** (`route`, `notfound`, `param`, `<route src>`), **estado reativo** (`state`, `bind`, `show`, `trigger`, `{$x}`, `action=`), **includes** (`<include>`), `each` e `if`.
- 49 componentes novos: `chart` (bar/line/area/donut/pie), `sparkline`, `metric`, `product`, `post`, `dropdown`, `drawer`, `toast`, `toc`, `pagination`, `stepper`, `sidebar`/`docs`, `gallery`, `search` (filtra a lista), `switch`, `range`, `radio`, `checkbox`, `upload`, `login`, `contact`, `skeleton`, `spinner`, `empty`, `cookie`, `status`, `typed`, `social`, `copy`, `audio`, `embed`, `figure`, `backtotop`…
- **45 tags HTML** aceitas diretamente (`div`, `span`, `a`, `details`, `dl`…), com atributos seguros.
- 82 ícones (eram 33). Fontes: `poppins`, `jakarta`, `geist`, `mono` ou qualquer fonte do Google Fonts.
- `theme="auto"` (segue o sistema), tema lembrado ao alternar, `radius`, `container`, `og-image`, `canonical`, `theme-color`, favicon por emoji.
- Visual padrão **dark + violeta**. Tela de erros/avisos na página em `localhost`.
- CLI: `new`, `dev` (live reload), `build --out`, `check`, `fmt`, `components --md`.
- Formatador (`gitml.format`) e `scripts/sync.js` (gramática/snippets/docs gerados do motor).

**Corrigido**
- `</progress>`, `</image>`, `</input>`… geravam erro de "fechado sem abrir".
- `gap="24"` era ignorado (sem `px`) e `<grid gap>` gerava dois atributos `style`.
- `<stat suffix prefix>` ignorava prefixo/sufixo.
- Tag não fechada no meio do documento passava sem erro; agora é reportada.
- `examples/landing.gitml`: `<stat>` sem `/>` aninhava os 4 números dentro do primeiro (só 1 aparecia).
- Segurança: `java⏎script:` burlava o filtro; `<raw>` aceitava `onerror=`/`<script>`; `data:text/html` em links.
- A página montada pelo `gitml.js` não usa mais `document.write`.
- `<header><nav sticky>` não grudava no topo.

## 0.0.1
- Primeira versão: ~70 componentes, runtime, CLI básica e extensão do VS Code.
