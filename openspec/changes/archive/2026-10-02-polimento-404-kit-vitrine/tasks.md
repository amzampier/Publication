# Tasks

## 1. Página 404 (BUG-05 · spec `pagina-404`)

- [x] 1.1 Criar `app/error.vue` standalone: pt-BR ("Página não encontrada" para 404 + mensagem genérica para demais status), tokens do DS (tipografia oficial, fundo App Canvas), `UiButton` de retorno para `/` (e ação para `/admin` quando aplicável), mantendo o status HTTP real — verificar: `curl -i http://localhost:3000/rota-inexistente` retorna `404`, o HTML contém o texto em pt-BR e **não** contém `Page not found | Nuxt`, e há link/acção para `/`

## 2. Numéricos (BUG-06 · spec `design-system/typography`)

- [x] 2.1 Adicionar `font-mono tabular-nums` ao valor do `UiKpi` (`Kpi.vue`) — verificar: no navegador, o elemento do valor tem ambas as classes (computed `font-family` = JetBrains Mono)
- [x] 2.2 Em `DataTable.vue` (as duas renderizações de célula), aplicar `tabular-nums` quando `col.isNumeric || col.align === 'right'`, mantendo os alinhamentos atuais — verificar: na aba Segurança, a coluna numérica centralizada "Tentativas" tem `tabular-nums` e uma coluna `right` existente continua com ele

## 3. Slider (BUG-07 · spec `design-system/slider`)

- [x] 3.1 No container das marcas (`Slider.vue`), aplicar `flex-wrap` + `gap-x-2 gap-y-1` com `justify-center sm:justify-between` — verificar em 320–375px (CDP, retângulos dos 5 rótulos): nenhum par de rótulos se intercepta e todos ficam dentro da largura do contêiner
- [x] 3.2 No cabeçalho do card de retenção (`AbaRetencaoAuditoria.vue`), `flex-wrap` + `min-w-0` no bloco do valor — verificar a 375px: o texto do cabeçalho não é comprimido/cortado e o painel segue sem overflow horizontal

## 4. DatePicker/Calendar (BUG-08 · spec `design-system/calendario`)

- [x] 4.1 Espelhar no `DatePicker.vue` a auto-inversão do `Select.vue` (ref `abreParaCima` + check de espaço vs altura real do calendário via `nextTick`, alternando `top-full mt-1` ↔ `bottom-full mb-1` no wrapper do popover `DatePicker.vue:228`) — verificar (CDP): campo no fim da área visível abre para **cima** sem corte; com espaço abaixo abre para **baixo** como hoje; `UiSelect` inalterado (comparações de `Select.vue` nenhuma)
- [x] 4.2 `Calendar.vue`: `w-72` → `w-72 max-w-full`; wrapper do popover do DatePicker: `max-w-[calc(100vw-1rem)]` — verificar a 320px: calendário em página e dentro de `UiModal` sem overflow horizontal, grade de dias inteira e clicável
- [x] 4.3 Conferir `docs/01 - design_system.md` § do DatePicker: se descrever posição fixa para baixo, atualizar para a auto-inversão (como já documentado para o Select em `docs/01:481`) — verificar: o texto descreve o comportamento entregue

## 5. Vitrine (BUG-09 · BUG-11 · BUG-12 · spec `vitrine`)

- [x] 5.1 Seção 8: substituir os 2 `<input>` nativos por `UiInput`, o `<select>` por `UiSelect` e o botão de submit + os gatilhos "Disparar …" por `UiButton` — verificar: grep da seção 8 sem `<input`/`<select`/`<button` estilizado manualmente no formulário; reexecutar o E2E de toasts da Etapa 1 (`%TEMP%\opencode\toast-e2e.mjs`) com 24/24
- [x] 5.2 Cabeçalho da página (`design.vue:545`): `h-16` → `min-h-16`, `flex-wrap` + `gap` no container e `min-w-0` no bloco de identidade — verificar a 375px (CDP): título, badge `v2.0.0` e ações ("Imprimir Guia", "Home") sem corte/sobreposição e `scrollWidth == innerWidth`; a 1024px segue em uma linha
- [x] 5.3 Nos 4 cabeçalhos de seção com badge `Componente: …` (`design.vue` contextos 859, 1125, 1372, 1540), `flex-wrap` no wrapper flex + `min-w-0` no bloco de título — verificar (CDP): `document.scrollWidth <= innerWidth` em 375/768/1024/1440 (hoje 435/865/1161/…)
- [x] 5.4 Conferir se `docs/01` descreve os demos da §8 de forma que a troca por kit invalide texto — verificar: nenhuma menção a "campos nativos" permanece (mudança documental apenas se houver)

## 6. Duplicata do toast (BUG-10 · spec `design-system/toasts`)

- [x] 6.1 Confirmar por grep que nenhum módulo importa `components/composables/useToast`, remover `app/components/composables/useToast.ts` (e o diretório vazio) — verificar: `Test-Path` = false, grep por `useToast` em `app/` aponta só `app/composables/useToast.ts`, consumidores inalterados

## 7. Verificação integrada (RL01 §6.1)

- [x] 7.1 `npm run build` conclui sem erro
- [x] 7.2 Checagem CDP unificada no dev server: 404 pt-BR (1.1), KPI/tabular (2.1-2.2), rótulos do slider sem colisão (3.1), auto-inversão + calendário 320px (4.1-4.2), vitrine sem overflow + §8 de kit (5.1-5.3) — verificar: 100% das asserções e screenshots de evidência
- [x] 7.3 Atualizar `docs/RL01 - Relatório de Responsividade.md`: BUG-05…BUG-12 → CORRIGIDO com evidência, critérios de aceite marcados, checklist §6.1, tabela de severidade e veredito do gate recalculados — verificar: nenhum bug aberto restante e veredito coerente com o gate ("Aprovado sem ressalvas" se tudo verde)
