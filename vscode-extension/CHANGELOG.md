# Changelog

## 0.4.2
- Um único motor: a extensão usa o `gitml.js` do pacote (sem segunda cópia para manter).

## 0.4.1
- Motor atualizado para a versão 0.1.2 (igual ao CLI avulso): cores de reserva para navegadores sem `color-mix()` e espaçamento do `<marquee>`.

## 0.4.0
- Comando **`gitml`** disponível nos terminais do VS Code (`gitml start`, `gitml serve 3000`, `gitml new`, `gitml check`, `gitml build`).
- *GITML: Iniciar servidor no terminal*.

## 0.3.0
- **Abrir no navegador (localhost)** de verdade: servidor local com recarga automática, para `.gitml` e `.html` com GITML (antes o navegador baixava o arquivo ou mostrava a tela em branco). Botão 🌐, `Ctrl+Alt+B`, item na barra de status e *Parar servidor local*.
- Realce, autocompletar, hover, diagnósticos (na linha certa) e fechamento de tag **dentro de `<script type="text/gitml">`** em arquivos HTML.
- Suporte a `<html>`, `<head>`, `<body>`, `<title>`, `<meta>` e `<link rel>`; `<link>`/`<meta>` não fecham sozinhos dentro de `<head>`.
- *Gerar HTML* grava em `dist/` e pergunta antes de sobrescrever um `.html` que não seja do GITML.
- Snippets `gitml-html`, `gitml-inline` e `html`.

## 0.2.0
- **Corrigido:** ícone do `.gitml` não aparecia — o `iconPath` do tema apontava para `icons/icons/…` (caminho é relativo ao arquivo do tema). Agora também é declarado como ícone da *linguagem*.
- Ícone próprio da extensão (`icon.png`) e ícone de arquivo recortado para ficar legível em 16 px.
- Autocompletar (tags, atributos, valores, ícones, estados), hover, formatador, fechamento automático de tag.
- Gramática e snippets gerados a partir do motor (`node scripts/sync.js`): cobrem todas as tags novas.
- Prévia reutiliza o painel, resolve `<include>`/`<route src>` e respeita pasta confiável.
- Novos comandos: *Abrir no navegador* e *Explorar e inserir componentes*.

## 0.1.2
- Ícone de arquivo, diagnósticos, catálogo de componentes.
