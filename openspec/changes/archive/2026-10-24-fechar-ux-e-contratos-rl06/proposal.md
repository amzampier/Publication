# Change: Fechar UX, acessibilidade e contratos documentais do RL06

## Why

A reauditoria do RL06 confirmou que o agrupamento server-side voltou a exibir dados, mas ainda não tem estado vazio, não é operável por teclado, mostra datas em ISO e conta apenas a página; a ordenação em modo servidor muda `aria-sort` sem reordenar; o drawer mobile não fecha ao navegar; o autocomplete de e-mails aceita `%`/`_` e não busca "contém"; e permanece uma dívida documental ampla (docs/qa/00, docs/15, docs/05, docs/bd/01, docs/02, docs/01, docs/17, docs/qa/03, specs e docs/18).

## What Changes

- `UiDataTable`: no modo servidor, ordenar emite/refaz a consulta; o estado vazio/erro cobre o modo agrupado; os cabeçalhos de grupo são focáveis com `aria-expanded`; a data do grupo usa o formato do módulo; a contagem informa "nesta página" no modo servidor; o nome da busca é configurável.
- `UiInput`/buscas: manter o nome acessível no `<input>` real (já corrigido) e cobrir os consumidores restantes.
- Drawer mobile: fechar ao selecionar um item de navegação.
- Autocomplete de e-mails: escapar `%`/`_`, exigir termo literal e buscar prefixo **ou** conteúdo.
- Lançar Chamadas: `salvando`/`loading` nas confirmações de aprovar/desaprovar/recusar/excluir e feedback de recarga da listagem.
- Auditoria/Usuários: "Limpar Filtros" limpa apenas o rascunho até "Aplicar".
- Contraste: eliminar `slate-400` de textos de apoio.
- Documentação: atualizar docs/qa/00, docs/15, docs/05 (tabela de 59), docs/bd/01 (32–35), docs/02 (árvore/middlewares/§3.4/§4.2), docs/01 (39 componentes e novos), docs/17 (KPI), docs/qa/03 (sem `USE`), docs/07, docs/06, docs/18 (comandos) e a vitrine `/design`; corrigir specs residuais (uploads Purpose, softwares `:codigo`, catálogo RBAC).
- Remover o handler órfão `GET /api/usuarios/emails/index.get.ts` e alinhar `docs/06`.

## Impact

- Affected specs: `design-system/data-table`, `design-system/layout-navigation`, `gestao-usuarios`, `lancar-chamadas`, `auditoria`, `autorizacao-rbac`, `softwares`, `entrega-assets`.
- Affected code/docs: `app/components/ui/DataTable.vue`, `app/components/layout/AppSidebar.vue`, `app/components/**/Filtros.vue`, `app/components/lancar-chamadas/**`, `server/utils/usuarios.ts`, `server/api/usuarios/emails*`, `app/pages/design.vue`, `docs/**`, `openspec/specs/uploads/spec.md`.
- Sem mudança de schema; sem alteração de dados.
- Risco: mudanças de UI/documentação; validar por gates, SSR e Chrome headless.

## Non-goals

- Bloqueadores de autorização/busca/Esteira 500 (change `corrigir-bloqueadores-rl06-final`).
- Performance de Painel/CSV/importação (change `otimizar-painel-esteira-entrega`).
- Área Pública de conteúdo e browser cross-browser.
