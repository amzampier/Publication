# Proposal

## Why

A navegação já anuncia "Gestão de Usuários" na sidebar e no menu da conta, mas o item não tem rota e não existe nenhuma tela de usuários — enquanto o `docs/02` §3.5/§7 já descreve as tabelas `usuarios` e `perfis` (RBAC) que virão. A etapa frontend precisa entregar a página principal e suas opções como fase 1 em memória (sem `server/`), componentizada no padrão de Auditoria/Configurações Globais e documentada em `docs/06`, deixando os modais (cadastro/edição, importação, filtros) para a fase seguinte.

## What Changes

- **Nova rota `/admin/gestao-usuarios`** (`layout: 'admin'`, shell herdado) com a página principal de gestão de usuários em memória (fase 1, sem chamadas de rede).
- **Navegação:** `to: '/admin/gestao-usuarios'` nos dois itens "Gestão de Usuários" (sidebar e menu da conta) de `app/config/navigation.ts` — hoje eles só marcam estado visual; com a rota, o item da sidebar passa a refletir a página ativa.
- **Componentização de domínio** em `app/components/usuarios/` (auto-import `Usuarios*`):
  - `Cabecalho` — tile `Users` `#b070ef`, título/subtítulo, menu **Relatórios** (`NotebookText` → Ficha Cadastral, Relação Completa, Exportar em CSV) à esquerda do botão primário **Novo Usuário**, no padrão do `AuditoriaCabecalho`;
  - `Kpis` — 4 `UiKpi` (Total, Ativos, Inativos, Perfis distintos) derivados do conjunto filtrado;
  - `Tabela` — `UiDataTable` com busca, ícone **Importar** solto (slot `#filtersLeft`, hover com cor + tooltip "Importar Novos Usuários") à esquerda do botão **Filtros** (`showFilters`/`filtersCount`/`open-filters`), colunas Nome · E-mail · Perfil (`UiBadge`) · Status (`UiBadge`) · Último acesso e slot `#actions` (convite `MailCheck`, bloquear `Lock`, editar, excluir — ícones menores com cores semânticas);
  - `useUsuariosDemo` — tipos, perfis/usuários demo, filtros (`useState`) e conjunto filtrado, espelho do `useAuditoriaDemo`;
  - `gerarPdfUsuarios` — gera `usuarios.pdf` em A4 paisagem (`jspdf` + `jspdf-autotable`, já usados pela Auditoria).
- **Ações sem modal na fase 1 → toast "em breve":** `Novo Usuário`, **Importar**, botão **Filtros** da toolbar e as 4 ações de linha (enviar o convite, bloquear, editar, excluir) exibem toast informando que a funcionalidade vem na próxima etapa — nenhum `UiModal` é criado nesta change.
- **Documentação:** novo `docs/06 - Gestão de Usuários.md` (gabarito do `docs/05`: visão geral/rota, componentização, componentes, comportamento, dados demo, navegação, vitrine, specs, verificação, pendências).
- **Sem componente novo de kit, sem dependência nova e sem mudança na vitrine `/design`** (`package.json` intocado) — tudo compõe `Ui*` existentes; a única extensão de kit é o slot opt-in `filtersLeft` no `UiDataTable` (consumidores sem o slot continuam idênticos).

## Capabilities

### New Capabilities

- `gestao-usuarios`: página principal de gestão de usuários — rota/shell, pontos de entrada na navegação, KPIs derivados do conjunto filtrado, tabela com busca/paginação/ordenação e badges de perfil/status, exportação CSV/PDF, ações de fase 1 sem modal (toast) e fase 1 sem persistência.

### Modified Capabilities

<!-- Nenhuma. design-system/layout-navigation já prevê `to` opcional nos itens
     (Requirement: "Itens de navegação podem declarar rota e o ativo reflete a
     rota atual") — declarar a rota de Gestão de Usuários é uso do requisito
     existente, não mudança de requisito. -->

## Impact

- **Código:** novos `app/pages/admin/gestao-usuarios.vue` e `app/components/usuarios/*` (6 peças); alterados `app/config/navigation.ts` (2 itens ganham `to`) e `app/components/ui/DataTable.vue` (slot opt-in `filtersLeft`).
- **Specs:** novo delta `specs/gestao-usuarios/spec.md` (ADDED); nenhum delta em capacidades existentes.
- **Docs:** novo `docs/06 - Gestão de Usuários.md`; `docs/01` §5.11 atualizado (slot `filtersLeft`); `docs/02`, `docs/03` e a vitrine `/design` **inalterados**.
- **Fora de escopo:** modais (cadastro/edição, importação, filtros), novos componentes de kit, dependências, `server/`/persistência/autenticação, itens de navegação ainda sem rota (Perfis RBAC, Painel Executivo).
