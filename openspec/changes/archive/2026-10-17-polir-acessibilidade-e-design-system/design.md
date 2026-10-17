# Design

## Context

Ver `proposal.md - Why` e os achados RL04-M-17…M-20, B-03…B-08, B-28…B-30 em
`docs/RL04 - Relatório de Qualidade Completo.md`. Estado atual relevante:

- `Select.vue` sempre usa `:aria-labelledby="labelId"`; sem `label`, o `id` não existe no DOM e não
  há `aria-label` de fallback (modais de Filtros usam `UiSelect` sem `label`).
- `CheckCard.vue` embute `<Checkbox>` sem `label`/`aria-label`; o `div` raiz tem `aria-labelledby`
  mas sem `role`, então o nome não chega ao controle.
- `Importar.vue` usa `UiCheckbox` por linha sem `label`/`aria-label`.
- Vários controles secundários usam `focus:outline-none` sem `focus-visible` de reposição
  (`ToastContainer.vue`, `Calendar.vue`, `Select.vue`, `DatePicker.vue`, `design.vue` "Copiar HEX").
- Textos de apoio usam `text-slate-400` (≈2,5:1 sobre branco). `Badge.vue` usa dots `*-500`;
  `AppHeader.vue` usa `bg-rose-500` no sino.
- `DataTable.vue`: `ColumnDef.sortable` não é `false` para a coluna sem header (checkbox vira `th`
  focável com `aria-label="Ordenar por "`); o estado vazio usa texto fixo "com o filtro aplicado".
- `AppHeader.vue`: os painéis usam `role="menu"` mas sem navegação por setas/`focusout`.
- `design.vue`: demo de toast warning em verde, rótulo "Sucess", `rose-400`, dica "SVG".
- `meu-perfil.vue`: falha do `GET` deixa `registro = null` e a página renderiza em branco (só toast).
- `perfil/Avatar.vue`: comentário sugere persistência de `dataURL` (é rascunho).

## Goals / Non-Goals

**Goals:**
- Controles compostos com nome acessível; foco de teclado visível em controles secundários.
- Texto de apoio com contraste AA; dots/badge nos tokens documentados.
- `UiDataTable` sem colunas-fantasma focáveis e com estado vazio correto.
- Menus do header operáveis por teclado.
- Vitrine fiel aos componentes reais; Meu Perfil com estado de erro recuperável.

**Non-Goals:**
- Os baixos funcionais da cauda (`B-09`, `B-15…B-22`, `M-21`) — change (B).
- Etapa 4 (performance/banco) e Etapa 5 (documentação).
- Redesenho visual amplo; as mudanças são pontuais e alinhadas ao `docs/01`.

## Decisions

### D1 — Nome acessível dos controles compostos
`Select`: quando `label` for vazio, aplicar `aria-label` (nova prop opcional; fallback ao
`placeholder`/rótulo do contexto) e só referenciar `aria-labelledby` quando o `label` existir.
`CheckCard`: repassar o nome do cartão ao `Checkbox` interno (via `label`/`aria-label`). `Importar`:
passar `aria-label` por linha (nome/e-mail). Alternativa descartada: só o `label` — não cobre os
usos sem rótulo visível.

### D2 — Foco visível sem contorno no mouse
Trocar `focus:outline-none` por `focus-visible:` (anel/contorno `brand-focus`) nos controles
secundários, mantendo o clique de mouse sem contorno. Alternativa: `outline` sempre — pioraria o
clique.

### D3 — Contraste mínimo
Texto de apoio passa de `slate-400` para `slate-500` (`#64748b`, ≈4,6:1 sobre branco) nas ocorrências
apontadas. Pontual, sem redesenho.

### D4 — Estado vazio e colunas não ordenáveis na DataTable
Colunas sem `header` (ou `sortable === false`) deixam de receber `tabindex`/`aria-sort`/rótulo de
ordenação. O estado vazio escolhe a mensagem conforme haja ou não filtro/busca ativos (`filtersCount`
ou busca), distinguindo "base vazia" de "filtro sem resultado".

### D5 — Navegação por teclado nos menus do header
Adicionar `keydown` no painel aberto (setas, Home/End, `Escape` fecha e devolve o foco ao gatilho) e
fechar o painel no `focusout` para fora dele. Mantém o `role="menu"` e o fechamento por clique fora.

### D6 — Paleta dos dots/badge e vitrine
Dots do `UiBadge` e o sino passam a usar as cores documentadas (`#047857`/`#be123c`). A vitrine passa
a espelhar o `ToastContainer` real (variantes/cores/rótulos), corrige "Sucess" e a dica de upload
(sem SVG), e adiciona foco ao "Copiar HEX".

### D7 — Meu Perfil com erro recuperável
Guardar o erro da carga; quando `registro` for nulo e houver erro, renderizar um bloco de estado de
erro com botão "Tentar novamente" que refaz a carga. Alternativa: só recarregar a página — pior UX.

## Risks / Trade-offs

- **Contraste/foco alteram a aparência** → mudanças pontuais e alinhadas ao `docs/01`; conferir em
  `/design` e nas telas afetadas.
- **`aria-label` de fallback no Select** → garantir que usos com `label` continuem inalterados.
- **Fechar menu no `focusout`** → evitar fechar ao mover o foco dentro do próprio painel (checar
  `relatedTarget` contido no painel).
- **Estado vazio** → a heurística de "filtro ativo" deve considerar busca e `filters-count`.

## Migration Plan

1. Componentes de UI: `Select`, `DatePicker`, `Calendar`, `ToastContainer`, `CheckCard`, `DataTable`,
   `Badge`.
2. Shell: `AppHeader` (menus teclado, sino tokenizado).
3. Telas: `Importar.vue` (a11y das linhas), `meu-perfil.vue` (erro recuperável), `Avatar.vue` (comentário),
   `design.vue` (demos), e os textos de apoio (contraste).
4. Verificar por `npm run build` e conferência em `/design`; foco por teclado e leitura de nomes
   acessíveis por inspeção do HTML.
5. **Rollback:** reverter os commits; sem migration e sem alteração de dados.

## Open Questions

Nenhuma pendente que altere specs, abordagem ou tarefas.