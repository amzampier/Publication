# Proposal

## Why

A vitrine `/design` §14 demonstra apenas o shell atual (header navy + sidebar branca), mas o design
definiu uma alternativa visual — **header com fundo branco + sidebar com fundo dark** — que nunca foi
representada. Registrar a variante na seção 14 (com toggle ao vivo) e nos docs fecha essa lacuna de
documentação visual **sem alterar o layout em produção** (header dark + sidebar branca seguem iguais).

## What Changes

- **Toggle "Padrão | Invertido" no cabeçalho da seção 14** do `/design` (dois `UiButton size="sm"`
  com `aria-pressed`), afetando **somente a demo da vitrine** — o shell real (`AppHeader`,
  `AppSidebar`) não muda.
- **Variante de tema da demo** (classe `ds-shell-invert` no container):
  - Header: `bg-brand-primary` → `bg-white` + `border-b border-slate-200`; texto `#f8fafc` →
    `slate-900` (cor movida para o container, filhos herdam); hover da conta `bg-white/5` →
    `hover:bg-slate-100`; badge do logo → `bg-brand-primary/10 text-brand-primary` (accent `#4ed813`
    daria 1,88:1 sobre branco — proibido pela docs §2).
  - Sidebar: `bg-white`/borda `slate-200` → `bg-brand-primary`/`white/10`; rótulo `slate-600` →
    `slate-300`; hover do item raiz → branco (regra CSS troca o fallback `#0f172a` por `#f8fafc`);
    divisor `slate-200` → `white/15`; estado ativo `structure/10 + lime-700` → `bg-white/10 +
    text-lime-300` (lime-700 daria ≈3:1 no navy).
  - Ícones coloridos e `--item-cor` (hover) passam a usar as **tintas D9 60/40** (8 hexes já
    registrados no change arquivado `troca-icones-sidebar`) — as cores cheias foram escolhidas para
    branco e quebram 3:1 sobre `#112051` (ex.: esmeralda ≈2,8:1).
- **`app/assets/css/main.css`**: duas regras de fallback de hover —
  `.ds-shell-invert .ds-item-hover:hover { color: var(--item-cor, #f8fafc); }` (sidebar navy) e
  `.ds-shell-invert .ds-item-hover-dark:hover { color: var(--item-cor, #0f172a); }` (menu branco).
- **Documentação** (regra do AGENTS.md):
  - `docs/01 - design_system.md` — novo **§3.5 "Variante de tema do shell (vitrine §14)"** com mapa
    de inversão, tintas D9 e nota "não implementada no shell real" + cross-refs em §3.1/§3.3.
  - `docs/03 - Header e Sidebar.md` — **§10 (Vitrine `/design` §14)** estendida com a variante.
- Área de conteúdo, rodapé de impressão e índice de navegação da guia permanecem inalterados; o menu
  suspenso do Account muda só na vitrine invertida (fundo branco, hover `slate-100`, divisor
  `slate-200`) — no shell real ele continua navy.
- Nenhuma dependência nova, nenhum script novo, nenhuma mudança de rota ou API.

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities

_Nenhuma — nenhum requirement de spec muda:_

- `design-system/layout-navigation` fixa zonas do header, ordem do menu, árvore da sidebar e a
  relação shell × vitrine (fonte única) — a variante troca **apenas cores de superfície da demo**,
  mantendo árvore, ordem, larguras e estados idênticos; o shell real continua com "Header Dark".
- `design-system/brand-tokens` exige tokens sem hex fixado em componente: a variante usa apenas
  `bg-white` + `bg-brand-primary`/classes utilitárias; o cenário "cabeçalho da aplicação vem de
  `brand.primary`" refere-se ao app real, não tocado.
- Por não haver delta de spec, este change marca `skip_specs: true` no seu `.openspec.yaml`.

## Impact

- **Código:** `app/pages/design.vue` (estado, mapa de tintas, toggle, ternários da §14),
  `app/assets/css/main.css` (2 regras de fallback).
- **Documentação:** `docs/01 - design_system.md` (§3.5 nova, §3.1/§3.3 cross-refs),
  `docs/03 - Header e Sidebar.md` (§10).
- **Specs:** nenhuma alteração (`skip_specs: true`).
- **Comportamento visível:** na vitrine, a §14 alterna entre os dois temas de shell; em
  `/admin/**` nada muda (SSR sem diff); impressão intacta e menu Account do shell real intacto.
- **Verificação:** `npm run build` (gate único — não existe lint/test) + conferência visual em
  `http://localhost:3000/design` §14 e SSR de `/admin` sem diff.
