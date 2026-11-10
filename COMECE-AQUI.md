# Comece aqui

Tudo do GITML está nesta pasta: **motor**, **CLI** e **extensão do VS Code**.
Precisa só do [Node.js](https://nodejs.org) 16 ou mais novo.

## 1. Extensão do VS Code (recomendado)

1. VS Code → **Extensions** (`Ctrl+Shift+X`) → `⋯` → escolha `gitml-0.4.2.

2. Para ver o site no navegador: botão 🌐 

gitml start ou

 gbitml start  "index.gitml

gitml serve 3000  ou 

gitml serve 3000   loja.gitml


## 2. CLI sem extensão

npm install gitml

Dentro de qualquer .gitml para abrir o site roda:

 gitml start ou

 gbitml start  "index.gitml

gitml serve 3000  ou 

gitml serve 3000   loja.gitml




## 3. Sites prontos para testar

```bash
cd sites-de-teste/orbit-site   &&   gitml start     # SaaS com rotas, estado e gráficos
gitml start loja.gitml                              # loja Nativa (na raiz)
gitml start index.gitml                             # TelaPlay (na raiz)
```

## cria  seu projeto 

gitml new name-project


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



