# Proposal

## Why

A auditoria de responsividade/UX (`docs/RL01 - Relatório de Responsividade.md`) deixou 8 bugs de severidade **Baixa** em aberto após as Etapas 1 e 2 (feedback global, tipografia, shell responsivo e erros acessíveis já corrigidos): rota 404 fora do sistema, números sem `tabular-nums`, rótulos do slider colidendo em telas estreitas, popover/calendário sem tratamento de espaço, vitrine com controles paralelos e overflow horizontal, e uma duplicata morta do composable de toast. Fechá-los é o último degrau do gate de "Aprovado sem ressalvas" (checklist RL01 §6.1).

## What Changes

- **Página 404 (BUG-05):** criar `app/error.vue` com mensagem em pt-BR, tokens do design system e CTAs de volta para `/` e `/admin` — substituir a página padrão do Nuxt.
- **Numéricos (BUG-06):** `UiKpi` passa a exibir o valor em `font-mono tabular-nums`; `UiDataTable` aplica `tabular-nums` em toda coluna numérica (`isNumeric`) independentemente do alinhamento (hoje só em `align: 'right'`).
- **Slider (BUG-07):** rótulos das marcas permanecem legíveis e sem sobreposição em 320–375px (`flex-wrap`/quebra no cabeçalho do card de retenção).
- **DatePicker/Calendar (BUG-08):** popover do `UiDatePicker` auto-inverte quando não há espaço abaixo (mesma lógica do `UiSelect`); `UiCalendar` deixa de ter largura fixa (`w-72` → `max-w-full`).
- **Vitrine (BUG-09, BUG-11, BUG-12):** formulário da seção 8 passa a usar `UiInput`/`UiSelect`/`UiButton` (eliminar controles nativos paralelos); cabeçalho da página ganha `flex-wrap`/`min-w-0`; cabeçalhos de seção com badge `shrink-0` ganham `flex-wrap` — eliminando o overflow horizontal medido (scrollWidth 435/865/1161 em 375/768/1024).
- **Duplicata do toast (BUG-10):** remover `app/components/composables/useToast.ts` (cópia byte a byte de `app/composables/useToast.ts`, não auto-importada), mantendo uma fonte única.

## Capabilities

### New Capabilities

- `pagina-404`: rota inexistente renderiza página de erro do sistema (pt-BR, tokens do DS, links de retorno) com status 404.
- `design-system/calendario`: `UiDatePicker` posiciona o popover evitando corte (auto-inversão) e `UiCalendar` se adapta à largura disponível.
- `vitrine`: a vitrine `/design` é construída com o kit (sem controles paralelos), renderiza sem overflow horizontal em 320–1440px e mantém cabeçalho e cabeçalhos de seção íntegros em telas estreitas.

### Modified Capabilities

- `design-system/typography`: novo requisito — métricas (`UiKpi`) e colunas numéricas (`UiDataTable`) exibem `font-mono tabular-nums` em qualquer alinhamento.
- `design-system/slider`: requisito "Marcas rotuladas exibem-se sob a track" ganha cenário de legibilidade em telas estreitas (320–375px).
- `design-system/toasts`: novo requisito — fonte única do composable `useToast` (sem cópias divergentes).

## Impact

- **Código:** cria `app/app/error.vue`; edita `app/components/ui/{Kpi,DataTable,Slider,DatePicker,Calendar}.vue`, `app/pages/design.vue` (§8, cabeçalho, cabeçalhos de §5/§8/§9/§11), `app/components/configuracoes/AbaRetencaoAuditoria.vue` (wrap do cabeçalho); exclui `app/components/composables/useToast.ts`.
- **Docs:** `docs/01 - design_system.md` apenas se o comportamento entregue divergir do descrito (BUG-06/07 já documentados).
- **Verificação:** `npm run build` + checagens CDP em 320/375/768/1024/1440 (scrollWidth da vitrine, rótulos do slider, calendário em 320px, KPI/colunas, 404 em pt-BR) — sem lint/test no repositório.
- **Nenhum breaking change:** APIs públicas dos componentes inalteradas; só remoção de arquivo duplicata não consumido.
