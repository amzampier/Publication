# Design

## Context

A navegação da sidebar vive na fonte única `app/config/navigation.ts` e é renderizada em três
pontos: `AppSidebar.vue` (modo expandido e modo rail) e a seção 14 da vitrine `app/pages/design.vue`.
O padrão de cor por item já existe no projeto em `MenuItem.cor` (`app/config/navigation.ts`),
aplicado via `:style` em `AppHeader.vue` — a convenção documentada é que o Tailwind não resolve cor
dinâmica em classe, logo sempre `:style` (docs/03 §6). Motivação e escopo: ver `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Release Week e Escopo de Projetos ganham ícone e cor próprios, definidos apenas na fonte única,
  refletidos automaticamente nos três pontos de render.
- Mecanismo de cor idêntico ao do menu Account (`cor?` + `:style`), sem novo padrão paralelo.
- Documentação (`docs/01`, `docs/03`) sincronizada no mesmo change.

**Non-Goals:**

- Colorir outros itens da sidebar ou o item raiz `Painel Executivo` (permanecem herdados do botão).
- Alterar ordem, sessões, estados ativo/foco ou tooltips. Rótulos (peso), ícones (traço) e o menu
  Account só mudam no que D11–D13 registram por feedback direto do usuário.
- Alterar specs (`skip_specs: true` — nenhum requirement muda; ver proposal §Capabilities).
- Adicionar tokens novos em `tailwind.config.js`.

## Decisions

**D1 — Campo `cor?: string` opcional em `SidebarItem`, espelhando `MenuItem.cor`.**
Aplicar nos três pontos de render
`:style="item.cor ? { color: item.cor } : undefined"`.
*Alternativa considerada:* guardar uma classe Tailwind no config (ex.: `text-brand-focus`) — o
scanner Tailwind geraria a regra, mas mistura mecanismos com `#50a1ff` (sem token, exigiria classe
arbitrária) e quebra a convenção documentada "sempre via `:style`". *Escolha:* `:style`, pelo
mesmo precedente do menu Account.

**D2 — Cores como hex literais no config: `#1a9e07` (verde) e `#50a1ff` (azul).**
`#1a9e07` é o token `brand-focus`, verde canônico sobre superfície clara (docs/01 §2 proíbe
`#4ed813` puro sobre branco — 1,88:1); `#50a1ff` é o azul já usado no menu Account, mantendo a
harmonia (decisão do usuário). O hex fica em `app/config/navigation.ts` — fora de
`app/components/` — e chega ao componente por binding dinâmico, sem hex de marca literal em
estilo inline de componente, preservando o requirement brand-tokens "Superfícies de marca não
carregam hex fixado no componente" (mesmo precedente do `MenuItem.cor` atual).

**D3 — Item ativo mantém a cor do ícone; o rótulo carrega o estado ativo.**
Como o `:style` inline vence a cor herdada, ao ficar ativo o botão aplica `bg-brand-structure/10
text-lime-700` no rótulo/fundo e o ícone segue verde/azul, sem lógica condicional.
*Alternativa considerada:* condicionar a cor no ativo (`itemAtivo === item.id ? undefined :
item.cor`) para o ícone virar lime-700 — mais código e perde a identidade do item no momento em que
ele é mais visível. *Escolha:* sem condicional (decisão do usuário).

**D4 — Itens sem `cor` não mudam de comportamento.**
O binding condicional (`item.cor ? … : undefined`) mantém herança de cor do botão para Manuais,
Parceiros, Softwares e os itens de Administração — idêntico ao hoje.

**D5 — Vitrine espelha por leitura, não por cópia.**
A seção 14 do `/design` já copia os dados de `config/navigation.ts` (`sessoesDemo`); a cor chega
pelo mesmo `item.cor`, exigindo apenas o mesmo `:style` no único ponto de render de item lá
(`design.vue` ~linha 2051). O item raiz da vitrine (~linha 2000) fica intacto.

**D6 — Hover colora a opção com a cor do próprio item (utilitário `.ds-item-hover` + `--item-cor`).**
O hover inativo deixa de ser só `hover:text-slate-900 hover:bg-slate-100`: o botão ganha
`:style="{ '--item-cor': item.cor }"` (só quando `cor` existe) e a classe `.ds-item-hover`, cuja
regra em `app/assets/css/main.css` é
`.ds-item-hover:hover { color: var(--item-cor, #0f172a); }` — itens coloridos pintam rótulo/ícone
de verde/azul no hover; itens sem `cor` caem no fallback `#0f172a` (slate-900, idêntico ao hoje).
A regra fica em `main.css` (mesmo lugar de `.ds-bottom-clip`) porque cor dinâmica não existe em
classe Tailwind — e o fallback com `var()` evita depender de valor arbitrário no template.
*Alternativa considerada:* classe arbitrária `hover:text-[var(--item-cor,#0f172a)]` no template —
funciona com o scanner Tailwind, mas mistura a lógica de fallback no template e é menos legível
que um utilitário nomeado. *Escolha:* utilitário `.ds-item-hover`.
*Alocação condicional:* a classe entra **apenas no ramo inativo** da mesma expressão condicional
de hoje — o item ativo continua sem efeito de hover (estrutura atual preservada). Aplica-se aos
botões de item dos modos expandido e rail em `AppSidebar.vue` e à seção 14 do `/design`; o item
raiz não muda (sem `cor`, hover atual já é slate-900).

**D7 — Administração replica as cores do menu Account.**
Os quatro itens de Administração recebem os mesmos hexes do `accountMenuItens`: Gestão de
Usuários `#b070ef`, Perfis de Acesso (RBAC) `#f5b302`, Auditoria `#2dd4bf`, Configurações
Globais `#50a1ff` — mesmo item, mesma cor, harmonia entre sidebar e menu suspenso.
*Alternativa considerada:* constantes compartilhadas entre `sessoes` e `accountMenuItens` para
eliminar a duplicação dos hexes — mudaria a forma dos dados do menu por pouco ganho; *escolha:*
hexes literais nos dois arranjos, ambos documentados (docs/01 §3.2/§3.3).
O item raiz Painel Executivo permanece sem `cor`; D8 completa Manuais/Parceiros/Softwares.
Como os bindings de ícone e hover já são condicionais em `item.cor` (D1/D6), nenhum
código de render muda — as cores chegam aos três pontos automaticamente.

**D8 — Manuais, Parceiros e Softwares usam cores já existentes na paleta.**
Manuais `#f45f71` (rosa do menu Account), Parceiros `#047857` (Verde Esmeralda, status
positivo do design system) e Softwares `#0364f7` (azul Estrutural do token `brand.structure`).
*Criterio de harmonia (decisão delegada pelo usuário):* nenhuma cor é nova no projeto e nenhuma
repete dentro da mesma sessão — Manuais evita verde (ficaria ao lado do `#1a9e07` do Release
Week) e Softwares evita o sky `#50a1ff` (quase igual ao de Escopo/Configurações). Contraste
sobre branco: ~3,1:1 (rosa), ~5,5:1 (esmeralda), ~5,0:1 (azul) — todos ≥ 3:1 para gráficos.
Como em D7, o render não muda: só o config ganha `cor`.

**D9 — Alívio dos tons: 60% cor + 40% branco (supera os hexes de D2/D7/D8).**
Após feedback do usuário de que a sidebar ficou "pesada" com as cores saturadas, os nove hexes da
sidebar foram suavizados pela mesma mistura linear (matiz preservado, luminosidade maior):
Manuais `#f89faa`, Release Week `#76c56a`, Escopo de Projetos/Configurações Globais `#96c7ff`,
Parceiros `#68ae9a`, Softwares `#68a2fa`, Gestão de Usuários `#d0a9f5`, Perfis (RBAC)
`#f9d167`, Auditoria `#81e5d9` — cada item mantém a sua família de cor.
*Alternativa considerada:* `color-mix(in srgb, …)` em CSS para suavizar sem tocar nos hexes
originais do config — preservaria os valores cheios, mas exigiria bindings novos nos três pontos
de render e depende de suporte do navegador; *escolha:* trocar os hexes no config (um único
ponto de mudança, mesmo mecanismo de render). Conhecido: tons claros reduzem o contraste sobre
branco (~2:1) — aceito porque o objetivo explícito é aliviar; o menu Account mantém as cores
cheias, já que é fundo escuro. Docs `01`/`03` atualizados junto.

**D10 — Volta às cores cheias: a referência é o menu suspenso (supera D9).**
Depois de ver a sidebar com tons claros ao lado do menu Account com cores cheias, o usuário pediu
para aplicar no sidebar a mesma intensidade do menu. Os nove hexes voltaram aos valores de
D2/D7/D8: Manuais `#f45f71`, Release Week `#1a9e07`, Escopo/Config. Globais `#50a1ff`, Parceiros
`#047857`, Softwares `#0364f7`, Gestão de Usuários `#b070ef`, Perfis `#f5b302`, Auditoria
`#2dd4bf`. D9 fica registrado como tentativa superada; a proporção 60/40 é o plano B se o peso
visual voltar a incomodar (ajuste de um ponto no config, sem tocar em render).

**D11 — Rótulo das opções em `font-normal` (supera o `font-medium` dos rótulos da sidebar).**
Feedback do usuário: sem o mouse, as opções pareciam em negrito. Troca de `font-medium` (500)
por `font-normal` (400) nos quatro pontos de rótulo (`AppSidebar.vue` item + raiz, seção 14 do
`/design` item + raiz). *Alternativa considerada:* `font-light` (300) — leve ainda, mas 300 em
12px fica pálido em telas low-DPI; *escolha:* um passo para trás (400). O estado ativo não perde
destaque (continua `text-lime-700` + `bg-brand-structure/10` — cor/fundo, não peso). Sem
conflito com a convenção "rótulos/legendas em `font-medium`" (docs/01 §1.2), que se aplica a
rótulos de formulário — isto é navegação. Cabeçalhos de sessão (`font-bold`) e menu Account
(`font-light`) não mudam; no rail não há rótulo.

**D12 — Menu Account ganha o mesmo hover colorido, com variante escura do utilitário.**
O menu suspenso passa a pintar o rótulo com a cor do item no hover, como a sidebar. Como o
fallback do `.ds-item-hover` é escuro (`#0f172a`, para a sidebar branca), o fundo navy do menu
exigiria outro fallback — foi criada a variante `.ds-item-hover-dark`
(`color: var(--item-cor, #f8fafc)`) em `main.css`, aplicada com o mesmo `:style` de
`--item-cor` aos **quatro itens com `cor`** do `v-for` de `accountMenuItens` (em
`AppHeader.vue` e na cópia da seção 14 do `/design`).
*Alternativa considerada:* reaproveitar `.ds-item-hover` direto — funciona enquanto todo item
tem `cor`, mas quebra silenciosamente se um item sem `cor` entrar no menu (rótulo viraria
quase preto no navy); *escolha:* variante nomeada por superfície, fallback explícito.
**Meu Perfil** (sem `cor`) e **Encerrar Sessão** (rótulo já permanentemente `#f45f71`) ficam
como estão — sem a classe, comportamento de hover inalterado.

**D13 — Ícones da sidebar com traço 1.5, via utilitário `.ds-icon-light` (supera o traço 2 do Lucide).**
Feedback do usuário: os ícones também pareciam em negrito (mesma percepção do rótulo, D11).
`main.css` ganha `.ds-icon-light { stroke-width: 1.5; }` e a classe entra nos **6** ícones
`h-4 w-4 shrink-0`: 4 em `AppSidebar.vue` (raiz + item, nos modos expandido e rail) e 2 na seção
14 do `/design`. A regra CSS vence o atributo `stroke-width` do SVG (CSS > atributos de
apresentação), sem tocar em props. *Alternativa considerada:* prop `:stroke-width="1.5"` em cada
`<component>` — mesmo número de pontos e não acompanha trocas de ícone; *escolha:* utilitário
nomeado (precedente `.ds-item-hover`), mudança só em CSS. Escopo deliberado: **só a sidebar**
(pedido "no sidebar") — ícone do menu Account (`h-3.5`), chevron de sessão (`h-3`) e demais
ícones do app mantêm o traço 2; cor dos ícones, estados ativo/hover e o rail (mesmo markup)
não mudam.

**D14 — Menu Account no mesmo traço 1.5 (supera o escopo de D13).**
Na conferência das 3.2–3.5 o usuário validou o hover, mas apontou que "os ícones ficaram
diferentes do sidebar": o menu seguia com traço 2 ao lado dos itens da sidebar em 1.5. A classe
`.ds-icon-light` entrou nos **6** ícones `h-3.5 w-3.5 shrink-0` do menu (3 em `AppHeader.vue` —
Meu Perfil, `accountMenuItens`, Encerrar Sessão — e 3 na cópia da seção 14 do `/design`).
*Restam em traço 2:* chevron de sessão (`h-3`), ícone do trigger da conta (`h-3.5` sem
`shrink-0`) e os demais ícones do header/app — todos fora das listas de opções; se o usuário
pedir, o caminho é adicionar a mesma classe. Documentação: `docs/01` §3.2/§3.3 e `docs/03`
(item **Menu**) atualizados junto.

## Risks / Trade-offs

- [Especificidade: `.ds-item-hover:hover` precisa vencer `text-slate-600` do ramo inativo] →
  Regra com classe+pseudo (0,2,0) vence a utilitária (0,1,0) sem depender de ordem no CSS; o ramo
  ativo não recebe a classe, então `text-lime-700` nunca disputa com o hover.
- [Azul `#50a1ff` (Escopo/Config. Globais) sobre branco ≈ 2,7:1, abaixo de 3:1 para gráficos] →
  Aceito e consciente: o usuário escolheu a intensidade igual à do menu Account (D10); se QA de
  acessibilidade levantar, o ajuste é um hex mais escuro no config (ex.: `#3b82f6` ≈ 3,7:1) ou
  retomar a proporção 60/40 do D9 — sempre só no config, sem tocar em código de render.
- [Esquecer um dos três pontos de render deixaria a cor/ícone divergindo entre sidebar real e
  vitrine] → Mitigação: os três pontos estão nomeados em D1/D5 e verificados na tarefa de conferência
  visual (`/design` seção 14 + `/admin/**`).
- [Docs `01`/`03` desatualizados contradizendo o código] → Mitigação: tarefa dedicada atualiza a
  árvore de §5, a interface de §6, os estados de §4.3 e a seção da sidebar do `docs/01` no mesmo
  change.
- [Imports órfãos após a troca (`Newspaper`/`FileText`) passarem a existir] → Remover os dois do
  import em `config/navigation.ts`; a build (`npm run build`) é o gate — símbolo referenciado que
  deixou de existir quebra a build e a revisão pega.

## Migration Plan

Não aplicável — mudança visual pura, sem dados, API ou rota. Rollback: reverter as alterações nos
arquivos listados na proposta (config + 2 renders + `main.css` + 2 docs).

## Open Questions

_Nenhum — cores (incl. a replicação das cores do menu Account na Administração e as cores
de Manuais/Parceiros/Softwares), comportamento no estado ativo e cor no hover foram definidos com
o usuário._
