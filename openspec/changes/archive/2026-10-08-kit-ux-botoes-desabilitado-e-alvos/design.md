# Design

## Context

Ver `proposal.md` — Why. Estado atual relevante:

- `ui/Button.vue`: `size md` = `px-3.5 py-2` — variantes com borda (`outline`/`danger`/
  `accent`) somam +2px de `border` e ficam 34px; `primary` (sem borda) fica 32px.
- `docs/01` §5.1 documenta `size` só pela fonte (11/12/14px) — **não** fixa altura.
- Alvos de ação: `p-0.5` + ícone 14px = 18×18px em `perfis/Tabela.vue` (3 botões) e
  `usuarios/Tabela.vue` (4 botões, mesmo CSS). Coluna Ações do `UiDataTable` = `w-20`
  **preferido** (table auto-layout expande o th quando o conteúdo é mais largo).
- Estado desabilitado: implementado (`bg-slate-200 cursor-not-allowed opacity-60` + seleção
  em pílula branca no `Segmented`, hover/foco suprimidos) e documentado no `docs/01` (§5.3,
  §5.5, §5.6, §5.7, §5.15) — **sem** requisito em `form-control-states`.
- `docs/qa/05-qa-ux.md` §"Padrões conhecidos": lista 19 componentes; `app/components/ui/`
  tem **25**.

## Goals / Non-Goals

**Goals:**
- Altura idêntica entre variantes do `UiButton` em cada `size`, **sem** mexer na altura do
  `primary` (o mais usado).
- Alvos de ação ≥ 24px (WCAG 2.5.8 sem depender da exceção de espaçamento) nas duas
  listagens.
- Requisito de spec para o estado desabilitado (comportamento já existente — só falta o
  contrato).
- Inventário do doc de QA fiel ao diretório.

**Non-Goals:**
- M-05/MEL-02 (badge `animate-ping` + `prefers-reduced-motion`), MEL-01/03/04.
- Modal de permissões, backend, novos componentes.
- Alterar o comportamento visual de nenhum controle desabilitado (spec documenta o atual).

## Decisions

1. **M-06: altura fixa por `size` (`h-7`/`h-8`/`h-10`) no lugar do padding vertical.**
   `sm`/`md`/`lg` viram `h-7 px-2.5`, `h-8 px-3.5`, `h-10 px-5` — borda contida no box
   (`border-box`): `outline`/`danger`/`accent` caem 2px (34→32 no `md`) e igualam o `primary`,
   que **não muda**. `inline-flex items-center` centraliza texto/ícone/spinner.
   Alternativas descartadas: **`border border-transparent` no `primary`** (une as alturas, mas
   cresce 2px *todos* os botões primários do app — muito mais risco de layout) · **padding
   fracionário `py-[7px]`** (fora da escala de tokens) · **borda só visual sem layout** (não
   existe — a borda sempre soma na altura auto).

2. **M-08: `p-0.5` → `p-1.5` (14+12 = 26px)** — passa WCAG 2.5.8 por alvo ≥24px, sem a
   exceção de espaçamento. `gap-[7px]` mantido; a coluna Ações (`w-20` preferido) expande
   naturalmente no auto-layout. Aplicado **também** em `usuarios/Tabela.vue` (4 botões, mesmo
   CSS) para as listagens não divergirem — escopo extra declarado na proposal.
   Alternativa descartada: `p-1` (22px) — ainda abaixo de 24px, só melhora a exceção.

3. **M-07: spec-only ADDED em `form-control-states`** — nenhum código muda (5/5 controles já
   cumprem; verificado na auditoria). O requisito espelha o comportamento medido: fundo
   `slate-200`+`opacity-60`, sem hover/foco, pílula branca no `Segmented`, habilitados
   inalterados. Sem MODIFIED em outros requisitos (nenhum deles fala de desabilitado).

4. **M-09: reescrita de uma linha** do bullet do kit em `docs/qa/05-qa-ux.md` com os 25
   nomes `Ui*` reais (ordem alfabética) — doc de QA, sem impacto em código.

## Risks / Trade-offs

- [Coluna Ações expande (+~40px em perfis, +~32px em usuários) e a tabela de perfis tem
  requisito de **sem rolagem horizontal a 1280px**] → `w-20` é só preferência (auto-layout
  absorve); soma das larguras mínimas segue abaixo do espaço útil em 1280px — **conferir na
  task 2.3**; se estourar, reduzir `gap-[7px]` → `gap-1` antes de mexer no `w-20`.
- [Altura fixa remove o crescimento automático se algum botão ganhar conteúdo de 2 linhas]
  → rótulos do kit são de uma linha (padding vertical nunca foi o mecanismo de wrap — o texto
  quebrava dentro da altura auto de qualquer forma); conferir vitrine seção 3.
- [Botões `sm`/`lg` mudam 2px também (outline/danger/accent)] → mesma correção; `primary`
  em todos os sizes é intocado (maioria dos usos).
- [Inventário do doc de QA vira fonte que pode desatualizar de novo] → listagem completa
  ordenada facilita a próxima conferência (task de verificação compara com o glob).

## Migration Plan

Sem migração: frontend puro. Rollback = reverter `Button.vue`, as duas `Tabela.vue` e os
docs; o delta da spec volta pelo archive.

## Open Questions

<!-- nenhum — M-06 (altura fixa), M-08 (p-1.5 nas duas tabelas) e M-07 (spec-only) decididos
     com o usuário na rodada; escopo extra de usuarios/Tabela.vue sinalizado na proposal -->
