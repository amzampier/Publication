# Proposal

## Why

A vitrine `/design` §14 já demonstra e documenta o modelo **header branco + sidebar dark**
(change `variante-shell-claro-escuro`, arquivado), mas o shell real (`AppHeader`/`AppSidebar`) segue
no modelo antigo (header navy + sidebar branca) — a documentação (docs/01 §3.5) e a própria vitrine
dizem explicitamente que a variante "não está implementada no shell real". Chegou a hora de adotar
o novo modelo como **único** shell da Área Administrativa, eliminando a divergência entre o que a
documentação descreve, o que a vitrine mostra e o que o produto renderiza.

## What Changes

- **Shell real passa ao modelo claro/escuro (caminho único, sem toggle nem persistência):**
  - `AppHeader.vue`: fundo `bg-brand-primary` → `bg-white border-b border-slate-200`; texto
    `text-[#f8fafc]` (7 pontos) migrado para herança `text-slate-900` no container; divisor
    `bg-white/20` → `bg-slate-200`; hovers `bg-white/5` → `bg-slate-100`; badge do logo →
    `bg-brand-primary/10 text-brand-primary` (Q2 do change anterior); **painel do sino** (`w-72`)
    e **menu Account** ganham superfície branca (bordas `slate-200`, hovers `slate-100`, textos
    slate) — mapeamento completo em `design.md` (D5).
  - `AppSidebar.vue`: fundo `bg-white` → `bg-brand-primary border-r border-white/10`; item ativo
    (4 pontos) `bg-brand-structure/10 text-lime-700` → `bg-white/10 text-lime-300` (Q1); rótulo
    inativo `slate-600` → `slate-300`; hovers `text-white bg-white/10`; cabeçalho de sessão
    `hover/focus` brancos; divisor do rail `bg-slate-200` → `bg-white/15`; os **9 ícones coloridos**
    passam das cores cheias para as **tintas D9** (60/40) via helper compartilhado.
- **Helper de tintas compartilhado:** o mapa `corTinta`/`corDemo` sai do script de `design.vue` e vira
  módulo único (`app/composables/shellTintas.ts`, export `tinta(hex)`), consumido pelo `AppSidebar`
  real e pela vitrine.
- **CSS de hover vira base = modelo novo:** em `main.css`, `.ds-item-hover:hover` assume fallback
  claro `#f8fafc` (sidebar navy) e `.ds-item-hover-dark:hover` assume fallback escuro `#0f172a`
  (menu branco); o estado antigo da demo carrega a classe `ds-shell-antigo` com as regras
  espelhadas. O shell real não precisa de classe modificadora.
- **Vitrine §14 (espelho completo):** ref `shellInvertido` → `shellTradicional` (default `false`),
  ~15 ternários invertidos, rótulos do toggle **"Atual" (padrão) | "Antigo (comparação)"**; a demo
  ganha o **sino + painel de notificações** que ainda não existe lá (dados de
  `notificacoesIniciais`, exclusão mútua com o menu da conta, dispensar/limpar, clique fora e
  `Escape`), espelhando o `AppHeader` real em ambos os sentidos do toggle.
- **Spec (delta real — não é `skip_specs`):** `design-system/layout-navigation` — o termo
  **"Header Dark"** deixa de ser verdadeiro; as 2 requirements que o citam (e o Purpose) passam a
  dizer **"Header"** (neutro). Comportamento (zonas, ordem, árvore, rail, rotas) idêntico.
- **Documentação (regra AGENTS: docs no mesmo change):**
  - `docs/01 - design_system.md`: §2.1 (linha do Navy perde "header/menus dark", ganha "sidebar"),
    §3.1 → "Header claro", §3.2 (menu branco), §3.3 (sidebar navy + tabela das 8 tintas D9),
    §3.5 repurpada em "Modelo legado (comparação na vitrine)", cross-refs corrigidas.
  - `docs/03 - Header e Sidebar.md`: sumário/§1, §2–§2.2 (header + sino), §3 (menu), §4 (sidebar),
    §10 (toggle "Atual|Antigo" + sino na demo), §11 (pendências).

## Capabilities

### New Capabilities

_(nenhuma)_

### Modified Capabilities

- `design-system/layout-navigation`: Purpose e as requirements *"O header exibe as zonas canônicas
  com alternância e logo à esquerda"* e *"O shell administrativo é restrito às rotas da Área
  Administrativa"* deixam de citar "Header Dark" e passam a citar "Header" (termo neutro, já que o
  fundo do header é uma decisão de tema e não de comportamento). Zonas, ordem do menu, árvore,
  rail, rotas e todos os cenários permanecem idênticos.

## Impact

- **Código:** `app/components/layout/AppHeader.vue` (272 l.), `app/components/layout/AppSidebar.vue`
  (156 l.), `app/pages/design.vue` (§14: estado, ternários, sino novo), `app/assets/css/main.css`
  (flip de 2 regras + classe `ds-shell-antigo`), novo `app/composables/shellTintas.ts`.
  `app/layouts/admin.vue` **sem mudança**; `config/navigation.ts` **sem mudança** (fonte de dados
  intacta).
- **Fora de escopo:** Área Pública (`index.vue`/`default.vue`), impressão (`@media print` já oculta
  header/aside), cabeçalho da `DataTable` (componente, continua navy), qualquer persistência de
  tema (modelo único não tem estado), `brand-tokens`/`form-control-states` (tokens intactos —
  `bg-brand-primary` continua `#112051`, só passa a pintar a sidebar em vez do header).
- **Verificação:** `npm run build` (gate único) + SSR de `/admin` (header branco, sidebar navy,
  tintas presentes), `/design` (default = modelo novo + sino) e `/` (intacto) + conferência visual
  + `openspec validate` com sync dos deltas.
