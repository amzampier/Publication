# Design — adapt-design-page-to-publications

## Context

A vitrine `/design` (`app/pages/design.vue`, ~2080 linhas, 15 seções numeradas) é a demonstração viva dos 19 componentes de `app/components/ui/` e a referência de exemplos citada por `docs/01 - design_system.md`. Todo o conteúdo de demonstração ainda pertence ao domínio FinancePro (~142 matches de resíduos: FinancePro, NF-e, fornecedor, filial, Matriz, CNPJ, SEFAZ, SPED, contábil, conciliação). Ver proposal.md — Why.

Restrições confirmadas pelo usuário:

1. **Escopo desta fase: somente `app/pages/design.vue`** — shell (`navigation.ts`, `AppHeader`, `AppSidebar`, `app.vue`) fica para fase seguinte.
2. **Registro em OpenSpec** (este change, `skip_specs: true` — só conteúdo de demonstração, nenhum requisito de comportamento muda).
3. **Somente os exemplos mudam** — os 19 componentes `app/components/ui/` e a estrutura/comportamento da vitrine permanecem intactos.

Fonte da verdade para o vocabulário de destino: `docs/01 - design_system.md` (identidade, tokens, mapeamento status→badge, exemplos `REL-2026-W39`, uso de slot `default` no Badge).

## Goals / Non-Goals

**Goals:**

- Zero resíduos de domínio FinancePro/multi-filial em `app/pages/design.vue`, com grep de regressão.
- Cada seção da vitrine manter a mesma cobertura de demonstração de componentes (mesmas props, estados e variantes exercitadas), apenas com dados do domínio Publications.
- Vitrine convergente com `docs/01` (título, exemplos, vocabulário de status, escopo único sem seletor de empresa).

**Non-Goals:**

- Alterar qualquer arquivo em `app/components/ui/` (inclusive a variante legada `reconciled` e seu rótulo "Reconciliado" — reservada conforme doc 01 §5.2).
- Alterar shell (`app/config/navigation.ts`, `AppHeader.vue`, `AppSidebar.vue`, `app/app.vue`), rotas, `main.css`, `tailwind.config.js`.
- Alterar `docs/01` (conferência apenas; edits só se divergência real for encontrada).
- Mudar numeração/das seções, layout, hierarquia ou comportamento interno da vitrine (estados reativos, emits, navegação interna da demo).

## Decisions

**D1 — Mapeamento de domínio (FinancePro → Publications), 1:1 por bloco de demo:**

| Bloco em `design.vue` | De (FinancePro) | Para (Publications) |
| --- | --- | --- |
| Meta/título (L57-59, L590) | "Design System & Guia de Estilo - FinancePro" | "Design System & Guia de Estilo - Publications (Dicas Teorema)" |
| Tabela §13 (33 NF-e, cols. documento/fornecedor/centroCusto/filial/valores) | Lançamentos Fiscais | "Releases Week Semanal": `codigo` (`REL-2026-W39`…), `titulo`, `tipo` (Release/Manual/Escopo), `dataPublicacao`, `status`, `responsavel` — colunas `groupable`/`sortable`/`isNumeric` preservadas (trocar valores monetários por contagens/tamanhos exibíveis, mantendo pelo menos 1-2 colunas `isNumeric` para os totalizadores da direita-clique) |
| Inputs §5 (filial, CNPJ, razão social, teto orçamentário) | Fiscal/contábil | Slug da Publicação (mono + erro), Título, Responsável, Versão (`v1.4.0`), com erros/ajudas equivalentes |
| Select §9 (plano de contas, SPED, filiais) | Fiscal | Tipos de publicação (Release Week Semanal · Manual · Escopo de Projetos) + exemplos de badge/description do doc |
| Toasts §8 (conciliação, SEFAZ, fechamento contábil) | Financeiro | `toast.success('Release Publicada', ...)`, `toast.warning('Revisão Pendente', ...)`, `toast.danger('Falha no Upload', ...)` (mesmos 3 tipos + custom) |
| CheckCards §11 (Matriz/Filial + CNPJ) | Empresas/filiais | Releases Week / Manual / Escopo de Projetos (+ 4º card para manter grade), badges do domínio |
| KPIs §12 (Conciliações Pendentes, Índice de Conciliação) | Financeiro | Publicações na Semana / Aguardando Revisão / etc. (mesmos `cor`/`tendencia`) |
| Demo shell §14 (Matriz/Filial, Trocar Filial, menu "Lançamentos Fiscais") | Multi-filial | Sem seletor de empresa (doc 01 §3.1); sessões "Publicações"/"Administração"; item ativo equivalente |
| Checkbox/chips ("Reconciliados", "Índigo (Conciliado)") | Conciliação | Rótulos do domínio via **slot `default`** onde fizer sentido (ex.: `<UiBadge variant="done">Publicado</UiBadge>`), mantendo `variant="reconciled"` demonstrado como legada (doc 01 §5.2) |
| Erros/variáveis (`erroFilial`, `filialSelecionada`, `empresaAtiva`, `cardFilialSp/Rj/Mg`) | Filial | Nomes equivalentes (`erroTipoPublicacao`, `tipoSelecionado`, `cardReleases`, `cardManuais`, `cardEscopo`) — renomear refs e bindings junto |

**D2 — Manter invariantes da vitrine:** ids de navegação interna (`principios`, `cores`, … `modal`), ordem das seções, quantidade de exemplos por seção, props exercitadas e todas as classes visuais. A troca é de *dados e rótulos*, não de estrutura — assim `docs/01` (que referencia a seção N do `/design`) continua válido sem edição.

**D3 — Alternativa descartada:** reescrever/remover seções ou reduzir a vitrine — quebraria a cobertura de demonstração dos componentes e as referências do doc 01 (seções numeradas).

**D4 — Verificação:** `npm run build` (única verificação real do repo) + greps de regressão por termo (`FinancePro`, `filial`, `Matriz`, `CNPJ`, `SEFAZ`, `NF-e`, `fornecedor`, `concilia`, `contábil`, `SPED`, `tenant`, `razão`, `lote`) sobre `app/pages/design.vue`, comparando ao baseline atual (142 matches → 0 para o padrão de domínio).

## Risks / Trade-offs

- [Dados fictícios novos introduzem bugs de binding (refs renomeadas)] → renomear ref + todos os usos no mesmo commit; build do Nuxt captura erros de template (Vue compila templates em dev/build).
- [Perda acidental de cobertura de demo (uma prop/esquecida)] → checklist por seção no tasks.md espelhando a lista de seções atual; conferência visual via `npm run dev` nas 15 seções.
- [Coluna `isNumeric` sumir quebra a demo de totalizadores] → manter ≥2 colunas numéricas no dataset novo (ex.: páginas/itens de conteúdo).
- [Terminologia nova divergir do doc 01] → vocabulário extraído exclusivamente de `docs/01` (status Publicado/Agendado/Em Revisão/Rascunho/Bloqueado, exemplos `REL-2026-W39`).

## Migration Plan

Edição única e atômica em `app/pages/design.vue` (não há dados persistidos nem API). Rollback = reverter o commit. Verificação: greps + `npm run build` ao final.

## Open Questions

- (nenhuma — escopo, vocabulário e fonte da verdade definidos com o usuário)
