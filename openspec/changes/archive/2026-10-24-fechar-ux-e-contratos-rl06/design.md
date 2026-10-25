# Design

## Context

A `UiDataTable` agrupa no cliente sobre a página recebida no modo servidor; a ordenação emite `sort-change`, mas a tela de Chamadas não escuta. O drawer navega sem emitir `fechar`. O autocomplete de e-mails monta `LIKE termo%` sem escapar. Ver `proposal.md - Why`.

## Goals / Non-Goals

**Goals:** fechar os achados Média/Baixa de UX e a dívida documental sem alterar contratos de dados.

**Non-Goals:** redesenho do kit, novos componentes, mudança de schema.

## Decisions

1. **Ordenação server-side**: `UiDataTable` emite `sort-change`; a tela de Chamadas escuta e refaz a consulta com `ordenarPor`/`direcao` (ou desabilita `sortable` se o backend não suportar). Preferência: implementar no backend para manter o affordance.
2. **Agrupamento**: extrair um subcomponente/estado de grupo com `role="button"`, `tabindex="0"`, `aria-expanded` e teclado; estado vazio/erro renderizado também no ramo agrupado; contagem "nesta página" quando `serverMode`.
3. **Data do grupo**: usar `col.format` quando existir e um formatador padrão de data pt-BR quando a coluna for de data.
4. **Drawer**: `clicarItem` emite `fechar` após `navigateTo`.
5. **E-mails**: `escaparLike` + `LIKE` em e-mail/nome com `%termo%`, mantendo paginação e RBAC.
6. **Filtros**: `limpar` altera apenas o rascunho; `aplicar` publica no estado; "Cancelar" descarta.
7. **Documentação**: uma passada única por arquivo, com checklist de números/rotas; validar com `openspec validate --specs` e revisão contra o código.

## Risks / Trade-offs

- [Ordenação exigir backend] → incluir endpoint/params e teste de ordenação; fallback: esconder o affordance.
- [Mudanças de docs amplas] → revisar por arquivo e usar o código como evidência.
- [Contraste] → validar tokens AA.

## Migration Plan

1. Implementar UI/UX e testes.
2. Atualizar docs/specs e validar.
3. Rodar gates e Chrome headless (320/375, teclado, agrupamento).
4. Rollback: reverter o commit; sem schema/dados.
