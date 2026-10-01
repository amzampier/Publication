# Design

## Context

O change `variante-shell-claro-escuro` (arquivado) construiu e documentou o modelo **header branco +
sidebar dark** inteiro na vitrine `/design` §14 — incluindo as tintas D9, o ativo `lime-300`, o menu
Account branco e as regras de fallback em `main.css` — sem tocar no shell real. Este change promove
esse modelo a **único** shell da Área Administrativa.

Estado atual relevante (ver `proposal.md` para o "porquê"):

- `AppHeader.vue` (272 l.): fundo `bg-brand-primary`, 7 filhos com `text-[#f8fafc]` explícito,
  divisor `bg-white/20`, hovers `bg-white/5`, sino + painel `w-72` e menu Account **navy** (única
  superfície sem playbook no modelo novo — a demo §14 não tem o sino).
- `AppSidebar.vue` (156 l.): `bg-white`, ativo ×4 `structure/10 + lime-700`, inativo
  `slate-600`, divisor do rail `slate-200`, 9 ícones em cores cheias via `:style` inline.
- `design.vue` §14: tem todo o playbook (ternários), mas com semântica invertida —
  `shellInvertido = ref(false)` inicia no modelo **antigo** — e o mapa `corTinta`/`corDemo` mora
  no script da página (`design.vue:408-419`).
- `main.css`: as regras `.ds-shell-invert .ds-item-hover*` assumem que o fundo escuro é a
  **exceção** (a vitrine); o fallback base é o da superfície branca.
- Spec `design-system/layout-navigation`: Purpose + 2 requirements citam "Header Dark".

Decisões já tomadas com o usuário (exploração `/opsx-explore`): **(A)** substituir — modelo único,
sem toggle no produto; **(a)** manter o toggle da vitrine com o padrão virado; **sino** entra na
demo §14 também.

## Goals / Non-Goals

**Goals:**

- Shell real (`/admin/**`) renderizando o modelo claro/escuro em caminho único (sem ternários de tema).
- Fonte única das tintas D9 consumida por shell real e vitrine.
- Vitrine §14 espelhando o shell real por padrão, mantendo o modelo antigo acessível por toggle.
- Spec, docs/01 e docs/03 coerentes com a realidade nova (termo "Header Dark" eliminado).

**Non-Goals:**

- Toggle/persistência de tema no produto (modelo único — sem estado).
- Alterar tokens (`brand-tokens`), comportamento de navegação (zonas, ordem, árvore, rail) ou a
  Área Pública; impressão; cabeçalho da `DataTable` (componente, continua navy).
- Alterar `config/navigation.ts` (fonte de dados/cores intacta).
- Reescrever arquivos históricos (`openspec/changes/archive/**`).

## Decisions

**D1 — Modelo único sem toggle (decisão do usuário, A).** Alternativa descartada: toggle persistido
no produto — exigiria as duas paletas vivas em `AppHeader`/`AppSidebar` para sempre (todos os
ternários da vitrine viram código de produto), mais infraestrutura de persistência que o projeto
não tem (`sidebarOpen` também é memória, docs/03 §7).

**D2 — Tintas em composable `app/composables/shellTintas.ts` (export `tinta(hex)`).**
Alternativas consideradas: (i) exportar de `config/navigation.ts` — mistura lógica de cor em
módulo de dados/ícones; (ii) pré-computar `corTinta` por item nos dados — duplica estrutura e
acopla tema aos dados; (iii) CSS puro — impossível: o `:style` inline vence a regra CSS (mesma
lição registrada como D4 do change anterior). O Nuxt auto-importa exports nomeados de
`app/composables/`, então `AppSidebar` e `design.vue` usam `tinta(...)` sem import explícito.
Mapa idêntico ao já validado (8 hexes D9).

**D3 — CSS com base = modelo novo; classe `ds-shell-antigo` só na demo.** Em `main.css`:
`.ds-item-hover:hover` → `color: var(--item-cor, #f8fafc)` (sidebar navy é o padrão) e
`.ds-item-hover-dark:hover` → `color: var(--item-cor, #0f172a)` (menu branco é o padrão); as regras
espelhadas passam a ser `.ds-shell-antigo .ds-item-hover:hover` (fallback `#0f172a`) e
`.ds-shell-antigo .ds-item-hover-dark:hover` (fallback `#f8fafc`). Consequência: o shell real não
recebe nenhuma classe modificadora (zero `ds-shell-invert` fora da vitrine) e a demo aplica
`ds-shell-antigo` no container exibindo o modelo antigo. Alternativa descartada: manter a base
antiga e pôr classe no shell real — a classe vira obrigatória no produto para sempre, e "inverter"
passa a significar "realidade".

**D4 — Spec neutra: "Header Dark" → "Header".** Alternativas: manter "Header Dark" (vira mentira
após o change), "Header claro" (quebra de novo se o tema mudar), renomear para "Header branco +
Sidebar navy" (acopla spec a tema). O termo neutro cai em Purpose + 2 requirements (delta
`MODIFIED`; Purpose editado direto no main spec conforme a instrução do artefato `specs` —
deltas de capability existente não carregam Purpose). Comportamento e cenários idênticos.

**D5 — Mapeamento do sino/painel no branco (superfície nova, decide contraste):**

| Elemento | Estado antigo (navy) | Modelo novo (branco) |
|---|---|---|
| Painel `w-72` | `bg-brand-primary border-slate-700` | `bg-white border-slate-200` |
| Cabeçalho do painel | banda navy do próprio painel + `border-b border-slate-700` | **`bg-brand-primary`** (banda navy, sem borda) |
| Título do cabeçalho | `text-[#f8fafc]` | `text-white` (sobre a banda) |
| Contador "n novas" | `text-slate-400` | `text-slate-300` (sobre a banda) |
| Rodapé | `border-t border-slate-700` | `border-t border-slate-200` |
| Item: título | `text-[#f8fafc]` | herda `slate-900` |
| Item: mensagem | `text-slate-300` | `text-slate-600` (≥7:1) |
| Item: tempo | `text-slate-500` | mantém (4,8:1) |
| Fundo da lista de mensagens | herdado (navy do painel) | `bg-[#f9feee]` (corpo creme, ajuste do usuário) |
| Hover do item | `hover:bg-brand-structure/60` | `hover:bg-slate-100` |
| Estado vazio | `text-slate-400` | `text-slate-500` |
| "Limpar tudo" | `text-[#f8fafc]` | `text-[#0f7a06]` (verde de texto sobre claro, docs §2.1) + hover `slate-100` |
| Ponto de status / badge | `bg-brand-accent` / `bg-rose-500` | mantidos (`aria-hidden`, decorativos) |

> **Amendamento (usuário, 2026-10-01):** cabeçalho do painel em navy com escrita branca,
> "Limpar tudo" em verde (texto `#0f7a06`, não fundo) e **lista de mensagens em `#f9feee`**.
> Na demo §14 a banda `bg-brand-primary` vale para os dois estados (navy sobre navy não altera o
> visual do modelo antigo); os ternários do painel ficam em título/contador/rodapé/"Limpar tudo"
> e o fundo `#f9feee` só no atual (no antigo a lista herda o navy do painel).

Ícone do sino e demais filhos herdam `text-slate-900` do container (mesma técnica de herança já
aprovada na vitrine).

**D6 — Vitrine: ref `shellTradicional = ref(false)`, toggle "Atual · Padrão" | "Antigo
(comparação)".** Os ~15 ternários existentes são invertidos (mesmo texto, ordem trocada),
`aria-pressed`/`variant` seguem o novo default, o mapa local `corTinta`/`corDemo` é removido em
favor de `tinta()`. O sino entra na demo espelhando o `AppHeader`: `notificacoes` (cópia de
`notificacoesIniciais`), `visualizarNotificacao`, `limparNotificacoes`, exclusão mútua com o menu
da conta, clique fora e `Escape` estendidos nos handlers já existentes
(`design.vue:433-444`); o painel usa ternários (navy no estado antigo; branco no atual, com a
cabeçalho `bg-brand-primary` fixa e "Limpar tudo" verde só no atual — ver D5).

**D7 — docs/01 §3.5 repurpada, tabela de tintas migra para §3.3.** §3.5 deixa de dizer "não
implementada no shell real" e vira "Modelo legado (comparação na vitrine §14)"; a §3.3 (sidebar)
passa a ser a descrição do padrão e recebe a tabela das 8 tintas. Cross-refs em §3.1/§3.3 e o
§2.1 (linha do Navy: perde "header/menus dark", ganha "sidebar") são corrigidos no mesmo change
(regra AGENTS).

## Risks / Trade-offs

- [Inverter ~15 ternários da demo manualmente e errar um ramo] → verificação por busca (cada par
  de ramos), SSR do `/design` com default novo e conferência visual dos dois sentidos do toggle.
- [`:style` inline vence CSS nos ícones do sidebar real] → tinta aplicada por binding JS
  `tinta(item.cor)` nos mesmos 2 pontos da demo (`--item-cor` e `color` do ícone) — nunca via CSS.
- [Assimetria demo (ternários) × real (caminho único)] → intencional: demo existe para comparar
  modelos; markup espelhado, divergência só nos ramos de tema.
- [Textos do painel de notificações em branco com contraste fraco] → tabela D5 com pares
  verificados (≥4,5:1); ponto/accent decorativos (`aria-hidden`) dispensam contraste.
- [Purpose da spec editado fora do diretório do change] → sanção explícita da instrução do
  artefato `specs` ("edit the main spec directly"); registrado aqui e reportado no resumo.
- [Termo "Header Dark" em arquivos históricos/arquivados] → `openspec/changes/archive/**` é
  registro do passado; não tocar (fora de escopo).

## Migration Plan

Sem migração de dados, estado ou API — mudança puramente visual + textual. Deploy único (o
próximo `npm run build`); rollback = `git revert` (nenhuma dependência nova, nenhum schema).

## Open Questions

Nenhuma — as três perguntas bloqueadoras (substituir vs. toggle, destino do toggle da vitrine,
sino na demo) foram respondidas pelo usuário; decisões D2–D5/D7 têm alternativa descartada
registrada.
