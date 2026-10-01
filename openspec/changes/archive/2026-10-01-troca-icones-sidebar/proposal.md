# Proposal

## Why

A sessão **Publicações** da sidebar usa ícones genéricos e sem cor (`Newspaper` em Release Week e
`FileText` em Escopo de Projetos), o que não diferencia visualmente os dois itens mais importantes
da Área Administrativa. Para finalizar o sidebar, cada item passa a ter identidade própria: ícone
`Rocket` verde e `ClipboardList` azul claro, cores escolhidas para manter a harmonia com a paleta
já existente.

## What Changes

- **Ícones trocados na fonte única** (`app/config/navigation.ts`):
  - `release-week`: `Newspaper` → `Rocket`
  - `escopo-projetos`: `FileText` → `ClipboardList`
- **Novo campo `cor?: string` em `SidebarItem`**, espelhando o padrão já usado em `MenuItem.cor`
  (Tailwind não resolve cor dinâmica em classe — sempre via `:style`), com **cores cheias em todos
  os nove itens — na mesma intensidade do menu suspenso do Account** (o usuário comparou os dois e
  pediu essa intensidade; supera os tons claros passageiros, ver design D9/D10):
  - Publicações: Manuais `#f45f71`, Release Week `#1a9e07`, Escopo de Projetos `#50a1ff`
  - Cadastros: Parceiros `#047857`, Softwares `#0364f7`
  - Administração, **mesmas cores do `accountMenuItens`** (mesmo item, mesma cor):
    Gestão de Usuários `#b070ef`, Perfis de Acesso (RBAC) `#f5b302`, Auditoria `#2dd4bf`,
    Configurações Globais `#50a1ff`
  - Sem `cor`: apenas o item raiz **Painel Executivo**
  - Nenhuma cor nova: todas já existem no design system ou no menu Account
- **Aplicação da cor nos três pontos de render do ícone**, via
  `:style="item.cor ? { color: item.cor } : undefined"` (itens sem `cor` continuam herdando a cor
  do botão, exatamente como hoje):
  - `AppSidebar.vue` modo expandido
  - `AppSidebar.vue` modo rail
  - `design.vue` seção 14 (espelho da vitrine)
- **Item ativo preserva a cor do ícone**: o rótulo continua assumindo `text-lime-700` no estado
  ativo; o ícone mantém verde/azul (o `:style` inline vence a cor herdada), sem lógica condicional.
- **Hover pinta a cor da opção, não só o destaque de fundo** — e o **menu suspenso do Account
  faz igual**: no estado inativo, o hover passa a colorir rótulo/ícone com a **cor do próprio
  item**. Na sidebar, utilitário `.ds-item-hover` (`--item-cor`, fallback `#0f172a`); no menu
  Account, a variante escura `.ds-item-hover-dark` (fallback `#f8fafc` — nunca slate em fundo
  navy), aplicada aos quatro itens com `cor` em `AppHeader.vue` e na seção 14 do `/design`.
  Itens sem `cor` seguem como hoje; o item ativo da sidebar não ganha hover.
- **Rótulos das opções em peso normal**: `font-medium` (500) → `font-normal` (400) nos rótulos
  `text-xs` da sidebar (item + raiz, sidebar real e vitrine) — sem o mouse, as opções pareciam
  em negrito; o ativo continua se destacando por cor/fundo.
- **Ícones da sidebar com traço 1.5**: utilitário `.ds-icon-light` (`stroke-width: 1.5` em
  `main.css`) nos 6 ícones `h-4 w-4` (4 em `AppSidebar.vue` — raiz+item, expandido+rail — e 2
  na seção 14 do `/design`) — o traço padrão do Lucide (2) também parecia em negrito. Após a
  conferência (3.2–3.5), os **ícones do menu Account receberam a mesma classe** (6 pontos: 3 em
  `AppHeader.vue`, 3 na seção 14) — "pesos diferentes do sidebar". Chevrons de sessão, ícone do
  trigger da conta e demais ícones do app mantêm o traço 2 (fora das listas de opções).
- **Documentação atualizada no mesmo change** (regra do AGENTS.md):
  - `docs/03 - Header e Sidebar.md` §5 (árvore de navegação com os novos ícones), §6 (interface
    `SidebarItem` com `cor?`) e §4.3 (estados inativo/hover do item)
  - `docs/01 - design_system.md` §3.3 (sessão Publicações com ícone/cor por item e hover)
- Nenhuma dependência nova, nenhum script novo, nenhuma mudança de rota ou de API.

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities

_Nenhuma — os requirements existentes não mudam:_

- `design-system/layout-navigation` fixa ordem e **rótulos** dos itens (intocados), o recolhimento
  das sessões, o alternar expandido/rail e a **fonte única** da navegação (esta última continua
  garantida — a vitrine `/design` acompanha a mudança por ler o mesmo `config/navigation.ts`).
- `design-system/brand-tokens` não é afetado: o hex fica em `app/config/navigation.ts` (fora de
  `app/components/`) e é aplicado dinamicamente via `:style`, sem hex de marca literal em
  componente — mesmo precedente do `MenuItem.cor` atual. As cores escolhidas respeitam a regra
  "nunca `#4ed813` puro sobre branco" (docs/01 §2).
- Ícone e cor por item são detalhe visual documentado em `docs/01`/`docs/03`, não comportamento
  especificado — nenhum requirement novo é inventado para isto.

Por não haver delta de spec, este change marca `skip_specs: true` no seu `.openspec.yaml`.

## Impact

- **Código:** `app/config/navigation.ts`, `app/components/layout/AppSidebar.vue`,
  `app/pages/design.vue` (seção 14), `app/assets/css/main.css` (utilitários `.ds-item-hover`,
  `.ds-item-hover-dark`, `.ds-icon-light`) e `app/components/layout/AppHeader.vue` (hover do
  menu Account).
- **Documentação:** `docs/01 - design_system.md` (§3.2, §3.3), `docs/03 - Header e Sidebar.md`
  (§4.3, §5, §6 + item **Menu** do bloco Account).
- **Specs:** nenhuma alteração (hover de item não é fixado em requirement algum).
- **Comportamento visível:** todos os nove itens de sessão ficam com ícone/cor própria (os dois de
  Publicações, os dois de Cadastros e os quatro da Administração, estes espelhando o menu Account);
  o hover de todos os itens **inativos** da sidebar e dos **quatro itens com `cor` do menu Account**
  pinta o rótulo com a cor do item (fundo de destaque permanece); rótulos em peso normal e ícones
  da sidebar em traço 1.5; estados ativo/foco, rail e tooltips permanecem idênticos. Só o item
  raiz fica neutro.
- **Verificação:** `npm run build` + conferência visual em `/design` (seção 14) e na sidebar real
  sob `/admin/**`, incluindo o hover colorido das opções, o menu Account e o peso dos ícones.
