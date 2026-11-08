# GITML para VS Code

Suporte completo à linguagem **GITML** (`.gitml`): páginas modernas sem escrever HTML nem CSS.

## O que a extensão faz

- **Comando `gitml` no terminal**: depois de instalar, abra um terminal NOVO no VS Code e digite `gitml start` (abre o site no navegador), `gitml serve 3000`, `gitml new meu-site`, `gitml check`
- **Abrir no navegador** (`Ctrl+Alt+B` ou botão 🌐): sobe um servidor local e abre o site em `http://localhost:4173` — funciona com `.gitml` **e** com `.html` que usa GITML
- **GITML dentro do HTML**: realce, autocompletar, hover e erros também dentro de `<script type="text/gitml">`
- **Ícone** nos arquivos `.gitml` (Explorer, abas e Ctrl+P)
- **Realce de sintaxe** de todas as tags, atributos, `{{variáveis}}` e `{$estado}`; CSS e JS dentro de `<style>`/`<script>`
- **Autocompletar**: tags, atributos, valores (`variant`, `theme`, `accent`, ícones…) e nomes de estado
- **Hover** com a documentação de cada componente
- **Erros e avisos ao vivo** (tag não fechada, tag desconhecida com sugestão "você quis dizer…")
- **Prévia ao vivo** ao lado do código — `Ctrl+Alt+G` (inclui `<include>` e `<route src>`)
- **Formatar documento** (`Shift+Alt+F`)
- **Fecha a tag sozinha** ao digitar `>`
- **Snippets** de todos os componentes + esqueletos (`gitml`, `app`, `define`, `contador`…)
- Comandos: *Abrir no navegador*, *Abrir prévia*, *Gerar HTML* (grava em `dist/`, sem sobrescrever seus `.html`), *Explorar e inserir componentes*, *Iniciar servidor no terminal*, *Parar servidor local*

## Ícone não aparece?

O ícone vem junto com a linguagem e funciona com o tema de ícones padrão. Se mesmo assim não aparecer:

1. Recarregue a janela: `Ctrl+Shift+P` → **Developer: Reload Window**.
2. Veja se o arquivo termina em `.gitml` (rodapé do VS Code deve mostrar **GITML**).
3. Alguns temas de ícones (Material Icon Theme, etc.) ignoram o ícone da linguagem. Nesse caso, escolha
   `Ctrl+Shift+P` → **Preferences: File Icon Theme** → **GITML File Icons** (esse tema só define o ícone do `.gitml`).

## Configurações

| Opção | Padrão | O que faz |
| --- | --- | --- |
| `gitml.diagnostics.enable` | `true` | erros e avisos no editor |
| `gitml.autoCloseTags` | `true` | fecha a tag ao digitar `>` |
| `gitml.server.port` | `4173` | porta inicial do servidor local |
| `gitml.preview.allowScripts` | `true` | permite `<script>` do arquivo na prévia (só em pastas confiáveis) |

MIT · https://github.com/Gislaine-web3/gitml-extension-src
