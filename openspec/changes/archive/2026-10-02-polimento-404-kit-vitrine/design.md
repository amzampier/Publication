# Design

## Context

Etapa 3 do gate `docs/RL01` (8 bugs Baixos, ver detalhes em `proposal.md` — Why). O repositório não tem lint/test: a verificação é `npm run build` + checagens no navegador (Edge headless + CDP) — mesmo aparato das Etapas 1 e 2. O kit já dispõe de padrões reutilizáveis: auto-inversão do `UiSelect` (`Select.vue:92-120,352`), `UiButton`/`UiInput`/`UiSelect` para a vitrine, e o overlay `.ds-bottom-clip` para estados. `docs/01` já documenta `tabular-nums` obrigatório (§1 numéricos) e a auto-inversão do Select (§4.81) — o que falta é aplicação.

## Goals / Non-Goals

**Goals:**
- 8 bugs do RL01 fechados com evidência reproduzível (códigos de aceite de cada bug)
- Zero regressão nos comportamentos já verificados nas Etapas 1/2 (toasts, shell, erros acessíveis)
- Manter APIs públicas dos componentes inalteradas

**Non-Goals:**
- Melhorias MEL-01…04 (não bloqueantes) e novos componentes
- Alterar o comportamento do `UiSelect` (só é lido como referência)
- Testes automatizados de framework (não existe infraestrutura no repo)

## Decisions

1. **404 via `app/error.vue`** (Nuxt error page) — recebe `useError()`, renderiza status real 404 e conteúdo próprio pt-BR com tokens do DS + `UiButton` para voltar.
   - *Alternativas:* middleware/route guard (rejeitado — só client-side, não preserva status SSR); customizar `app.vue` (rejeitado — não é o ponto de extensão de erros do Nuxt).
   - `error.vue` é standalone (fora dos layouts); trata `error.statusCode === 404` com ação "Voltar ao início" e, para outros status, mensagem genérica no mesmo estilo (página é compartilhada por 404/500).

2. **Numéricos: `font-mono tabular-nums` no valor do `Kpi`** — uma classe no `<p>` do valor (`Kpi.vue:49-51`).
   **DataTable: `tabular-nums` por `col.isNumeric`** — separar alinhamento de tabulação nas duas renderizações de célula (`DataTable.vue:788,815`): manter `text-right/center/left` como está e aplicar `tabular-nums` quando `col.isNumeric || col.align === 'right'` (hoje só `right`).
   - *Alternativa:* mudar a demo para `align: 'right'` (rejeitada — esconderia o bug; a coluna centralizada é legítima).

3. **Slider: quebra de linha por flex-wrap, não abreviação** — no container das marcas (`Slider.vue:65`): `flex-wrap` + espaçamento vertical (`gap-x-2 gap-y-1`, `justify-center sm:justify-between`); cada rótulo continua atômico entre linhas e pode quebrar internamente. Rótulos abreviados abaixo de `sm` foram considerados e descartados (perdem informação "30 dias (1 mês)").
   - No painel de retenção (`AbaRetencaoAuditoria.vue:64-75`): `flex-wrap` + `min-w-0` no cabeçalho do card para o bloco `text-4xl` não comprimir o restante.

4. **DatePicker: espelhar a auto-inversão do Select, não extrair composable** — copiar o padrão `abreParaCima` + check de espaço (`espacoAbaixo < alturaPopover && espacoAcima > espacoAbaixo`) medindo a altura real do calendário via `nextTick`, e alternar `top-full mt-1` ↔ `bottom-full mb-1` no wrapper do popover (`DatePicker.vue:228`).
   - *Alternativa:* extrair `useAutoFlipPopover()` compartilhado (rejeitada nesta etapa — tocaria o `UiSelect` funcional e spec'ado, ampliando a superfície de regressão por ~10 linhas duplicadas; extrair pode virar MEL futura).

5. **Calendar: `w-72 max-w-full` + teto no popover** — raiz do `Calendar.vue:194` ganha `max-w-full`; o wrapper do popover do DatePicker (`DatePicker.vue:228`) ganha `max-w-[min(100%,calc(100vw-1rem))]` e `right-0` quando o `left-0` transbordar (limitar a uma janela de cálculo simples: `max-w` + laterais alternativas). Modal: o `max-width: 100%` resolve contra o conteúdo do modal.

6. **Vitrine §8: trocar controles nativos pelos equivalentes do kit** — 2 `<input>` → `UiInput`, 1 `<select>` → `UiSelect`, botão de submit e os 4 gatilhos "Disparar …" da seção → `UiButton` (variante coerente com a demo). Botões de navegação/menus/ícones fora do escopo (aceites do BUG-09 os dispensam).
   - O `UiSelect` de tipo mantém as 4 opções atuais (`success/warning/danger/info`).

7. **Cabeçalho da vitrine: `h-16` → `min-h-16` + `flex-wrap` + `min-w-0`** (`design.vue:545-546`) — o bloco de identidade ganha `min-w-0` (com `truncate` no h1 se necessário) e as ações quebram para a segunda linha abaixo do ponto em que não cabem; ≥1024px permanece em uma linha (cenário do spec).

8. **Cabeçalhos de seção com badge: `flex-wrap` nos 4 wrappers** (`design.vue` contextos das linhas 859, 1125, 1372, 1540) — o `div.shrink-0` do badge passa a cair para a nova linha em vez de empurrar o `scrollWidth`; `min-w-0` no bloco de título. Verificar os wrappers exatos no apply (o pai flex é `flex items-center/starts … justify-between`).

9. **Duplicata: `Remove-Item app/components/composables/useToast.ts`** — antes, grep em `app/` por imports de `components/composables` para confirmar zero consumidores (RL01 aponta todos usando `../../composables`).

10. **Demo do modal §15 ganha um `UiDatePicker`** (`design.vue`, seção "Dados da Publicação") — nenhum `UiModal` do repo hospedava um calendário, então o aceite do BUG-08 ("em página **e dentro de `UiModal`** a 320px") não era executável; o campo replica o uso da §7 (`v-model` + `label` + `placeholder`) e torna o cenário verificável por CDP sem tocar em componentes do kit.

## Risks / Trade-offs

- [Quebra de comportamento existente na §8 ao trocar por kit] → reexecutar o E2E de toasts da Etapa 1 (`toast-e2e.mjs`, 24 asserções) após a troca.
- [Auto-inversão do DatePicker com altura errada do calendário] → medir via `nextTick` no `getBoundingClientRect` do popover; validar a 320px em página e em modal.
- [`error.vue` passa a servir também erros 500] → ramificação por `statusCode`, com texto genérico fora do caso 404; nenhum requisito do spec exige conteúdo de 500.
- [`flex-wrap` no slider mudar o visual em telas largas] → wrap só dispara quando não cabe; conferir 1024/1440 que as 5 marcas continuam em uma linha.
- [Remoção da duplicata quebrar import invisível] → grep + `npm run build` como gate.

## Migration Plan

Frontend puro, sem dados/migrations: aplicar → `npm run build` → checagens CDP → dev server para conferência visual → rollback = reverter o commit.

## Open Questions

*(nenhuma — escopo, abordagem e breakdown fechados pelos 8 códigos de aceite do RL01)*
