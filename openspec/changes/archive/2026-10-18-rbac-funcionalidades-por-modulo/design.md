# Design

## Context

Ver `proposal.md` — Why. Hoje o RBAC usa um vocabulário único de 9 ações para os 11 módulos
(`server/utils/perfis.ts` `ACOES_IDS`, `app/components/perfis/usePerfisModelo.ts` `ACOES`+`EXTRAS`,
`PERMISSOES_POR_PERFIL = 11 × 9 = 99`), renderizado igualmente por `Permissoes.vue` em cada módulo.
As funcionalidades reais de cada módulo (filtros, busca, exportar, configurar permissões) não são
representáveis, e `exportar`/`filtrar`/`buscar` não têm imposição no servidor.

O armazenamento é `permissoes_perfil(perfil_id, modulo, pode_visualizar, pode_incluir, pode_editar,
pode_excluir, extras JSON)` (`docs/02` §3.5). `validarMatriz` aceita qualquer uma das 9 ações em
qualquer módulo.

## Goals / Non-Goals

**Goals:**
- Catálogo de funcionalidades **por módulo** como fonte única (UI + validação + contadores).
- Representar filtros, busca, exportar, importar e "Configurar Permissões", permitindo
  conceder/negar por perfil.
- Imposição no servidor onde há operação/consulta; gating de interface onde a funcionalidade é só de
  experiência (filtros client-side).
- Alinhar seed, `docs/07`, `docs/02` §3.5 e specs.

**Non-Goals:**
- Migrar para uma tabela genérica `permissoes(perfil_id, modulo, acao)` (modelo fiel) — evolução futura.
- Mover a filtragem dos módulos client-side (Softwares/Parceiros/Perfis) para o servidor.
- Permissionar KPIs, ordenação, paginação e colunas.

## Decisions

### D1 — Catálogo de funcionalidades por módulo (fonte única)

`FUNCIONALIDADES_POR_MODULO` (espelhado `server/utils/perfis.ts` ↔ `usePerfisModelo.ts`):

```
MODULO               fixas (colunas)                    extras (JSON)
-------------------  ---------------------------------  ----------------------------------------------
Softwares            visualizar criar alterar excluir   importar exportar filtrar buscar
Parceiros            visualizar criar alterar excluir   importar exportar filtrar buscar
Gestao de Usuarios   visualizar criar alterar excluir   importar exportar filtrar buscar
Perfis de Acesso     visualizar criar alterar excluir   permissoes exportar filtrar buscar
Gestao de Auditoria  visualizar                         exportar filtrar buscar
Configuracoes Glob.  visualizar alterar                 (nenhuma)
Manuais              visualizar criar alterar excluir   publicar arquivar download exportar importar filtrar buscar
Release Week         visualizar criar alterar excluir   publicar arquivar download exportar importar filtrar buscar
Escopo de Projetos   visualizar criar alterar excluir   publicar arquivar download exportar importar filtrar buscar
Esteira de Revisao   visualizar alterar                 publicar arquivar filtrar
Lancar as Chamadas   visualizar criar alterar excluir   publicar arquivar download filtrar buscar
```

Total do catálogo (11 módulos) = **85**. Contadores passam de "n/99" para "n/85"; `PERMISSOES_POR_PERFIL`
deixa de ser `11×9` e passa a ser a soma dos catálogos.

### D2 — Reusar o schema atual (`extras` JSON)

Mantém-se `permissoes_perfil` (4 colunas + `extras`). As funcionalidades específicas — incluindo as
novas `filtrar`, `buscar`, `permissoes` — vivem no `extras`. As 4 colunas continuam sendo o núcleo
onde o módulo tem `criar`/`excluir`; em Auditoria/Configurações elas ficam 0 e **não são exibidas**
nem aceitas pelo catálogo.

- *Alternativa* (tabela genérica): mais fiel, porém exige migration que quebra as 4 colunas em linhas
  e reescreve seed/docs — fica como evolução.

### D3 — `validarMatriz` por catálogo

A validação passa a aceitar apenas as funcionalidades do módulo (recusa `publicar` em Perfis, etc.),
mantendo o `400` para módulo/funcionalidade desconhecidos.

### D4 — Imposição no servidor

```
Funcionalidade                       Onde e' imposta
-----------------------------------  ------------------------------------------------
visualizar criar alterar excluir      rotas CRUD (ja' existentes)
importar                             rotas /importar (ja' existentes)
exportar                             GET ?exportar=1 (softwares/parceiros/perfis) e
                                     usuarios/auditoria (param ja' existente)
permissoes                           PUT /api/perfis/:id/permissoes e .../copiar
filtrar / buscar                     usuarios/auditoria (server-side); UI nos demais
```

O padrão `?exportar=1` já existe em Usuários e Auditoria; passa a existir em Softwares, Parceiros e
Perfis, chamado pelos botões de exportação antes de gerar o arquivo.

### D5 — Gating de interface via `.can()`

O helper `.can(modulo, funcionalidade)` esconde/desabilita o botão "Filtros", o campo de busca, as
exportações, a importação e a ação "Permissões". Nesta mudança o helper deixa de ser "disponível sem
exigir ocultar" (autorizacao-rbac) e passa a ser efetivamente aplicado.

### D6 — Seed e totais (matriz normativa)

Matrizes semeadas reformuladas sobre o catálogo (referência `docs/07` §7):

| Perfil | Contagem |
| :--- | :--- |
| Administrador | `85/85` |
| Editor | `61/85` |
| Revisor | `37/85` |
| Leitor | `12/85` |

KPI "Permissões concedidas" da base semeada = `195/340` (195 = soma; denominador = 4 perfis × 85).

### D7 — Módulos de conteúdo com catálogo genérico

Manuais/Release/Escopo/Esteira/Chamadas recebem o catálogo genérico acima até serem construídos; a
matriz já os representa.

## Risks / Trade-offs

- **Renomear/ampliar o vocabulário quebra números fixos** (docs/07, seed, textos) → tratado no mesmo
  change com recálculo e referência única ao `docs/07`.
- **Schema "mentiroso"** (colunas `criar`/`excluir` em módulos que não as têm) → aceito sob D2; a
  exibição/validação é guiada pelo catálogo.
- **Filtros client-side são UI-only** → o dado permanece visível por `visualizar`; documentado como
  restrição de experiência, não de segurança.
- **Contadores/KPIs e testes** dependem do total 83 → centralizar em uma constante para evitar drift.

## Migration Plan

- **Sem migration destrutiva**: as novas funcionalidades cabem no `extras` JSON já existente.
- `02_seed.sql` é atualizado (matrizes). Bases existentes mantêm o que está gravado; a UI já reflete o
  catálogo (ações fora do catálogo de um módulo, se existirem no banco, não são exibidas/válidas).
- Rollback: reverter seed/código; nenhuma coluna ou tabela é removida.

## Open Questions

- Nenhuma. A evolução para tabela genérica `permissoes(...)` fica registrada como não-objetivo.
