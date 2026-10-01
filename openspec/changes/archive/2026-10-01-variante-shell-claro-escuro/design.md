# Design

## Context

A seção 14 da vitrine (`app/pages/design.vue` §14, `id: 'shell'`) é um espelho fiel do shell real:
importa `sessoes`, `itemRaiz`, `conta` e os itens do menu de `config/navigation.ts`, reproduz as
larguras `w-52`/`w-[46px]` e já vive de ternários no `:class` (ex.: `sidebarOpen ? … : …`). O shell
real usa header `bg-brand-primary` (`#112051`) com texto `#f8fafc` e sidebar `bg-white` com rótulos
`text-slate-600`. Motivação e escopo: ver `proposal.md`. Specs relevantes
(`design-system/layout-navigation`, `design-system/brand-tokens`) foram lidas por inteiro — nenhum
requirement fixa cor de superfície da demo.

## Goals / Non-Goals

**Goals:**

- Toggle na §14 que alterna a demo entre o tema atual e a variante "header branco + sidebar dark",
  com estados (hover, ativo, rail) funcionando nos dois temas.
- Mapa de inversão completo documentado em `docs/01` §3.5 e `docs/03` §10, no mesmo change.
- Contraste ≥ 4,5:1 (texto) / ≥ 3:1 (gráficos) em todos os estados da variante.

**Non-Goals:**

- Mudar `AppHeader.vue`, `AppSidebar.vue`, `config/navigation.ts`, o índice de navegação da guia,
  o print CSS ou qualquer token de `tailwind.config.js`.
- Criar um sistema de temas/Tailwind plugin — a variante é um caso pontual da vitrine.
- Alterar specs (`skip_specs: true`).

## Decisions

**D1 — Variante escopada por classe no container da demo (`ds-shell-invert`).**
Um `ref shellInvertido` + `:class` no wrapper (`design.vue:1857`) ativa tudo; desligar restaura o
tema atual por construção (os ternários voltam ao ramo padrão). *Alternativa considerada:* variáveis
CSS globais de tema em `main.css` — sistema de mais alcance do que o pedido e tocaria a superfície do
shell real; *escolha:* classe pontual na vitrine.

**D2 — Híbrido ternário + 1 regra CSS.** Estados de superfície entram nos `:class` ternários já
existentes (mesmo estilo de `sidebarOpen`); o único ponto que CSS resolve melhor é o fallback do
hover: `.ds-shell-invert .ds-item-hover:hover { color: var(--item-cor, #f8fafc); }` — especificidade
(0,3,0) vence `.ds-item-hover:hover` (0,2,0) sem depender de ordem. *Alternativa considerada:*
bloco CSS inteiro com hooks em cada elemento — mais indireto e espalha a lógica de cor longe da
demo; *escolha:* cor de estado onde a decisão já vive (template), fallback onde CSS é mais limpo.

**D3 — Cor do header sobe para o container (herança).** O `text-[#f8fafc]` hoje está em ~5 filhos
do header; movê-lo para o container (ramo padrão) e usar `text-slate-900` no ramo variante troca 5
bindings por 1 e garante que filhos futuros herdem. Hover pontual (`bg-white/5` → `hover:bg-slate-100`)
e o botão de alternância permanecem bindings individuais.

**D4 — Ícone colorido e `--item-cor` via mapa de tintas no JS (`corDemo()`).** O `:style` inline
vence qualquer regra CSS, então a troca de cor precisa acontecer no binding:
`shellInvertido ? { color: corDemo(item.cor) } : { color: item.cor }` (idem `--item-cor` do hover).
*Alternativa considerada:* `color-mix(in srgb, …)` em CSS — exigiria remover o `:style` inline e
refatorar o mecanismo de cor compartilhado com o shell real; *escolha:* lookup explícito, mudança
só na vitrine.

**D5 — Tintas D9 (60% cor + 40% branco) como cor sobre navy.** As 9 cores cheias foram calibradas
para fundo branco; sobre `#112051` several falham (esmeralda `#047857` ≈ 2,8:1; azul estrutural
`#0364f7` pior). As tintas já registradas no change arquivado `troca-icones-sidebar` (D9) —
`#f89faa`, `#76c56a`, `#96c7ff`, `#68ae9a`, `#68a2fa`, `#d0a9f5`, `#f9d167`, `#81e5d9` — todas ficam
≥ ~5:1 sobre navy e preservam a família de cor por item (`#50a1ff` → `#96c7ff` cobre Escopo e
Configurações). Documentadas como tabela no §3.5.

**D6 — Estado ativo da variante: `bg-white/10 text-lime-300` (decisão do usuário, Q1).**
`lime-700` sobre navy dá ≈ 3:1 (falha para 12px); `lime-300` mantém a família lime com ≈ 9:1 e o
fundo `white/10` substitui o `structure/10` (azul a 10% sobre navy é invisível).

**D7 — Badge do logo no header branco: `bg-brand-primary/10 text-brand-primary` (decisão do usuário, Q2).**
`#4ed813` sobre branco dá 1,88:1 e é proibido pela docs §2; a variante usa tinta do próprio navy.

**D8 — Menu suspenso do Account vira branco na variante (revisão do usuário).** O popover herda o
mesmo tratamento da superfície branca: fundo `bg-white border-slate-200`, rótulo `text-slate-700`,
hover `bg-slate-100` e divisor `bg-slate-200`; os ícones mantêm as cores cheias (mesmo padrão da
sidebar branca padrão — as tintas D9 existem só para a superfície navy) e o fallback do hover passa a
`#0f172a` via `.ds-shell-invert .ds-item-hover-dark:hover` (o fallback `#f8fafc` ficaria invisível
sobre branco). No shell real o menu continua navy.

## Risks / Trade-offs

- [Contraste dos 9 ícones e do hover no navy] → Mitigado por D5 (tintas D9) + D6 (ativo lime-300) +
  D2 (fallback `#f8fafc`); conferência visual e tabela no §3.5 documentam os valores.
- [Algum filho do header manter `text-[#f8fafc]` explícito e não inverter] → Mitigação: migração da
  cor para o container (D3) é task dedicada com verificação por busca (zero `text-[#f8fafc]` dentro
  do header da demo).
- [Deriva demo × shell real: alguém "aplicar" a variante ao shell por engano] → Mitigação: docs §3.5
  e §10 marcam explicitamente "não implementada no shell real"; o shell real não recebe a classe.
- [`:style` inline vencendo o CSS e a variante não tingir os ícones] → Mitigação: D4 faz a troca no
  binding; verificação por busca dos bindings condicionais.
- [Impressão da §14 afetada pela troca de fundos] → Print CSS esconde header/sidebar
  (`header`, `aside`) e imprime só o conteúdo — inalterado; conferência no rodapé "Impressão".

## Migration Plan

Não aplicável — mudança visual pontual na vitrine + docs. Rollback: reverter `design.vue`,
`main.css` e os dois docs (ou desligar o toggle, que restaura o tema por construção).

## Open Questions

_Nenhum — Q1 (estado ativo) e Q2 (badge do logo) foram decididos com o usuário._
