# Proposal

## Why

O módulo de movimentos (lançamento de chamadas e esteira de revisão) precisa de lugar próprio na navegação: hoje a sidebar só tem Publicações, Cadastros e Administração, e o novo fluxo de negócio não cabe em nenhuma delas. A árvore de sessões é enumerada por extenso nas specs `layout-navigation` e `configuracoes-globais` e nos docs, então adicioná-la exige sincronizar essas três fontes — não só o `navigation.ts`.

## What Changes

- **Novo grupo "Movimentos" na sidebar**, logo após **Publicações** (ordem final: Publicações → Movimentos → Cadastros → Administração), com dois itens **sem rota** (mesmo padrão de Manuais/Parceiros): **Esteira de Revisão** (`Workflow`, cor `#8b5cf6`) e **Lançar as Chamadas** (`Megaphone`, cor `#f59e0b`), sessão iniciando `aberto: true`.
- **`configuracoes/AbaSidebar.vue`**: registro de ícone da sessão "Movimentos" no mapa `iconeDaSessao` (hoje hardcoded para as três sessões; sem entrada cairia no fallback `Folder`) e alinhamento do fallback de `estaAberta` com o do `AppSidebar` (`?? sessao.aberto`) para card e sidebar não discordarem quando a chave de estado faltar.
- **Specs MODIFIED**: `design-system/layout-navigation` (quatro sessões, ordem, 9 → 11 itens, cenários de árvore e vitrine) e `configuracoes-globais` (cartão por sessão inclui Movimentos; cenário de escolha múltipla cita as quatro sessões).
- **Docs**: `docs/01` §sidebar (lista de sessões + tabela de cores), `docs/03` (árvore de navegação), `docs/04` (enumeração das sessões no painel de sidebar).
- **Automático, sem código extra**: `AppSidebar` (expandido e rail com divisores), `useSessoesAbertas`, presets "Todas/Todas recolhidas" e a vitrine `/design` derivam do mesmo `sessoes[]`.

Sem mudança de comportamento de dados: nenhum handler, estado persistido ou dependência nova.

## Capabilities

### New Capabilities

*(nenhuma)*

### Modified Capabilities

- `design-system/layout-navigation`: o requirement da árvore canônica passa a exigir **quatro** sessões — **Publicações** (Manuais, Release Week, Escopo de Projetos), **Movimentos** (Esteira de Revisão, Lançar as Chamadas), **Cadastros** (Parceiros, Softwares) e **Administração** (Gestão de Usuários, Perfis de Acesso (RBAC), Auditoria, Configurações Globais), com 11 itens; o requirement da fonte única/vitrine passa a citar as quatro sessões no espelho da seção 14.
- `configuracoes-globais`: o requirement do painel de sidebar passa a exigir **um cartão por sessão incluindo Movimentos** (quatro cartões) e o cenário de escolha múltipla passa a refletir as quatro sessões.

## Impact

- **Código**: `app/config/navigation.ts` (nova sessão e itens), `app/components/configuracoes/AbaSidebar.vue` (ícone da sessão + fallback de `estaAberta`).
- **Specs**: deltas em `openspec/specs/design-system/layout-navigation/spec.md` e `openspec/specs/configuracoes-globais/spec.md`.
- **Docs**: `docs/01 - design_system.md` (§sidebar: sessões e cores), `docs/03 - Header e Sidebar.md` (árvore), `docs/04 - Configurações Gerais.md` (enumeração das sessões).
- **Sem toque**: `AppSidebar`, `useSessoesAbertas`, vitrine `/design`, menu do Account, páginas (os itens ficam sem `to` até as telas existirem).
- **Dependências**: nenhuma nova.
- **Verificação**: `npm run build` + conferência visual em `/admin` (sidebar) e `/admin/configuracoes-globais` (aba Sidebar).
