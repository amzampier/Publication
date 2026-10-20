# Proposal

## Why

A tabela `manuais_mensal` e o módulo RBAC `manuais` já existem, e o item **Manuais** está na sessão
*Publicações* da sidebar — mas é um **botão morto**: não há rota, página, contrato de tela nem spec.
Antes de construir o backend, o módulo precisa de uma página administrativa que materialize o
catálogo mensal (cabeçalho do mês, KPIs, filtros, ações de linha e os itens de cada mês), fixando o
contrato que a API servirá depois. Sem isso, a primeira implementação de backend inventa um recorte
e frontend/backend divergem — o mesmo problema que a fase frontend de Release Week resolveu.

## What Changes

- **Nova página `/admin/manuais`** (`app/pages/admin/manuais.vue`,
  `definePageMeta({ layout: 'admin' })`), fina e dona da coordenação, componentizada em
  `app/components/manuais/`.
- **Listagem do catálogo mensal**: código (`MAN-XX/AAAA`), título, mês/ano, status, autor, data de
  publicação, destaques e ações — em `UiDataTable`, com busca, filtros (Status, Ano, Mês, Autor,
  Destaque), ordenação e paginação no cliente.
- **Cinco KPIs** do conjunto vigente: Rascunho, Em Revisão, Alterações Solicitadas, Aprovado e
  Publicado.
- **Ações de linha**: **Novo Manual**, **Clonar**, **Editar**, **Publicar**, **Arquivar** e
  **Excluir** (condicionada). Arquivar é **soft** (`arquivada = true`, some da lista, nunca exclui).
  Excluir só é permitido quando o mês **não está arquivado** e **não possui itens/relacionamentos**.
- **Flag de itens no cabeçalho da tabela**: ao marcá-la surge um `+` por mês; o clique expande a
  linha exibindo os **itens do manual** (`entregas_itens` com `origem='Manual'`) em modo somente
  leitura, sob a permissão `visualizar_itens`.
- **Preparação de contrato (sem APIs)**: migration aditiva `21_add_manuais_arquivada.sql` cria a
  coluna `arquivada` + índice em `manuais_mensal`; migration idempotente
  `22_reconciliar_rbac_manuais.sql` acrescenta `clonar` (Administrador/Editor) e `visualizar_itens`
  (todos os perfis) ao módulo `manuais`, espelhando a Release Week.
- **RBAC**: o catálogo de `manuais` passa de 11 para 13 funcionalidades; o total do catálogo passa de
  **88 para 90**; a regra `clonar` exige `criar` passa a valer também para `manuais`. Atualizar
  `app/config/perfis.ts`, `server/utils/perfis.ts`, seeds, testes e `docs/07`.
- **Design system**: nova variante `alteracoes` no `UiBadge` (âmbar) para **Alterações Solicitadas**;
  `Rascunho → neutral`, `Em Revisão → inReview`, `Aprovado → reconciled`, `Publicado → publicado`.
  Atualizar `docs/01` e a vitrine `/design`.
- **Dataset em memória** (`useState`) nesta fase — permite exercitar as ações; é descartado no F5 e
  substituído pela API na fase backend. Nenhum seed de banco.
- **Exportações PDF/CSV** do conjunto filtrado e **ícone de importação** na toolbar como
  affordance (modal, parser, modelo `.xlsx` e gravação ficam para o backend).
- **Documentação**: novo `docs/13 - Módulo de Manuais Mensais.md`, espelhando o código.
- **Navegação**: o item `manuais` de `app/config/navigation.ts` passa a declarar
  `to: '/admin/manuais'`.

## Capabilities

### New Capabilities

- `manuais-mensais`: página administrativa do catálogo mensal de manuais na fase frontend —
  rota/shell, cabeçalho do mês (campos, status e `arquivada`), KPIs, listagem com
  filtros/busca/ordenação/paginação, ações (Novo, Clonar, Editar, Publicar, Arquivar e Excluir
  condicionada), flag de itens com expansão somente leitura, exportações PDF/CSV, affordance de
  importação, dataset em memória e navegação até a tela.

### Modified Capabilities

- `perfis-acesso`: o total do catálogo de funcionalidades passa de 88 para 90; `manuais` passa a
  oferecer `clonar` e `visualizar_itens`; as contagens normativas de perfil e o denominador do KPI
  de Permissões concedidas são atualizados; a regra que exige `criar` para conceder `clonar` passa a
  valer também para o módulo `manuais`.

## Impact

- **Código:** `app/pages/admin/manuais.vue` (novo); `app/components/manuais/` (`Cabecalho`, `Kpis`,
  `Tabela`, `Itens`, `Filtros`, `Formulario`, `Publicar`, `Arquivar`, `Exclusao`,
  `useManuaisModelo.ts`, `gerarPdfManuais.ts` — novos); `app/components/ui/Badge.vue` (variante);
  `app/pages/design.vue` (vitrine); `app/config/navigation.ts` (rota do item);
  `app/config/perfis.ts` e `server/utils/perfis.ts` (catálogo).
- **Banco:** `server/migration/21_add_manuais_arquivada.sql` e
  `server/migration/22_reconciliar_rbac_manuais.sql` (novos); `server/migration/02_seed.sql` e
  `docs/bd/02_seed.sql` (extras do módulo `manuais`); `docs/bd/01` (coluna `arquivada`).
- **Design system:** `docs/01 - design_system.md` (§5.2 Badge) e vitrine `/design` (seção 4).
- **Documentação:** `docs/13 - Módulo de Manuais Mensais.md` (novo); `docs/07 - Perfis de Acesso
  (RBAC).md` (catálogo, contagens e regra de clonagem).
- **Testes:** validadores do módulo (`tests/manuais-validadores.test.ts`), parser do modelo de
  importação se houver fixture, e `tests/perfis-funcionalidades.test.ts` (total 90 e regra
  `clonar`⇒`criar` em `manuais`).
- **Fora de escopo:** `server/api/**`, `server/utils/**` do módulo, CRUD de itens, anexos
  (`anexos_midias`), importação funcional, Área Pública, auditoria server-side e a troca do dataset
  em memória pela API.
