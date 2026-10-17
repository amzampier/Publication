# Design

## Context

Ver `proposal.md` para a motivação (RL03 Etapa 6). Os itens B-02…B-11 são correções pontuais; a
única mudança de spec é a acessibilidade da ordenação da `UiDataTable` (B-09). Os demais são
ajustes de código alinhados às specs/docs já existentes (brand-tokens, typography, form-control-states).

## Goals / Non-Goals

**Goals:**
- Alinhar tokens/accent e tipografia aos padrões do design system.
- Tornar a ordenação da `UiDataTable` acessível por teclado (`aria-sort`).
- Corrigir validações/dicas/feedback dos fluxos de upload, rate limit, perfis e CEP.
- Limpar a vitrine.

**Non-Goals:**
- Não alterar comportamento de negócio/contratos de API.
- Não tratar a Etapa 7 (dados/ambiente) do RL03.

## Decisions

### D1 — Ordenação acessível (B-09)
No `th` ordenável da `UiDataTable`: adicionar `tabindex="0"`, `role="columnheader"` com
`aria-sort` derivado do estado vigente da coluna e um `@keydown` que trata `Enter`/`Space`
(preventDefault) para `toggleSort`, mantendo o clique atual.

### D2 — Tokens/accent (B-06/B-07)
Substituir `text-brand-accent`/`border-brand-accent` usados como texto/ícone sobre superfície clara
por `#1a9e07` (borda/divisória) ou `#0f7a06` (texto), conforme `brand-tokens`; e trocar o hover
`#183b8c` do login por `hover:text-brand-structure`/tom da paleta.

### D3 — Tipografia dos rótulos (B-08)
Nos rótulos de `Input`/`Textarea`/`Select`/`DatePicker`/`Segmented`, usar `font-medium` (500),
removendo `font-bold`/`font-semibold`.

### D4 — Validação/feedback (B-02/B-03/B-04/B-05/B-10/B-11)
- Logomarca: remover "SVG" da dica (o servidor aceita PNG/JPEG/WebP/GIF).
- Rate limit: validar mínimo `1` no campo (não aceitar `0`/vazio no rascunho).
- Perfil: ao capturar `409` de nome duplicado, marcar o campo Nome (em vez de só toast genérico).
- Permissões: remover o comentário obsoleto ("sem interruptor nesta etapa").
- CEP: tratar `Space` (além de `Enter`) no gatilho `role="button"`.
- Vitrine: trocar `lime-500`/`rose-500`/`rose-600` por tokens e remover hex fora da paleta das demos.

## Risks / Trade-offs

- **[Mudanças visuais]** → baixo risco; verificadas por `npm run build` + revisão no `/design`.
- **[aria-sort/teclado]** → altera apenas acessibilidade, sem efeito no clique.

## Migration Plan

- Sem migration. Deploy de código.
- Verificação: `npm run build` + `openspec validate --specs` + revisão visual em `/design`.

## Open Questions

(nenhuma)
