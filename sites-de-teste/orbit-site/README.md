# Orbit — site de teste em GITML

Site de demonstração (SaaS fictício) para testar o GITML: documento completo
(`<html><head><body>`), várias páginas com rotas, páginas em arquivos separados,
rota dinâmica, estado reativo, gráficos, formulário e tema claro/escuro.

## Como abrir

```bash
gitml start              # abre em http://localhost:4173
gitml serve 3000         # ou na porta 3000
```

Sem o comando `gitml`? Qualquer um destes também funciona:

```bash
node caminho/para/gitml-cli/bin/gitml.js start
npx serve .              # abre o index.html (que carrega o index.gitml)
```

## Estrutura

| Arquivo | O que é |
| --- | --- |
| `index.gitml` | página inicial + rotas + `<head>` + `<body>` |
| `components/menu.gitml`, `rodape.gitml` | menu e rodapé reutilizáveis (`<include>`) |
| `pages/painel.gitml` | dashboard: métricas, gráficos, tabela, estado (Semana/Mês/Ano) |
| `pages/precos.gitml` | planos com chave mensal/anual (estado salvo no navegador) |
| `pages/contato.gitml` | formulário, cartões e painel lateral (`<drawer>`) |
| `index.html` + `gitml.js` | modo "dentro do HTML" para servidores estáticos |

## Teste você mesmo

1. Abra `/#/painel` e clique em **Mês** e **Ano**: o gráfico troca sozinho.
2. Em **Preços**, ligue "Cobrança anual": os valores mudam (e ficam lembrados).
3. Abra `/#/blog/qualquer-coisa`: o texto vira o parâmetro da rota.
4. Abra `/#/xyz`: página 404.
5. Edite qualquer texto em `index.gitml` e salve: a aba recarrega sozinha.
