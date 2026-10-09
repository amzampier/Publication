# Proposal

## Why

A listagem de Perfis de Acesso é a única tela administrativa sem os dois controles
estruturais que as irmãs já têm: **filtros** na toolbar da tabela e **exportação** no
cabeçalho (`docs/07` §5 registra a ausência como pendência "§13"). Sem isso, refinar a
base (ex.: só perfis com vínculo, só Inativos) exige busca textual que não muda o
conjunto — nem os KPIs — e não há como tirar a lista do sistema em CSV/PDF.

## What Changes

- **Modal de filtros** (`PerfisFiltros`, novo): botão "Filtros" da toolbar do
  `UiDataTable` (props já existentes do kit `showFilters`/`filtersCount`/`open-filters`)
  abre modal `sm` com duas sessões — **Perfil** (nomes da base) e **Status**
  (Ativo/Inativo/Bloqueado) — no molde exato de `UsuariosFiltros` (rascunho,
  Aplicar/Cancelar/Escape/X, Limpar Filtros, badge 0..2).
- **Conjunto filtrado**: aplicado o filtro, **tabela, KPIs e exportações** passam a
  refletir somente o conjunto filtrado (como em `gestao-usuarios`); a busca textual do
  `UiDataTable` continua visual (não altera conjunto nem KPIs — spec vigente mantida).
- **Menu "Relatórios"** no cabeçalho (à esquerda de "Novo Perfil", molde do
  `UsuariosCabecalho`): **"Relação de perfis"** (PDF paisagem, `perfis.pdf`, logo de
  login + colunas Nome/Descrição/Status/Usuários/Permissões) e **"Exportar em CSV"**
  (`perfis.csv`, `;` + BOM UTF-8), divisor entre PDF e CSV, sobre o conjunto filtrado.
- **Componentes novos**: `perfis/Filtros.vue` e `perfis/gerarPdfPerfis.ts`; consumo de
  `perfisFiltrados`/`filtrosAtivosCount`/`limparFiltros` no composable
  `perfis/usePerfisDemo.ts`.
- Sem mudança de kit, sem mudança de vitrine, sem HTTP (fase 1 em memória; filtros e
  exportações descartam na recarga).

## Capabilities

### New Capabilities

_(nenhuma — tudo cabe na capability existente)_

### Modified Capabilities

- `perfis-acesso`:
  - **ADDED** "A exportação gera arquivos sobre o conjunto de perfis vigente" —
    menu "Relatórios" no cabeçalho (PDF + CSV, divisor, sem `window.print()`);
  - **ADDED** "O modal de filtros refina o conjunto vigente de perfis" — modal `sm`
    com sessões "Perfil" e "Status", rascunho, badge 0..2, tabela/KPIs/exportações
    sobre o conjunto filtrado, memória + descarte na recarga;
  - **MODIFIED** "Os KPIs refletem o conjunto vigente de perfis" — o conjunto vigente
    passa a incluir a refinação por filtro do módulo (cenário novo, espelho da spec de
    `gestao-usuarios`).

## Impact

- **Código**: `app/components/perfis/usePerfisDemo.ts` (estado de filtros),
  `app/components/perfis/Cabecalho.vue` (menu Relatórios), `app/components/perfis/Tabela.vue`
  (`show-filters` + dados filtrados), `app/components/perfis/Kpis.vue` (conjunto filtrado),
  `app/pages/admin/perfis-acesso.vue` (coordenação do modal); **novos**
  `app/components/perfis/Filtros.vue` e `app/components/perfis/gerarPdfPerfis.ts`.
- **Dependências**: nenhuma nova (`jspdf`/`jspdf-autotable` já usados por
  `gerarPdfUsuarios`).
- **Docs**: `docs/07 - Perfis de Acesso (RBAC).md` (§5 remove a ausência; nova seção
  dos filtros/exportação; change-log v1.5.0).
- **Specs**: só `perfis-acesso` (2 ADDED + 1 MODIFIED); nenhum outro capability afetado.
- **Não afeta**: Área Pública, shell, outros módulos admin, backend (bloco C).
