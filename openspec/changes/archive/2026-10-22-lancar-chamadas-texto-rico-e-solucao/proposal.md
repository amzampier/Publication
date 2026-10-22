# Proposal

## Why

A Descrição completa da chamada é hoje texto puro (`UiTextarea`), sem hierarquia visual, e o conteúdo
publicado (Release Week, Manuais, Escopo de Projetos) ainda não tem um texto voltado ao cliente. Para a
Área Pública que lerá esses itens, é preciso permitir ênfase (negrito), cor e tamanho de fonte no texto
digitado e introduzir o campo **Solução** — texto novo, separado da Descrição — que também irá ao público.

## What Changes

- A **Descrição completa** passa a aceitar texto rico: negrito, cor de fonte e tamanho de fonte.
- Novo campo **Solução** (opcional), também com texto rico, na etapa "Conteúdo e mídias" do wizard.
- Os ícones de formatação aparecem ao passar o mouse/focar o campo e em uma toolbar flutuante sobre a
  seleção de texto.
- Cada campo rico persiste **duas representações**: texto puro (busca, importação, fallback e exportação)
  e HTML sanitizado (render). Nova migration adiciona `descricao_html`, `solucao` e `solucao_html` em
  `entregas_itens`.
- O servidor sanitiza o HTML (allowlist) e deriva o texto puro; registros antigos e importações continuam
  funcionando pelo fallback de texto puro.
- Novo componente `UiRichText` (editor) e `UiRichTextViewer` (leitura) no design system; a Descrição e a
  Solução passam a ser exibidas com formatação no modal de Detalhes.
- A paleta de cores de texto vira uma allowlist documentada (inclui um vermelho de **conteúdo** `#dc2626`,
  distinto do vermelho de **erro** `#be123c`).

## Capabilities

### New Capabilities
- `design-system/rich-text`: contrato do editor de texto rico do kit (`UiRichText`/`UiRichTextViewer`) —
  toolbar/bubble, paleta e tamanhos permitidos, sanitização na escrita e render seguro do HTML.

### Modified Capabilities
- `lancar-chamadas`: o formulário ganha a Descrição rica e o campo Solução; a validação passa a cobrir a
  Solução (opcional) e a derivação de texto puro; a busca passa a considerar a Solução; o backend persiste
  as representações pura e HTML e as expõe na leitura.
- `design-system/modais`: a armadilha de foco/Tab do `UiModal` passa a reconhecer elementos
  `contenteditable` como focáveis, para o editor rico participar da navegação por teclado.
- `design-system/brand-tokens`: a paleta oficial passa a documentar a allowlist de cores de texto do
  conteúdo, incluindo o vermelho de conteúdo `#dc2626`, distinto do vermelho de erro `#be123c`.

## Impact

- **Banco:** `entregas_itens` + `descricao_html`, `solucao`, `solucao_html` (migration 25, aditiva).
- **Backend:** `server/utils/lancar-chamadas.ts` (colunas, montagem, validação/derivação, insert/update,
  importação), novo `server/utils/richText.ts`.
- **Frontend:** novos `UiRichText`/`UiRichTextViewer`; `Formulario.vue`, `Detalhes.vue`, `Modal.vue`,
  `main.css`, `design.vue`; tipos/validação em `shared/lancar-chamadas.ts`.
- **Dependências:** `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-text-style`,
  `sanitize-html` (+ `@types/sanitize-html` em dev).
- **Docs:** `docs/01 - design_system.md` (§5 novo e paleta de texto), `docs/15 - Módulo Lançar Chamadas.md`.
- **Fora de escopo:** páginas da Área Pública, coluna Solução na importação XLSX, itálico/sublinhado,
  links, listas, títulos, cor de fundo e imagens dentro do texto rico.
