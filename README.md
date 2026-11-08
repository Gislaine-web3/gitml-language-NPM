
 
# GITML — Linguagem de Marcação para Interfaces Web

**Crie sites modernos usando uma sintaxe simples, componentes declarativos e HTML semântico.**

GITML é uma linguagem de marcação criada para facilitar o desenvolvimento de interfaces web. Ela combina elementos familiares do HTML5 com componentes próprios, recursos declarativos, estados reativos e ferramentas para acelerar a criação de páginas.

Com GITML, você pode construir landing pages, dashboards, lojas virtuais, portfólios, sites institucionais e interfaces modernas sem precisar escrever JavaScript para cada interação visual.

---

## ✨ Principais recursos

- **HTML semântico:** suporte a `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `figure` e outros elementos.
- **Componentes prontos:** cards, botões, badges, métricas, tabelas, gráficos e muito mais.
- **Navegação:** links, menus, dropdowns, abas e navegação por âncoras.
- **Interatividade declarativa:** estados, ações, formulários, notificações e componentes interativos.
- **Design:** temas, cores, fontes, espaçamentos, animações e variantes visuais.
- **Responsividade:** grades e layouts adaptáveis.
- **Gráficos e dados:** charts, sparklines, métricas e indicadores.
- **Acessibilidade:** estrutura semântica, textos alternativos e identificação de campos.
- **VS Code:** autocompletar, documentação de componentes, hover, diagnósticos e prévia.
- **CLI:** execução e visualização local dos projetos.

## 📦 Estrutura de um projeto

Um projeto GITML pode ser organizado assim:

```text
meu-projeto/
├── index.gitml
├── pages/
│   ├── sobre.gitml
│   └── contato.gitml
├── assets/
│   ├── images/
│   └── icons/
└── README.md
```

## 🚀 Primeiro projeto

Crie um arquivo chamado `index.gitml`:

```html
<gitml
  theme="dark"
  accent="violet"
  font="inter"
  title="Meu primeiro site GITML"
  description="Criado com GITML">

  <head lang="pt-BR" />

  <body>
    <header>
      <nav brand="Meu Site">
        <link href="#inicio">Início</link>
        <link href="#sobre">Sobre</link>
        <link href="#contato">Contato</link>
      </nav>
    </header>

    <main id="inicio">
      <hero
        eyebrow="MEU PRIMEIRO PROJETO"
        title="Bem-vindo ao GITML"
        subtitle="Crie interfaces modernas usando componentes declarativos."
        cta="Conhecer" href="#sobre" />

      <section id="sobre"
        title="Simples de construir"
        subtitle="Use componentes prontos para desenvolver suas páginas.">

        <grid cols="3" gap="20">
          <card title="Componentes" icon="layers">
            Utilize elementos prontos para construir interfaces.
          </card>

          <card title="Design" icon="palette">
            Personalize cores, temas, fontes e layouts.
          </card>

          <card title="Interatividade" icon="zap">
            Trabalhe com estados e ações declarativas.
          </card>
        </grid>
      </section>

      <section id="contato" title="Entre em contato">
        <button href="#inicio" variant="primary">
          Voltar ao início
        </button>
      </section>
    </main>

    <footer>
      <p>Desenvolvido com GITML.</p>
    </footer>
  </body>
</gitml>
```

## 🧱 HTML semântico

GITML permite combinar componentes próprios com elementos tradicionais do HTML5.

| Elemento | Utilização |
|---|---|
| `head` | Metadados do documento |
| `body` | Conteúdo da página |
| `header` | Cabeçalho |
| `nav` | Navegação |
| `main` | Conteúdo principal |
| `section` | Seções da página |
| `article` | Conteúdo independente |
| `aside` | Conteúdo complementar |
| `footer` | Rodapé |
| `figure` | Imagens e legendas |
| `address` | Informações de contato |

Você pode organizar seu site com a mesma estrutura semântica utilizada no desenvolvimento web tradicional.

## 🎨 Componentes disponíveis

Abaixo estão exemplos de componentes demonstrados no projeto:

### Layout
- `container`
- `section`
- `grid`
- `row`
- `col`
- `split`
- `spacer`
- `hero`

### Interface
- `button`
- `badge`
- `card`
- `alert`
- `feature`
- `metric`
- `stat`
- `status`
- `progress`

### Navegação
- `nav`
- `link`
- `dropdown`
- `tabs`
- `tab`
- `search`
- `breadcrumb`

### Dados e visualizações
- `chart`
- `sparkline`
- `rating`
- `table`
- `metric`
- `stat`
- `carousel`

### Formulários
- `form`
- `input`
- `select`
- `textarea`
- `checkbox`
- `submit`
- `newsletter`

### Interatividade
- `state`
- `actions`
- `toast`
- `drawer`
- `accordion`
- `modal`
- `theme-toggle`
- `cookie`
- `backtotop`

A lista é ilustrativa. Consulte o catálogo implementado no runtime `gitml.js` para verificar todos os componentes e seus atributos.

## 🔗 Links, botões e navegação

Links podem direcionar para outras páginas, sites externos ou seções do próprio documento.

```html
<link href="#servicos">Nossos serviços</link>

<link href="https://example.com" target="_blank">
  Site externo
</link>

<button href="#contato" variant="primary">
  Fale conosco
</button>
```

## 🃏 Cards e grades

```html
<grid cols="3" gap="20">
  <card title="Primeiro card" icon="star">
    Conteúdo do primeiro card.
  </card>

  <card title="Segundo card" icon="code">
    Conteúdo do segundo card.
  </card>

  <card title="Terceiro card" icon="rocket">
    Conteúdo do terceiro card.
  </card>
</grid>
```

## 📊 Gráficos

```html
<chart
  type="bar"
  title="Visitas por mês"
  data="Janeiro:120,Fevereiro:180,Março:240,Abril:310"
  height="280" />
```

Outros exemplos incluem gráficos de linha, área e pizza, conforme os tipos implementados no runtime.

## ⚡ Estados reativos

GITML permite declarar estados e utilizá-los em diferentes partes da página.

```html
<state name="contador" value="0" persist />

<card title="Contador interativo">
  <metric label="Total" value="{$contador}" />

  <actions>
    <button action="inc:contador">
      Adicionar
    </button>

    <button action="reset:contador" variant="outline">
      Zerar
    </button>
  </actions>
</card>
```

## 📝 Formulários

```html
<form action="#" method="get">
  <input
    label="Nome"
    name="nome"
    placeholder="Digite seu nome"
    required />

  <input
    label="E-mail"
    name="email"
    type="email"
    required />

  <textarea
    label="Mensagem"
    name="mensagem" />

  <submit>Enviar</submit>
</form>
```

Configure um backend quando precisar receber e processar dados reais.

## 🧩 GITML dentro de HTML

Também é possível utilizar blocos GITML dentro de documentos HTML:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Meu projeto</title>
</head>
<body>
  <main>
    <h1>Minha página HTML</h1>

    <script type="text/gitml">
      <section title="Criado com GITML">
        <grid cols="2">
          <card title="Componente 1">
            Primeiro exemplo.
          </card>

          <card title="Componente 2">
            Segundo exemplo.
          </card>
        </grid>
      </section>
    </script>
  </main>
</body>
</html>
```

A extensão VS Code oferece suporte ao reconhecimento de blocos `text/gitml` dentro de documentos HTML.

## 🖥️ Executar com o CLI

Na raiz do projeto, utilize:

```bash
node bin/gitml.js dev index.gitml --port 3000 --open
```

Esse comando inicia o ambiente local e abre o projeto no navegador.

Você também pode utilizar outra porta:

```bash
node bin/gitml.js dev index.gitml --port 4173 --open
```

## 💻 Executar com a extensão do VS Code

A extensão GITML oferece ferramentas integradas ao editor.

Recursos:

- Autocompletar componentes e atributos.
- Sugestões de valores de atributos.
- Documentação dos componentes ao passar o mouse.
- Diagnósticos de erros e avisos.
- Fechamento automático de tags.
- Formatação de documentos.
- Catálogo de componentes.
- Prévia dentro do VS Code.
- Abertura do projeto no navegador usando servidor local.
- Geração de HTML.

### Comandos da extensão

| Comando | Função |
|---|---|
| `gitml.preview` | Abre a prévia no VS Code |
| `gitml.openBrowser` | Abre o projeto no navegador |
| `gitml.serve` | Inicia o servidor e abre o navegador |
| `gitml.stopServer` | Para os servidores |
| `gitml.build` | Gera o HTML |
| `gitml.components` | Explora o catálogo de componentes |

Você também pode utilizar os comandos pela paleta de comandos do VS Code.

## 📁 Gerar HTML

Abra um arquivo `.gitml` e execute o comando de geração de HTML na extensão.

O GITML compila a marcação e produz um documento HTML para utilização no navegador.

## 🛠️ Tecnologias e arquitetura

O projeto possui:

- `gitml.js`: runtime, catálogo de componentes e compilação.
- `bin/gitml.js`: interface de linha de comando.
- `vscode-extension/`: integração com o Visual Studio Code.
- `server.js`: servidor local utilizado pela extensão.

Consulte os arquivos do projeto para detalhes sobre a implementação e os recursos disponíveis.

## 🌟 Exemplo completo

Veja o projeto de demonstração:

```text
exemplos/
└── gitml-studio.gitml
```

Ele demonstra:

- Navegação.
- Hero e apresentação.
- Cards e grids.
- Componentes interativos.
- Estados reativos.
- Gráficos.
- Formulários.
- Layout semântico.
- Temas e personalização.

## 📜 Licença

Consulte o arquivo de licença presente no repositório para conhecer as condições de utilização e distribuição do projeto.

---

**GITML — HTML semântico, componentes declarativos e liberdade para criar.**
