# Proposal — update-admin-shell-navigation

## Why

O shell da Área Administrativa ainda carrega resquícios de outro projeto (logo `FinancePro`, texto
"Matriz/Filial", item "Troca de Filial / Empresa", sessão "Governança & Multi-Filiais") que contradizem
a arquitetura de escopo único de `docs/02` §2.1, e a navegação existe em **três fontes divergentes**
(`config/navigation.ts`, vitrine §14 e `docs/01` §3.3) — nenhuma delas com a IA definitiva do sistema
(Publicações · Cadastros · Administração). Esta mudança estabelece a árvore de navegação canônica, o
menu do Account e uma referência única de comportamento (`docs/03 - Header e Sidebar.md` + spec
`design-system/layout-navigation`) para que código, vitrine, documentação e QA falem a mesma língua.

## What Changes

- **`app/config/navigation.ts`** — nova árvore de sessões:
  - `Publicações`: Manuais, Release Week, Escopo de Projetos
  - `Cadastros`: Parceiros, Softwares *(sessão nova)*
  - `Administração`: Gestão de Usuários, Perfis de Acesso (RBAC), Auditoria, Configurações Globais
  - `itemRaiz` "Painel Executivo" permanece acima das sessões.
- **Menu do Account** — ordem final: Meu Perfil · divisor · Configurações Globais · Gestão de Usuários ·
  Configuração de Perfis (RBAC) · **Gestão de Auditoria** *(novo)* · divisor · Encerrar Sessão.
- **BREAKING (dados)** — remoção dos exports/itens `empresaAtiva` e "Troca de Filial / Empresa"
  (`ArrowLeftRight`) e das sessões/itens "Governança & Multi-Filiais" e "Empresas & Filiais";
  `app/components/layout/AppHeader.vue` deixa de importar `empresaAtiva`.
- **`AppHeader.vue`** — logo `FinancePro` → `Publications`; remoção do bloco "Matriz/Filial" e do
  separador `#f59e8b` (`ml-[3cm]`) que existia só para ele. Sino de notificações e bloco Account
  permanecem com o markup atual (o conteúdo do menu vem dos dados).
- **`AppSidebar.vue`** — **sem mudança de markup**: renderiza `itemRaiz` + `sessoes` já existentes,
  com rail/tooltips atuais; muda apenas o dado consumido.
- **`app/pages/design.vue` §14** — a vitrine passa a importar os dados de `config/navigation.ts`
  (remove cópias locais `sidebarGrupos`/`accountMenuItens`), ganha o item raiz "Painel Executivo",
  menu `w-56` com dois divisores, logo `Publications` + ícone `Building2` (espelhando o header real).
- **`app/app.vue`** — passa a renderizar `<NuxtLayout><NuxtPage /></NuxtLayout>`: sem o
  `<NuxtLayout>`, Nuxt emite **NUXT_E4007** e `layouts/default.vue` nunca era montado — o header e a
  sidebar existiam no código mas **não apareciam em nenhuma rota** (somente a vitrine §14, que não usa
  layout). Habilitado por decisão do usuário durante a implementação.
- **`docs/01 - design_system.md` §3** — §3.1 (logo `Publications`; zona direita = sino + Account),
  §3.2 (ordem dos 6 itens do menu, largura `w-56`), §3.3 (item raiz + as 3 sessões).
- **`docs/03 - Header e Sidebar.md`** *(criado nesta fase)* — referência única da estrutura e do
  comportamento do shell; verificado contra a implementação ao concluir a mudança.
- **Sem mudança funcional** em rota, auth, larguras, cores ou estados de foco — os tokens `brand.*`
  e as regras de recorte permanecem intocados.

## Capabilities

### New Capabilities
- `design-system/layout-navigation`: estrutura e comportamento do shell da Área Administrativa —
  zonas do Header Dark, conteúdo e ordem do menu do Account, árvore de navegação da sidebar
  (item raiz + sessões), modos expandida/rail com tooltips e estado dos itens.

### Modified Capabilities
*(nenhuma — `design-system/brand-tokens` e `design-system/form-control-states` não mudam de requisito)*

## Impact

- **Código:** `app/config/navigation.ts`, `app/components/layout/AppHeader.vue`,
  `app/pages/design.vue` (seção 14), `app/app.vue` (habilitação do layout). `AppSidebar.vue` e
  `app/layouts/default.vue` intactos.
- **Documentação:** `docs/01` §3.1–3.3, `docs/03 - Header e Sidebar.md`.
- **Especificação:** nova capability `design-system/layout-navigation` (delta nesta change).
- **Sem impacto** em servidor, banco, API, dependências ou tokens de cor.
- **QA:** passa a validar a árvore de navegação e o menu contra a spec nova; a separação
  Área Pública × Área Administrativa (shell admin ainda em `/`) **permanece pendência declarada**
  e fora do escopo desta change.
