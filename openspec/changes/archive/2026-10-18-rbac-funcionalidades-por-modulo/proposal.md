# Proposal

## Why

A matriz de permissões usa hoje um **vocabulário único de 9 ações** (`visualizar`, `criar`,
`alterar`, `excluir`, `publicar`, `arquivar`, `download`, `exportar`, `importar`) para **todos** os 11
módulos. Isso não representa as funcionalidades reais de cada módulo: Perfis de Acesso exibe
`publicar`/`arquivar`/`download` (que não existem ali) e **não** representa "Configurar Permissões",
"Exportar" nem os **filtros**; Auditoria exibe ações inexistentes; e "exportar" não tem guarda no
servidor. O administrador não consegue conceder/negar, por perfil, as funcionalidades que cada módulo
realmente oferece (ex.: negar **filtros** ao usuário X).

## What Changes

- **Catálogo de funcionalidades por módulo** como fonte única (espelhado em
  `server/utils/perfis.ts` e `app/components/perfis/usePerfisModelo.ts`); a matriz passa a exibir
  somente as funcionalidades de cada módulo. O contador deixa de ser "n/99" e passa a "n/<total do
  catálogo>".
- **Novas funcionalidades** no `extras`: `filtrar`, `buscar` e `permissoes` (Configurar Permissões,
  hoje indistinguível de `alterar`), além das existentes (`publicar`, `arquivar`, `download`,
  `exportar`, `importar`). `validarMatriz` valida **por catálogo** (recusa, ex.: `publicar` em Perfis).
- **Imposição no servidor:** `?exportar=1` (Softwares/Parceiros/Perfis passam a exigir
  `<modulo>/exportar`); `permissoes` para a gravação/cópia da matriz de Perfis; `filtrar`/`buscar`
  reais em Gestão de Usuários e Auditoria (rails server-side).
- **Gating na UI** pelo helper `.can()`: esconde/desabilita Filtros, Busca, Exportar, Importar e a
  ação Permissões conforme o perfil.
- **Módulos de conteúdo** (Manuais, Release Week, Escopo, Esteira, Chamadas), ainda não construídos,
  recebem um catálogo genérico até serem implementados.

Mantém-se o **modelo de armazenamento atual** (`permissoes_perfil`: 4 colunas fixas +
`extras` JSON) — maior compatibilidade, sem migration destrutiva.

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova. -->

### Modified Capabilities
- `perfis-acesso`: a matriz e o modal de permissões passam a operar por **funcionalidades do módulo**
  (catálogo), com contadores derivados do catálogo (não mais "n/99"), e `permissoes` como ação própria.
- `autorizacao-rbac`: o catálogo de rotas ganha as guardas de `exportar`, `filtrar`, `buscar` e
  `permissoes`; o helper `.can()` passa a controlar a interface (filtros, busca, exportar, importar,
  permissões).

## Impact

- **Código:** `server/utils/perfis.ts`, `app/components/perfis/usePerfisModelo.ts`,
  `app/components/perfis/Permissoes.vue`, `app/components/perfis/Tabela.vue` (gating da ação),
  `server/api/softwares|parceiros|perfis/index.get.ts` (param `?exportar=1`),
  `server/api/auditoria/index.get.ts` e `server/api/usuarios/index.get.ts` (filtrar/buscar),
  `server/api/perfis/[id]/permissoes/**` (ação `permissoes`), botões de Filtros/Busca/Exportar/Importar
  dos módulos (gating `.can()`).
- **Docs/seed:** `server/migration/02_seed.sql`, `docs/07 §7` (tabelas e totais recalculados),
  `docs/02 §3.5`.
- **Specs:** `perfis-acesso` e `autorizacao-rbac` (deltas desta change).
- **Testes:** validação por catálogo e guardas de export/filtro.
