# Componentes GITML 0.1.2

> Gerado automaticamente por `node scripts/sync.js` — **169 componentes** (208 tags contando apelidos) e **82 ícones**.

## Estrutura

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<gitml>` `<page>` `<html>` | Raiz do documento (<gitml> ou <html>): theme, accent, font, lang, title | `theme` `accent` `font` `lang` `title` |
| `<body>` | Corpo do documento: class, style, id (aplicados ao <body> real) | `class` `style` `id` |
| `<title>` | Título da aba (use dentro de <head>) | — |
| `<base>` | Endereço base dos links (dentro de <head>): href | `href` |
| `<head>` `<meta>` | Metadados da página (title, description, icon) | `title` `description` `icon` `lang` |
| `<section>` | Seção com título opcional | `title` `subtitle` `eyebrow` `id` `bg` |
| `<container>` | Centraliza o conteúdo | `width` |

## Layout

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<grid>` | Grade responsiva | `cols` `gap` |
| `<row>` `<stack>` | Linha flexível (row) ou pilha vertical (stack) | `gap` `align` `justify` `wrap` |
| `<col>` | Coluna dentro de row (span) | `span` |
| `<split>` | Duas colunas: texto + mídia | `reverse` |
| `<bento>` | Grade estilo bento (Apple) | — |
| `<spacer>` | Espaço vertical | `size` |
| `<divider>` `<hr>` | Linha divisória com texto opcional | `text` |
| `<center>` | Centraliza conteúdo na horizontal | — |
| `<docs>` | Layout de documentação: <sidebar> + <content> | — |
| `<content>` | Área principal ao lado da sidebar | — |

## Navegação

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<nav>` `<navbar>` | Barra de navegação fixa com menu mobile | `brand` `logo` `sticky` |
| `<link>` | Link de texto | `href` |
| `<breadcrumb>` | Trilha: items="Início/Docs/API" | `items` |
| `<footer>` | Rodapé | `brand` |
| `<theme-toggle>` `<theme-switch>` | Botão claro/escuro (lembra a escolha) | — |
| `<sidebar>` | Menu lateral (docs) | `title` |
| `<dropdown>` `<menu>` | Menu suspenso: <dropdown label="Produtos"> links </dropdown> | `label` |
| `<toc>` | Sumário automático (h2/h3 da página) | `title` `target` |
| `<pagination>` | Paginação: pages="9" current="2" href="?p=" | `pages` `current` `href` |
| `<stepper>` | Etapas: steps="Conta,Plano,Pagamento" current="2" | `steps` `current` |
| `<backtotop>` | Botão flutuante 'voltar ao topo' | — |

## Destaque

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<hero>` | Cabeçalho principal impactante | `title` `subtitle` `eyebrow` `cta` `href` `cta2` `href2` `image` `variant` |

## Tipografia

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<grad>` `<gradient>` | Texto com degradê | — |
| `<h1>` `<h2>` `<h3>` `<h4>` | Títulos | `align` |
| `<p>` `<text>` | Parágrafo (aceita **negrito**, *itálico*, `código`, [link](url)) | `size` `muted` |
| `<quote>` `<blockquote>` | Citação | `author` |
| `<kbd>` | Tecla de atalho | — |
| `<mark>` | Texto marcado | — |
| `<ul>` `<list>` | Lista com ícones (icon=check) | `icon` |
| `<ol>` | Lista numerada | — |
| `<li>` `<item>` | Item de lista | — |
| `<code>` | Bloco de código com botão copiar | `lang` `title` |
| `<heading>` | Bloco de título: eyebrow, title, subtitle | `eyebrow` `title` `subtitle` `align` |
| `<lead>` | Parágrafo de destaque | — |
| `<small>` | Texto pequeno | — |
| `<typed>` | Texto que digita sozinho: words="rápido,bonito,moderno" | `words` |

## Ações

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<button>` `<btn>` | Botão: variant=primary\|outline\|ghost\|soft size=sm\|lg icon | `href` `variant` `size` `icon` `action` `target` |
| `<actions>` | Agrupa botões | `align` |

## Cards

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<card>` | Cartão: title, icon, image, href, variant=glass\|soft\|outline | `title` `icon` `image` `href` `variant` |
| `<feature>` | Recurso com ícone | `icon` `title` |
| `<stat>` | Número de destaque que conta ao aparecer: num, label, prefix, suffix | `num` `label` `prefix` `suffix` |
| `<pricing>` `<plan>` | Plano de preço | `tier` `price` `period` `featured` `cta` `href` |
| `<testimonial>` | Depoimento com avatar | `name` `role` `avatar` `rating` |
| `<avatar>` | Avatar com iniciais ou imagem | `name` `src` `size` |
| `<avatars>` | Grupo de avatares sobrepostos | — |
| `<team>` `<member>` | Membro da equipe | `name` `role` `src` |
| `<product>` | Produto: name, price, old, image, badge, rating, href, cta | `name` `price` `old` `image` `badge` `rating` `href` `cta` |
| `<post>` `<blog-card>` | Card de artigo: title, date, author, tag, image, href | `title` `date` `author` `tag` `image` `href` |

## Dados

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<table>` | Tabela: primeira linha vira cabeçalho | — |
| `<tr>` | Linha de tabela | — |
| `<td>` `<th>` | Célula | — |
| `<progress>` | Barra de progresso | `value` `label` |
| `<rating>` | Estrelas de avaliação | `value` |
| `<countdown>` | Contagem regressiva até to="2026-12-31" | `to` |
| `<metric>` `<kpi>` | Indicador: label, value, delta="+12%" | `label` `value` `delta` `icon` |
| `<dataset>` | Série de dados dentro de <chart>: label, values="5,10,15", color | `label` `values` `color` |
| `<chart>` | Gráfico SVG: type=bar\|line\|area\|donut\|pie data="Jan:10,Fev:30" ou <dataset values="5,10,15"> | `type` `data` `labels` `title` `height` |
| `<sparkline>` | Mini gráfico de linha: values="1,4,2,8" | `values` |

## Feedback

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<badge>` `<chip>` `<tag>` | Etiqueta: variant=primary\|success\|warning\|danger | `variant` |
| `<alert>` `<callout>` | Aviso: type=info\|success\|warning\|danger | `type` `title` |
| `<tooltip>` | Dica ao passar o mouse | `text` |
| `<banner>` `<announcement>` | Faixa de anúncio no topo | `href` |
| `<toast>` | Notificação flutuante: <toast trigger="Salvar" type="success">Salvo!</toast> | `trigger` `type` `message` |
| `<skeleton>` | Carregando (placeholder): lines, type=avatar\|card | `lines` `type` |
| `<spinner>` `<loading>` | Indicador de carregamento | `size` |
| `<empty>` | Estado vazio: icon, title | `icon` `title` |
| `<cookie>` | Aviso de cookies (lembra a escolha) | `button` |
| `<status>` | Ponto de status: type=online\|busy\|offline\|warning | `type` |

## Interativos

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<accordion>` `<faq>` | Pergunta expansível (title ou q) | `title` `q` `open` |
| `<tabs>` | Abas (contém <tab label>) | — |
| `<tab>` | Conteúdo de uma aba | `label` |
| `<modal>` | Janela modal aberta por botão | `trigger` `title` |
| `<carousel>` `<slider>` | Carrossel horizontal com rolagem | — |
| `<marquee>` `<logos>` | Faixa de logos/textos em movimento | — |
| `<drawer>` | Painel lateral: trigger, title, side=right\|left | `trigger` `title` `side` |
| `<copy>` | Botão que copia um texto: text="npm i gitml" | `text` `label` |

## Mídia

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<image>` `<img>` | Imagem arredondada | `src` `alt` `rounded` |
| `<video>` | Vídeo (arquivo ou YouTube) | `src` |
| `<map>` | Mapa do Google: q="São Paulo" | `q` |
| `<icon>` | Ícone embutido: name=zap\|star\|check\|x\|heart\|rocket… ou emoji | `name` `size` |
| `<browser>` | Moldura de navegador para screenshots | `url` |
| `<gallery>` | Galeria de imagens com zoom ao clicar | `cols` |
| `<audio>` | Player de áudio | `src` |
| `<embed>` `<iframe>` | Incorpora uma página https: src, height | `src` `height` `title` |
| `<figure>` | Imagem com legenda: src, caption | `src` `caption` `alt` |
| `<social>` | Ícones de redes: github, twitter, linkedin, instagram, youtube, facebook, mail, site | `github` `twitter` `linkedin` `instagram` `youtube` `facebook` `mail` `site` |

## Formulários

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<form>` | Formulário (action, method) | `action` `method` |
| `<input>` `<field>` | Campo: label, type, placeholder, name | `label` `type` `placeholder` `name` `required` |
| `<textarea>` | Texto longo | `label` `name` `placeholder` |
| `<select>` | Lista: options="A,B,C" | `label` `name` `options` |
| `<submit>` | Botão de enviar | — |
| `<newsletter>` | Captura de e-mail em linha | `placeholder` `button` `action` |
| `<checkbox>` | Caixa de seleção: label, name, checked, bind | `label` `name` `checked` `required` `bind` |
| `<switch>` `<toggle>` | Interruptor liga/desliga: label, name, checked, bind | `label` `name` `checked` `bind` |
| `<radio>` | Grupo de opções: label, name, options="A,B,C", value | `label` `name` `options` `value` |
| `<range>` `<slider-input>` | Controle deslizante: label, min, max, value, step, bind | `label` `name` `min` `max` `value` `step` `bind` |
| `<search>` | Busca; com target=".g-card" filtra os elementos ao digitar | `placeholder` `target` |
| `<upload>` `<file>` | Área de envio de arquivos: label, hint, accept, name, multiple | `label` `hint` `accept` `name` `multiple` |
| `<login>` | Formulário de login pronto: title, action, button | `title` `action` `button` |
| `<contact>` | Formulário de contato pronto: title, action, button | `title` `action` `button` |

## Seções

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<timeline>` | Linha do tempo vertical | — |
| `<step>` | Etapa da timeline | `title` `date` |
| `<cta>` | Chamada final para ação | `title` `button` `href` |

## App

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<route>` | Página do app (SPA): path="/sobre" title="Sobre" ou src="pages/sobre.gitml" | `path` `title` `src` |
| `<notfound>` `<404>` | Página 404 (quando nenhuma rota combina) | `title` |
| `<param>` | Mostra um parâmetro da rota: <param name="id"> (rota /post/:id) | `name` |
| `<include>` `<import>` | Importa outro arquivo .gitml: <include src="partes/menu.gitml"> | `src` |

## Estado

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<state>` | Variável reativa: <state name="n" value="0" persist> | `name` `value` `persist` |
| `<bind>` | Mostra o valor de um estado (ou use {$nome} em qualquer texto) | `name` |
| `<show>` | Mostra o conteúdo se a condição for verdadeira: when="aberto" \| "n > 3" \| "!ok" | `when` |
| `<trigger>` | Torna qualquer bloco clicável: do="toggle:menu" (inc, dec, set, toggle, reset) | `do` |
| `<each>` | Repete o conteúdo: <each items="A,B,C" as="x"> usa {{x}} e {{index}} | `items` `as` |
| `<if>` | Condição de compilação: <if value="{{x}}" is="pro"> | `value` `is` `not` |

## HTML

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<div>` | Elemento HTML <div> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<span>` | Elemento HTML <span> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<a>` | Elemento HTML <a> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<b>` | Elemento HTML <b> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<i>` | Elemento HTML <i> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<u>` | Elemento HTML <u> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<s>` | Elemento HTML <s> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<em>` | Elemento HTML <em> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<strong>` | Elemento HTML <strong> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<sub>` | Elemento HTML <sub> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<sup>` | Elemento HTML <sup> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<main>` | Elemento HTML <main> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<article>` | Elemento HTML <article> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<aside>` | Elemento HTML <aside> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<header>` | Elemento HTML <header> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<time>` | Elemento HTML <time> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<address>` | Elemento HTML <address> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<pre>` | Elemento HTML <pre> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<abbr>` | Elemento HTML <abbr> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<cite>` | Elemento HTML <cite> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<del>` | Elemento HTML <del> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<ins>` | Elemento HTML <ins> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<q>` | Elemento HTML <q> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<label>` | Elemento HTML <label> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<fieldset>` | Elemento HTML <fieldset> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<legend>` | Elemento HTML <legend> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<details>` | Elemento HTML <details> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<summary>` | Elemento HTML <summary> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<figcaption>` | Elemento HTML <figcaption> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<dl>` | Elemento HTML <dl> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<dt>` | Elemento HTML <dt> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<dd>` | Elemento HTML <dd> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<h5>` | Elemento HTML <h5> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<h6>` | Elemento HTML <h6> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<thead>` | Elemento HTML <thead> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<tbody>` | Elemento HTML <tbody> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<tfoot>` | Elemento HTML <tfoot> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<caption>` | Elemento HTML <caption> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<colgroup>` | Elemento HTML <colgroup> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<picture>` | Elemento HTML <picture> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<source>` | Elemento HTML <source> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<hgroup>` | Elemento HTML <hgroup> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<output>` | Elemento HTML <output> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<br>` | Elemento HTML <br> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |
| `<wbr>` | Elemento HTML <wbr> (atributos seguros: class, id, style, href, data-*…) | `class` `id` `style` |

## Avançado

| Tag | O que faz | Atributos |
| --- | --- | --- |
| `<style>` | CSS próprio (bruto) | — |
| `<script>` | JavaScript próprio (apenas se allowScripts) | — |
| `<define>` `<component>` | Cria seu componente: <define name="x"> usa {{attr}} e {{children}} | `name` |
| `<raw>` | HTML puro dentro do GITML | — |

## Ícones (`<icon name="…">`, `icon="…"`)

`zap` · `star` · `check` · `x` · `heart` · `rocket` · `shield` · `code` · `globe` · `mail` · `phone` · `user` · `users` · `chart` · `lock` · `cloud` · `layers` · `sparkles` · `arrow` · `play` · `github` · `cpu` · `book` · `clock` · `menu` · `sun` · `moon` · `copy` · `info` · `alert` · `map` · `cart` · `graduation` · `search` · `bell` · `home` · `sliders` · `eye` · `edit` · `trash` · `plus` · `minus` · `external` · `download` · `upload` · `calendar` · `image` · `file` · `send` · `tag` · `bookmark` · `share` · `trending` · `award` · `target` · `key` · `chevron-down` · `chevron-up` · `chevron-right` · `chevron-left` · `twitter` · `linkedin` · `instagram` · `youtube` · `facebook` · `check-circle` · `x-circle` · `database` · `terminal` · `smartphone` · `monitor` · `package` · `credit-card` · `link` · `log-in` · `log-out` · `filter` · `flag` · `briefcase` · `dollar` · `wifi` · `refresh`
