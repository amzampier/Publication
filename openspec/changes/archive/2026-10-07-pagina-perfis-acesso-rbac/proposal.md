# Proposal

## Why

O item "Perfis de Acesso (RBAC)" da sidebar e do menu da conta existe desde o desenho do shell,
mas **não tem rota nem tela** — é o único item da sessão Administração sem navegação (`docs/06`
§12 registra a pendência). Sem essa tela não há como visualizar os perfis de acesso do sistema,
não há lugar onde a matriz de permissões viva, e a fase 2 (modal de permissões por perfil) não
tem superfície para se apoiar. Este change entrega a **página principal** (fase 1, em memória,
sem modais) e o **`docs/07`** que normatiza a matriz 4 perfis × 11 módulos × 9 ações que o modal
futuro implementará.

## What Changes

- **Nova página** `/admin/perfis-acesso` com o shell da Área Administrativa: cabeçalho com
  identidade do módulo (tile `ShieldCheck` `#f5b302`), 4 KPIs, `UiDataTable` com as colunas
  Nome, Descrição, Usuários, Permissões, Status e Ações — tudo em memória
  (`useState`), sem nenhuma requisição HTTP e **sem nenhum `UiModal`**.
- **Novos componentes de domínio** em `app/components/perfis/` (auto-import `Perfis*`):
  `Cabecalho.vue`, `Kpis.vue`, `Tabela.vue` e `usePerfisDemo.ts` (estado + matriz semeada).
- **Navegação:** o item da sidebar (`perfis-rbac`) e o item do menu da conta ganham
  `to: '/admin/perfis-acesso'` (navegam e ficam ativos na rota, conforme
  `design-system/layout-navigation`), e o rótulo do menu da conta passa de
  "Configuração de Perfis (RBAC)" para **"Perfis de Acesso (RBAC)"** (unificação com a sidebar
  e com a página, como já feito para Usuários e Auditoria).
- **Ações em contrato de transição:** "Novo Perfil", Editar, Excluir e Permissões
  (ícone `KeyRound`) exibem toast "funcionalidade disponível na próxima etapa" e não abrem
  modal — os modais (CRUD de perfil, filtros e permissões) são a fase 2.
- **Matriz de permissões semeada em memória:** 4 perfis demo × 11 módulos × 9 ações, com as
  contagens derivadas (`99/99`, `45/99`, `21/99`, `6/99`) exibidas na coluna Permissões e nos
  KPIs; a coluna Usuários é derivada da base de `useUsuariosDemo`.
- **Nova documentação** `docs/07 - Perfis de Acesso (RBAC).md` (estrutura de 12 seções de
  `05`/`06`) com a seção normativa da matriz de permissões, além das atualizações de
  cross-reference em `docs/01`, `docs/03`, `docs/05` e `docs/06`.
- **Nenhum componente novo de kit** e nenhuma mudança em `docs/01` §5 (componentes) — a fase 1
  usa apenas `UiButton`, `UiBadge`, `UiKpi`, `UiDataTable` e `UiTooltip` já existentes.

## Capabilities

### New Capabilities

- `perfis-acesso`: página principal de Perfis de Acesso (RBAC) — rota e identidade do módulo,
  navegação pela sidebar e menu da conta, KPIs derivados do conjunto vigente, listagem em
  `UiDataTable` com contagem de permissões e de usuários vinculados, ações em contrato de
  transição (toast, sem modal), base em memória e `docs/07` como fonte normativa da matriz.

### Modified Capabilities

- `design-system/layout-navigation`: o requisito do menu do Account passa a nomear o item como
  **"Perfis de Acesso (RBAC)"** (era "Configuração de Perfis (RBAC)"), mantendo a ordem
  canônica; o item passa a declarar rota, comportamento já coberto pelo requisito de itens com
  `to`.

## Impact

- **Arquivos novos:** `app/pages/admin/perfis-acesso.vue`,
  `app/components/perfis/{Cabecalho,Kpis,Tabela}.vue`, `app/components/perfis/usePerfisDemo.ts`,
  `docs/07 - Perfis de Acesso (RBAC).md`.
- **Arquivos alterados:** `app/config/navigation.ts` (2 itens: `to` + rótulo da conta),
  `docs/01 - design_system.md` (§3.2 menu do Account), `docs/03 - Header e Sidebar.md`,
  `docs/05 - Gestão de Auditoria.md` e `docs/06 - Gestão de Usuários.md` (menções de item sem
  rota).
- **Spec alterada:** `openspec/specs/design-system/layout-navigation/spec.md` (rótulo do item
  do menu do Account).
- **Sem impacto:** `app/components/ui/**` (kit intocado), vitrine `/design` (nenhuma seção nova),
  `server/` (inexistente), demais páginas `/admin/**`.
- **Verificação:** `npm run build` + conferência visual em `/admin/perfis-acesso`,
  `/admin/gestao-usuarios` e `/design`. QA roda depois, como passo separado.
