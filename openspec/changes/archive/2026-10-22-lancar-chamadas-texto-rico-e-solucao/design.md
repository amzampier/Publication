# Design

## Context

Ver `proposal.md — Why`. O estado atual que condiciona a solução:

- A Descrição completa é texto puro em `entregas_itens.descricao_completa` (MEDIUMTEXT), renderizada com
  `whitespace-pre-line` no `Detalhes.vue`; a busca (`shared/lancar-chamadas.ts`) concatena o texto cru e
  a validação só exige "não vazio". Não há sanitizador, `v-html` nem biblioteca de texto rico no projeto.
- O formulário é um wizard (`Formulario.vue`), com validação no cliente em `shared/lancar-chamadas.ts` e
  o backend em `server/utils/lancar-chamadas.ts` (INSERT/UPDATE manuais, importação XLSX, auditoria).
- O `UiModal` prende o foco/Tab por uma lista de seletores que não inclui `contenteditable`.
- A Área Pública é hoje um placeholder; esta change prepara o dado e o contrato, não as páginas públicas.

## Goals / Non-Goals

**Goals:**
- Texto rico (negrito, cor, tamanho) na Descrição e no novo campo Solução, com par texto puro + HTML
  sanitizado e fallback para registros antigos/importados.
- Reaproveitar um único componente de edição/leitura no admin e, futuramente, na Área Pública.
- Manter busca, importação, exportação e validação funcionando sobre texto puro.

**Non-Goals:**
- Páginas/endpoints da Área Pública, coluna Solução na importação XLSX, formatações além de negrito/cor/
  tamanho (itálico, sublinhado, links, listas, títulos, fundo, imagens no texto).

## Decisions

### D1 — Editor: TipTap v3 com BubbleMenu
Adotar `@tiptap/vue-3` + `@tiptap/starter-kit` + `@tiptap/extension-text-style` (traz `Color` e
`FontSize`) e a `BubbleMenu` de `@tiptap/vue-3/menus`. O `StarterKit` é configurado desligando tudo
exceto `bold`, `paragraph`, `hardBreak` e `undoRedo`, restringindo o schema às marcas pedidas.
*Alternativas:* `contenteditable`/`execCommand` (depreciado e frágil em seleção/paste/undo) e
markdown-lite (não é WYSIWYG). TipTap entrega seleção, negrito, cor, tamanho, colar e desfazer testados.

### D2 — Persistência em duas colunas (texto puro + HTML)
`entregas_itens` ganha `descricao_html`, `solucao` e `solucao_html`. `descricao_completa` e `solucao`
permanecem texto puro e canônicos para busca/importação/fallback; os `*_html` são apresentação
sanitizada. O editor envia o HTML; o servidor sanitiza e deriva o texto puro (nunca confia no texto puro
do cliente). Sem HTML (legado/importação), usa-se o texto puro. *Alternativa descartada:* guardar só
HTML na coluna existente — quebraria busca, importação e histórico, exigindo migração destrutiva.

### D3 — Sanitização com allowlist de valores
`server/utils/richText.ts` usa `sanitize-html` com allowlist de tags (`p`, `br`, `strong`, `span`) e, em
`span`, apenas `style` com `color` e `font-size` restritos por regex aos valores exatos da allowlist.
Escolhemos **estilo inline com valores exatos** (em vez de classes customizadas) porque é o que o TipTap
`Color`/`FontSize` produzem nativamente; o `sanitize-html` normaliza/valida os valores, então nenhuma cor
ou tamanho fora da allowlist sobrevive. *Alternativa:* marks customizadas com classes — mais código de
extensão sem ganho de segurança.

### D4 — Allowlist compartilhada
A paleta de texto e a escala de tamanhos vivem em `shared/rich-text.ts` (constantes puras): usadas pelo
editor (opções da toolbar), pelo sanitizador e pelos testes. Cores de conteúdo: sem cor, Navy `#112051`,
Azul `#0364f7`, Verde `#0f7a06`, Esmeralda `#047857`, Vermelho `#dc2626`, Rosa/Erro `#be123c`, Âmbar
`#92400e`, Slate `#334155`. Tamanhos relativos: `0.9em`, `1em`, `1.15em`, `1.3em`.

### D5 — Componente client-only
`app/components/ui/RichText.client.vue` (auto-import `UiRichText`) evita que o TipTap (que depende do
DOM) rode no SSR; o formulário só monta o modal no cliente. `UiRichTextViewer.vue` renderiza o HTML já
sanitizado (v-html) com as classes `.ds-rich-text`, sem estilos paralelos.

### D6 — Toolbar no hover/foco + bubble na seleção
A toolbar acoplada ao campo cobre teclado e toque; a `BubbleMenu` aparece sobre a seleção. A bubble é
ancorada **dentro do painel do modal** (não no `body`) para que a armadilha de foco do `UiModal` a
alcance e ela não seja recortada pelo `overflow-hidden` do painel.

### D7 — Armadilha de foco reconhece contenteditable
`Modal.vue` passa a incluir `[contenteditable="true"]` no `FOCUSABLE_SELECTOR`; `focarCampo` no
`Formulario.vue` também, para o foco do primeiro erro chegar ao editor.

### D8 — Validação sobre texto puro derivado
`validarChamada` continua pura e recebe `descricaoCompleta`/`solucao` em texto puro. O formulário usa o
texto emitido pelo editor; o servidor recalcula antes de validar/gravar. `descricaoCompleta` obrigatória
(HTML que renderiza vazio conta como ausente); `solucao` opcional, com teto de 20.000 caracteres em texto
puro.

## Risks / Trade-offs

- **Bundle do admin cresce com o TipTap** → componente client-only e carregado só ao abrir o formulário
  ou a `/design`; validar o build.
- **SSR/hidratação** → `.client.vue` garante que o editor não é avaliado no servidor.
- **XSS armazenado** → sanitização no servidor em todos os caminhos de escrita; o viewer consome apenas
  HTML sanitizado; importação grava texto puro (sem HTML).
- **Divergência entre texto puro e HTML** (edição direta no banco) → texto puro é canônico para busca/
  fallback; documentar. Não há escrita fora da API.
- **CJS do `sanitize-html` no bundle do Nitro** → validar no `npm run build`.
- **Testes são `environment: 'node'`** → o editor não tem teste de DOM; cobrir sanitização/derivação com
  testes puros e validar o editor visualmente em `/design` e no modal.

## Migration Plan

1. Adicionar `descricao_html`, `solucao` e `solucao_html` (migration 25, aditiva e idempotente, com
   bloco de rollback comentado). Registros existentes ficam com `NULL` e usam o fallback.
2. Deploy com o backend derivando/sanitizando na escrita; dados antigos não são migrados.
3. Rollback: remover as três colunas (comentado na migration) e reverter o código; nenhum dado de
   descrição existente é perdido (as colunas são novas).
