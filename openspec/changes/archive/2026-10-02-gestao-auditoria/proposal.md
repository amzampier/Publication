# Proposal

## Why

A navegação já anuncia as páginas "Auditoria" (sidebar) e "Gestão de Auditoria" (menu da conta), mas nenhum dos itens tem rota e não existe nenhuma tela que exiba os registros de auditoria que o `docs/02` §3.6 descreve (`registrarAuditoria`: ação, recurso, detalhes, data/hora, IP, usuário). Sem `server/`, a etapa frontend precisa entregar a página de consulta completa — componentizada, documentada em `docs/05` e com spec própria — como fase 1 em memória, seguindo o padrão já consolidado em Configurações Globais. De quebra, a toolbar do `UiDataTable` ganha o padrão do design system na busca e um botão **Filtros** pronto para as próximas páginas de listagem.

## What Changes

- **Nova rota `/admin/auditoria`** (`layout: 'admin'`, shell herdado) com página de consulta de logs de auditoria em memória (fase 1, sem chamadas de rede).
- **Navegação:** `to: '/admin/auditoria'` nos dois itens "Gestão de Auditoria" (sidebar e menu da conta — rótulo unificado na sidebar nesta change) de `app/config/navigation.ts`, com item ativo refletindo a rota.
- **Componente de kit `UiDataTable` (toolbar):** a busca global deixa o `<input>` hand-rolled e passa a usar o `UiInput` do kit (lupa, controle de limpar, foco `brand-focus` recortado — padrão do DS); novo botão **"Filtros"** à direita da busca, opt-in por `showFilters`, com badge de `filtersCount` e emit `open-filters` — qualquer página de listagem futura já nasce com ele.
- **Componentização de domínio** em `app/components/auditoria/` (auto-import `Auditoria*`): `Cabecalho` (título + botão **Exportar** com menu), `Kpis` (4 `UiKpi` derivados do conjunto filtrado), `Filtros` (`UiModal` com período/usuário/ação/recurso + Aplicar/Limpar, aberto pelo botão da toolbar da tabela), `Tabela` (`UiDataTable` com `show-filters`/`filters-count`/`@open-filters`, colunas data/hora, usuário, ação em `UiBadge`, recurso, detalhes, IP e slot `#actions` abrindo o detalhe), `Detalhe` (`UiModal` com todos os campos do registro) e o composable `useAuditoriaDemo` (~25 registros + filtros + conjunto filtrado).
- **Exportação sobre os registros filtrados:** "Exportar em CSV" (Blob + download, com BOM UTF-8) e "Listar em PDF" (`window.print()` usando o `@media print` já existente em `main.css`, que oculta shell e botões) — menu mini `role=menu` dentro do `Cabecalho`, no padrão do menu da conta do `AppHeader`.
- **Correção de nomenclatura canônica da tabela:** `logs_auditoria` → `auditoria` em `AbaRetencaoAuditoria.vue` (query do banner) e na `docs/04` — alinhando ao `docs/02` e à spec `configuracoes-globais`.
- **`UiTooltip` (kit):** o balão passa a abrir no foco **apenas quando o foco é de teclado** (`:focus-visible`) — o foco programático do `UiModal` (botão X ao abrir) não exibe mais o tooltip "Fechar" sem hover.
- **Documentação:** novo `docs/05 - Gestão de Auditoria.md` (esqueleto do `docs/04`), `docs/01` §5.11 (props/emits/busca novos do `UiDataTable`) e §5.5 (abertura do tooltip por foco); vitrine `/design` §13 ganha a demo do botão Filtros.
- **Sem componente novo de kit e sem dependência nova** (`package.json` intocado) — o `UiDataTable` é componente de kit **existente** apenas evoluído.

## Capabilities

### New Capabilities

- `auditoria`: página de consulta de logs de auditoria — rota/shell, pontos de entrada na navegação, KPIs derivados do conjunto filtrado, filtros estruturais em modal aberto pela toolbar da tabela, tabela com paginação/ordenação/busca e detalhe do registro, exportação CSV/PDF e fase 1 sem persistência.
- `design-system/data-table`: toolbar da tabela — busca no padrão do controle de input do design system e botão Filtros opcional à direita (`showFilters`/`filtersCount`/`open-filters`), preservando a toolbar atual quando o botão não é solicitado.

### Modified Capabilities

- `configuracoes-globais`: o requirement de textos derivados da retenção passa a exigir que a query de expurgo exibida no banner use o nome canônico da tabela `auditoria` (hoje o código da aba exibe `logs_auditoria`, divergindo do `docs/02`).
- `design-system/layout-navigation`: o rótulo do item da sidebar na sessão Administração passa de "Auditoria" para "Gestão de Auditoria" (unificado com o título da página e o menu da conta).

## Impact

- **Código:** novos `app/pages/admin/auditoria.vue` e `app/components/auditoria/*` (6 peças); alterados `app/components/ui/DataTable.vue`, `app/components/ui/Tooltip.vue` (busca → `UiInput`, props `showFilters`/`filtersCount`, emit `open-filters`), `app/config/navigation.ts` (2 itens ganham `to`), `app/components/configuracoes/AbaRetencaoAuditoria.vue` (1 linha da query) e `app/pages/design.vue` (demo §13).
- **Specs:** deltas `specs/auditoria/spec.md` (ADDED), `specs/design-system/data-table/spec.md` (ADDED) + `specs/configuracoes-globais/spec.md` (MODIFIED).
- **Docs:** novo `docs/05 - Gestão de Auditoria.md`; `docs/01` §5.11 (toolbar do DataTable); `docs/04` (query do banner); `docs/02` **inalterado**.
- **Fora de escopo:** novos componentes de kit, dependências, `server/`/persistência, os demais itens sem rota (Gestão de Usuários, RBAC, Painel Executivo — MEL-03 do RL01), comportamento de agrupamento/sort/paginação/totalizadores da tabela (inalterados).