# Comece aqui

Tudo do GITML está nesta pasta: **motor**, **CLI** e **extensão do VS Code**.
Precisa só do [Node.js](https://nodejs.org) 16 ou mais novo.

## 1. Extensão do VS Code (recomendado)

1. VS Code → **Extensions** (`Ctrl+Shift+X`) → `⋯` → **Install from VSIX…** → escolha `gitml-0.4.2.vsix` (está nesta pasta).
2. **Developer: Reload Window** (`Ctrl+Shift+P`).
3. Abra um arquivo `.gitml`: você tem cores, autocompletar, erros ao vivo e o ícone.
4. Para ver o site no navegador: botão 🌐 no topo do editor (ou `Ctrl+Alt+B`).
5. Abra um terminal **novo** no VS Code e use `gitml start` (a extensão instala o comando `gitml` nele).

## 2. CLI sem extensão

Dentro de qualquer pasta de site:

```bash
node CAMINHO/DESTA/PASTA/bin/gitml.js start        # abre http://localhost:4173
node CAMINHO/DESTA/PASTA/bin/gitml.js new meu-site # cria um projeto
```

Para digitar só `gitml ...`: rode `npm link` nesta pasta (ou adicione a pasta `bin` ao PATH do Windows).
Confira com `gitml --version` — deve mostrar **0.1.2**. Se mostrar outro número, há um `gitml` antigo no PATH
(`type -a gitml` no Git Bash, `Get-Command gitml -All` no PowerShell).

## 3. Sites prontos para testar

```bash
cd sites-de-teste/orbit-site   &&   gitml start     # SaaS com rotas, estado e gráficos
gitml start loja.gitml                              # loja Nativa (na raiz)
gitml start index.gitml                             # TelaPlay (na raiz)
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `gitml start [arquivo\|pasta\|porta]` | sobe o servidor e **abre o navegador** |
| `gitml serve [porta]` | só o servidor (`gitml serve 3000`) |
| `gitml new <nome>` | cria um projeto |
| `gitml check [arquivos]` | procura erros |
| `gitml build [arquivo]` | gera `dist/` |
| `gitml fmt <arquivo>` | formata |
| `gitml components` | lista os componentes |

## Quer mexer no motor ou na extensão?

- O motor é **um só**: `gitml.js`. Edite ele e pronto — o CLI já usa a mudança.
- Para atualizar a extensão com o motor novo: `npm run vsix` (gera um `gitml-<versão>.vsix` novo aqui).
- `npm test` roda os testes.
- Mais detalhes: `README.md` (linguagem inteira) e `docs/COMPONENTES.md` (todos os componentes).
