# Design

## Context

Dois desvios visuais do módulo de auditoria em relação à convenção do kit, conforme motivation em `proposal.md`:

- `app/components/auditoria/Filtros.vue` — corpo plano (grid de datas + wrapper de chips) direto sobre o `bg-slate-100` do `UiModal`, com os três filtros de classificação numa única sessão em `UiCheckChip`.
- `app/components/auditoria/Detalhe.vue` — `<dl>` solto no corpo do modal.

Nota de escopo: um terceiro ajuste (cabeçalho "Formato Download" no menu Exportar) foi implementado e **revertido a pedido do usuário** — o estado final de `Cabecalho.vue` é idêntico ao original. A paridade de fonte com o menu da conta foi verificada: ambos usam `text-xs font-light text-slate-700` (`px-3 py-2`) sobre a mesma `font-sans` global (Plus Jakarta Sans).

A checklist visual dos ajustes encontrou dois defeitos, pedidos em correção pelo usuário (sem nova rodada de QA nesta etapa):

- **`Escape` em cascata**: `UiModal` escuta `Escape` em `window` (bubble — `Modal.vue:114`); o `UiSelect` fechava o dropdown no `Escape` sem `stopPropagation` (`Select.vue:177-179`) e o mesmo evento seguia para o modal — um só `Escape` fechava os dois. O `UiDatePicker` tinha o padrão equivalente (`@keydown.esc="isOpen = false"` sem condicional).
- **Rolagem horizontal da grid ao trocar "Linhas por página"**: o `main` do shell é `overflow-y-auto` (`admin.vue:37`); ao aumentar o número de linhas a scrollbar vertical do `main` aparece e rouba ~15px de largura. O chão de largura da tabela (soma dos `minWidth` das seis colunas = 980px + coluna Ações `w-20` = 1060px) deixava de caber nessa largura e o wrapper `overflow-x-auto` da grid abria a barra — embora sete colunas não justificassem rolagem horizontal.

Precedentes do projeto: containers de corpo de modal são `UiModalSection` (vitrine `/design` §15 `design.vue:2356-2380` e `ui/CameraWeb.vue:145`); `UiSelect` é o controle de seleção do kit com auto-inversão de dropdown medida no ancestral rolável mais próximo (`Select.vue:111-121`, correção da RL01) — é o que viabiliza selects dentro do corpo rolável do modal, algo que motivou o uso histórico de chips. O modal de filtros hoje é verificado como "sem scrollbar" (docs/05 §11), propriedade que precisa sobreviver ao ajuste.

## Goals / Non-Goals

**Goals:**

- Corpo dos dois modais organizado em `UiModalSection` (três sessões no Filtros, uma no Detalhe), com os filtros de classificação em `UiSelect`.
- Sem regressão de comportamento (rascunho/filtros, Esc, clique fora, fechamentos) nem de rolagem — inclusive com o dropdown do select aberto.
- `Escape` com precedência para o popup aberto (dropdown/calendário consomem o primeiro `Escape`; o modal fecha no seguinte ou sem popup).
- Sete colunas da grid sem rolagem horizontal na troca de "Linhas por página" nas larguras usuais de desktop (≥ ~1280px com sidebar expandida).
- `docs/05` espelhando as mudanças e menu Exportar documentado sem cabeçalho, com fonte par à do menu da conta.

**Non-Goals:**

- Alterar rótulos, ícones ou handlers dos itens de exportação (CSV/PDF intactos; nada de Excel; nenhum cabeçalho de menu).
- Tocar em `UiModal`, `UiModalSection`, `UiDataTable` ou na vitrine `/design` — a correção de `Escape` se restringe aos componentes que possuem popup (`UiSelect`, `UiDatePicker`).
- Mudanças em specs além dos três deltas MODIFIED em `specs/auditoria/spec.md`.
- Nova dependência, CSS dedicado ou alteração de estado/lógica de dados.
- Eliminar a rolagem horizontal em janelas muito estreitas (< ~1280px) — ali ela é fallback aceito.

## Decisions

**D1 — Menu Exportar: sem cabeçalho; fonte igual à do menu da conta.**
O cabeçalho "Formato Download" (barra navy) foi adicionado e depois removido por decisão do usuário — o menu volta a `py-1` sem `overflow-hidden`, itens `text-xs font-light text-slate-700`, idênticos ao menu suspenso da conta (`AppHeader.vue:241-255`, docs/01 §3). Alternativa descartada (pelo usuário): cabeçalho navy inspirado no painel de notificações.

**D2 — Filtros: três sessões ("Período", "Usuário", "Ação e Recurso").**
Desmembrar a antiga "Classificação" em sessão própria por usuário e sessão combinada de ação+recurso, conforme pedido — três cards brancos, um por grupo lógico. Alternativa descartada: manter uma sessão única com os três selects (não atende ao pedido de desmembrar).

**D3 — `UiSelect` substitui os `UiCheckChip` (reversão da decisão histórica "sem `UiSelect`").**
O chip foi criado para evitar o dropdown absoluto do select estender a área rolável do modal; desde então o `UiSelect` ganhou auto-inversão medida no ancestral rolável (`Select.vue`), então o select cabe no modal. Semântica mantida: `''` = "todos", `filtersCount` inalterado. `clearable` (default) — o `X` devolve o filtro a "todos"; não há opção `''` explícita na lista (o placeholder "Todos/Todas" representa o estado vazio; uma opção `''` tornaria o `X` um no-op visível).

**D4 — `label` nos selects apenas quando a sessão tem múltiplos controles.**
Sessão "Usuário": select sem `label` — o título da sessão identifica o campo (evita repetir "Usuário" duas vezes empilhadas); o nome acessível vem do conteúdo (placeholder "Todos os usuários" / valor selecionado). Sessões "Período" e "Ação e Recurso": campos rotulados ("Data Inicial"/"Data Final", "Ação"/"Recurso") porque dois controles numa sessão precisam de desambiguação — regra coerente com a vitrine §15 (título de sessão ≠ rótulo de campo).

**D5 — Espaçamento: grid nativo da `UiModalSection` + wrapper `div.grid.gap-4` no corpo.**
O corpo da sessão já é `grid gap-4` (os dois selects de "Ação e Recurso" são filhos diretos, sem `space-y` manual); as três sessões são espaçadas pelo wrapper externo.

**D6 — Ícones das sessões: `CalendarDays` (Período), `User` (Usuário), `Tags` (Ação e Recurso); `Eye` reaproveitado no Detalhe.**
`User` soma ao import de `@lucide/vue` (nenhuma dependência nova); `Tags` já estava; no Detalhe, `Eye` já estava importado.

**D7 — `v-if` do Detalhe sobe para a sessão.**
Hoje `v-if="registro"` está no `<dl>`; com a sessão envolvendo, deixá-lo no `<dl>` renderizaria um card vazio quando `registro` é `null`. O `v-if` passa para a `UiModalSection`.

**D8 — Docs: `docs/05` (§2, §3.1, §3.3, §3.5, §5).**
`docs/01` §5.11/§5.12 e a vitrine §13 documentam o kit e a tabela, que não mudam. §3.1 passa a registrar a paridade de fonte com o menu da conta (sem cabeçalho).

**D9 — `Escape` com precedência para o popup (consumo no ponto, sem mexer no `UiModal`).**
A correção fica nos componentes com popup, não no modal: `Select.vue` ganha `e.stopPropagation()` no branch de `Escape` já aberto; `DatePicker.vue` troca `@keydown.esc="isOpen = false"` por handler que só para o evento quando `isOpen`. Com o popup fechado o `Escape` continua propagando até o listener em `window` do `UiModal` (fecha o modal) — a precedência é: popup → modal → nada. Alternativa descartada: mudar `UiModal` para ignorar `Escape` vindo de dentro de um popup (exigiria detecção de camada/foco no modal, mais frágil e com impacto em todos os modais do sistema). Vale para qualquer `UiModal` com selects/datas (ex.: vitrine §15).

**D10 — Grid: `max-w-7xl` no container + `minWidth` das colunas com chão de 970px.**
Duas alavancas somadas: o container da página sobe de `max-w-6xl` (1152px) para `max-w-7xl` (1280px) — "aumentar um pouco a largura da página", autorizado pelo usuário; e os `minWidth` das seis colunas caem de 140/170/130/150/260/130 para 130/160/120/140/220/120 (soma 890px + Ações `w-20` = chão de 970px, −90px). Assim a scrollbar vertical que aparece ao aumentar "Linhas por página" (~15px) não estoura mais o chão em janelas ≥ ~1280px com sidebar expandida, e a largura real da tabela continua a ser `w-full` (os `minWidth` só grampeiam o piso em telas estreitas — em telas normais as colunas ganham os ~90px de volta). Alternativa descartada: `scrollbar-gutter: stable` no `main` (mudaria a largura de todas as páginas administrativas); esconder a barra horizontal (quebraria o fallback em telas estreitas).

## Risks / Trade-offs

- [Três sessões + selects aumentam a altura do modal de filtros e o dropdown pode criar scrollbar] → sessões compactas (~430px estimados vs `max-h-[75vh]`) e auto-inversão do `UiSelect` medida no corpo rolável; validar na checklist 4.2 abrindo cada dropdown.
- [Select sem `label` na sessão "Usuário" pode ter nome acessível apenas do conteúdo] → placeholder "Todos os usuários"/valor selecionado servem de nome via name-from-content; aceito por D4.
- [Delta MODIFIED com conteúdo parcial perde detalhe no archive] → os blocos foram copiados inteiros de `openspec/specs/auditoria/spec.md` e editados, com todos os cenários originais preservados e cenários novos acrescentados; o requirement de exportação saiu do delta (estado final = original da spec principal).
- [`stopPropagation` no `Escape` pode esconder fechamento legítimo do modal] → o consumo só ocorre com popup **aberto**; fechado, o fluxo é idêntico ao de hoje (D9). Risco aceito e coberto pelo cenário novo na spec.
- [`minWidth` menor espreme colunas em telas < 1280px] → em larguras ≥ ~1280px a tabela é `w-full` e ganha de volta todo o espaço; abaixo disso a rolagem horizontal permanece como fallback (Non-Goal) e o texto das células já quebra em linha.
- [Ajuste sem teste automatizado] → gate do repo é `npm run build` + conferência manual na rota `/admin/auditoria` (tasks.md detalha a checklist; a das correções 5.x fica para a rodada de QA seguinte, a pedido do usuário).

## Migration Plan

Mudança puramente visual em código de front-end, sem dados, contratos ou dependências. Deploy junto com o restante do módulo; rollback = rever os dois arquivos de componente (git revert).

## Open Questions

Nenhuma — o escopo revisado (sem cabeçalho no menu, três sessões com `UiSelect`) foi pedido e confirmado pelo usuário durante a implementação.
