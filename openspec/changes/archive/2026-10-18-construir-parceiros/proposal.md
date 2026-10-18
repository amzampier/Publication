# Proposal

## Why

O item **Parceiros** da sidebar (`app/config/navigation.ts`) nÃ£o tem rota e cai em "MÃ³dulo em
construÃ§Ã£o". A tabela `parceiros` jÃ¡ existe no banco (com FK `entregas_itens.parceiro_id`) e o
mÃ³dulo RBAC `parceiros` jÃ¡ estÃ¡ na matriz de permissÃµes, mas nÃ£o hÃ¡ tela, backend, spec de domÃ­nio
nem documentaÃ§Ã£o. O cadastro de parceiros (clientes, redes e distribuidoras) Ã© a base de relaÃ§Ãµes
de entrega do portal e precisa nascer alinhado a spec, design system e cÃ³digo.

## What Changes

- **Nova tela `/admin/parceiros`** (Ãrea Administrativa) com **listagem em grade de Cards** (nÃ£o
  `UiDataTable`), seguindo o molde das demais telas (CabeÃ§alho, KPIs, Filtros, FormulÃ¡rio,
  ExclusÃ£o e ImportaÃ§Ã£o).
- **Novo campo `codigo`** (`PAR-XXX`): identificador secundÃ¡rio **gerado pelo servidor**, Ãºnico,
  **nÃ£o Ã© chave primÃ¡ria** (a PK segue `id` UUID referenciada por `entregas_itens`).
- **Novo campo `regiao`** na tabela `parceiros`, posicionado **apÃ³s `estado`**; **derivado da UF**
  ao escolher o Estado (mapa UF â†’ RegiÃ£o do Brasil).
- **Novo campo `logo_url`**: a logo Ã© exibida **somente no cadastro/ediÃ§Ã£o** (nÃ£o aparece no card).
- **Backend real** para parceiros: `GET/POST/PUT/DELETE` por `id` e **importaÃ§Ã£o por planilha**
  (`POST /api/parceiros/importar`), com RBAC no mÃ³dulo `parceiros` e trilha de auditoria
  (recurso "Parceiros"); FK `entregas_itens` â†’ `409` na exclusÃ£o.
- **Componentes novos de kit**: `UiEntityCard` (card de entidade genÃ©rico, com aÃ§Ãµes no topo
  direito no hover/focus) e `UiPagination` (paginaÃ§Ã£o client-side da grade), adicionados ao
  design system e Ã  vitrine `/design` para avaliaÃ§Ã£o visual.
- **KPIs** apenas de **SituaÃ§Ã£o** (`Ativos`, `Inativos`, `Bloqueados`); **filtros** por
  SituaÃ§Ã£o, RegiÃ£o e Estado; **exportaÃ§Ãµes** PDF e CSV.
- **DocumentaÃ§Ã£o**: novo `docs/11 - MÃ³dulo de Parceiros.md`, modelo de importaÃ§Ã£o
  `docs/modelos/modelo-importacao-parceiros.xlsx` e atualizaÃ§Ã£o do design system (`docs/01`).

## Capabilities

### New Capabilities
- `parceiros`: cadastro e gestÃ£o de parceiros (clientes, redes e distribuidoras) â€” listagem em
  cards, cÃ³digo `PAR-XXX` gerado pelo servidor, regiÃ£o derivada da UF, logo no cadastro/ediÃ§Ã£o,
  modais de cadastro/ediÃ§Ã£o/exclusÃ£o, importaÃ§Ã£o por planilha e exportaÃ§Ãµes.

### Modified Capabilities
<!-- Nenhuma capability existente tem requirement alterado: trata-se de capability nova. -->

## Impact

- **Banco**: nova migration `15_parceiros_codigo_regiao_logo.sql` (`codigo` UNIQUE, `regiao` apÃ³s
  `estado`, `logo_url`) + espelho em `docs/bd/01 - banco_dados_mariadb.sql`. Tabela vazia â†’ sem
  risco para `NOT NULL`/`UNIQUE`.
- **Backend**: `server/utils/parceiros.ts`, `server/api/parceiros/**`,
  `server/utils/uploads.ts` (novo destino `logos` gated por `parceiros/alterar`).
- **Frontend**: `app/pages/admin/parceiros.vue`, `app/components/parceiros/**`,
  `app/components/ui/EntityCard.vue`, `app/components/ui/Pagination.vue`,
  `app/config/brasil.ts` (mapa `REGIAO_POR_UF`), `app/config/navigation.ts` (`to` do item).
- **Design system / vitrine**: `docs/01 - design_system.md` (Â§5.21/Â§5.22),
  `app/pages/design.vue` (seÃ§Ãµes 21 e 22).
- **Docs/tests**: `docs/11`, `docs/modelos/modelo-importacao-parceiros.xlsx`,
  `tests/parceiros-*.test.ts`.
