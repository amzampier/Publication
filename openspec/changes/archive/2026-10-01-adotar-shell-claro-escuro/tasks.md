# Tasks

## 1. Fundação (tintas compartilhadas + CSS base novo)

- [x] 1.1 Criar `app/composables/shellTintas.ts` com o mapa das 8 tintas D9 (copiar os hexes do
      script de `design.vue:408-417`) e export `tinta(hex)` com fallback `?? hex` — verificando
      por busca as 8 entradas (`#f89faa` … `#81e5d9`) e o export nomeado `tinta`.
- [x] 1.2 Em `app/assets/css/main.css`, **inverter a semântica** (design D3): base
      `.ds-item-hover:hover` → fallback `#f8fafc` e base `.ds-item-hover-dark:hover` → `#0f172a`;
      as regras espelhadas passam a ser `.ds-shell-antigo .ds-item-hover:hover` (fallback
      `#0f172a`) e `.ds-shell-antigo .ds-item-hover-dark:hover` (fallback `#f8fafc`), com
      comentários explicando que a base é o modelo novo e `ds-shell-antigo` é só a demo —
      verificando por busca as 4 regras com os 4 fallbacks corretos e a ausência de
      `ds-shell-invert`.

## 2. Shell real — AppHeader no modelo novo (caminho único)

- [x] 2.1 Container do header (`AppHeader.vue:91`): `bg-brand-primary` → `bg-white border-b
      border-slate-200 text-slate-900` e **remover `text-[#f8fafc]`** do toggle do sino, logo
      `Publications`, nome/perfil da conta e chevron (herdam do container) — verificando por
      busca **zero** `text-[#f8fafc]` em `AppHeader.vue` e o container com as 4 classes.
- [x] 2.2 Detalhes do header: divisor `bg-white/20` → `bg-slate-200`; hovers do sino e da conta
      `hover:bg-white/5` → `hover:bg-slate-100`; badge do logo `bg-lime-500/15 text-brand-accent`
      → `bg-brand-primary/10 text-brand-primary` (Q2) — verificando por busca os 3 pares de
      classes substitutos e a ausência das antigas.
- [x] 2.3 Menu Account → branco (espelho da vitrine): container `bg-brand-primary border
      border-slate-700` → `bg-white border border-slate-200`; Meu Perfil/itens `text-[#f8fafc]
      hover:bg-brand-structure/60` → `text-slate-700 hover:bg-slate-100`; Encerrar
      `hover:bg-brand-structure/60` → `hover:bg-slate-100`; 2 divisores `bg-white/40` →
      `bg-slate-200`; ícones mantêm as cores cheias — verificando por leitura do bloco cada
      par de classes e que `ds-item-hover-dark` permanece nos itens do `v-for`.
- [x] 2.4 Painel do sino → tabela D5 do design: painel `bg-brand-primary border-slate-700` →
      `bg-white border-slate-200`; **cabeçalho vira banda `bg-brand-primary` com título
      `text-white` e contador `text-slate-300`** (amendamento do usuário p/ 2.4);
      rodapé `border-slate-700` → `slate-200`; título e título do item herdam do
      corpo/removem `text-[#f8fafc]`; mensagem `text-slate-300` → `text-slate-600`; tempo
      `text-slate-500` mantido; hover do item `hover:bg-brand-structure/60` →
      `hover:bg-slate-100`; vazio `text-slate-400` → `text-slate-500`; "Limpar tudo"
      → **`text-[#0f7a06] hover:bg-slate-100`** (verde de texto §2.1, amendamento do usuário);
      ponto `bg-brand-accent` e badge `bg-rose-500` mantidos — verificando por leitura do bloco
      cada linha da tabela D5.
- [x] 2.5 Documentação do header no mesmo grupo: `docs/01 - design_system.md` §3.1 vira "Header
      claro" com as classes novas (herança, divisor, hovers, badge Q2, sino/painel) e §3.2
      descreve o menu branco (fundo/borda/hover/divisor, fallback `#0f172a` base); `docs/03`
      sumário + §1 (árvore "Header Dark" → "Header") + §2/§2.1/§2.2 + §3 atualizados com as
      mesmas classes — verificando por busca zero `Header Dark` em `docs/01` e nas seções
      editadas de `docs/03`, e que §3.1/§2 citam `bg-white border-b border-slate-200`.

## 3. Shell real — AppSidebar no modelo novo

- [x] 3.1 Container (`AppSidebar.vue:26`): `bg-white border-r border-slate-200` →
      `bg-brand-primary border-r border-white/10` (larguras `w-52`/`w-[46px]` intactas) —
      verificando por busca os dois ramos de classes.
- [x] 3.2 Estados do item raiz (modo expandido `AppSidebar.vue:44-49` e rail `:107-112`):
      ativo `bg-brand-structure/10 text-lime-700` → `bg-white/10 text-lime-300` (Q1); inativo
      `text-slate-600 hover:text-slate-900 hover:bg-slate-100` → `text-slate-300 hover:text-white
      hover:bg-white/10` — verificando por busca os 4 ramos (ativo/inativo × expandido/rail).
- [x] 3.3 Estados dos itens coloridos (expandido `:79-91` e rail `:134-146`): ativo →
      `bg-white/10 text-lime-300`; inativo `text-slate-600 hover:bg-slate-100 ds-item-hover` →
      `text-slate-300 hover:bg-white/10 ds-item-hover`; bindings `--item-cor` e `color` do
      ícone passam de `item.cor` para `tinta(item.cor)` (auto-import do composable) —
      verificando por busca os 4 ramos de estado e os **2 pontos** com `tinta(`. ✓ 4 pontos.
- [x] 3.4 Cabeçalho de sessão (`:59`): `hover:text-slate-600` e `focus-visible:text-slate-600` →
      `hover:text-white`/`focus-visible:text-white`; divisor do rail (`:120`) `bg-slate-200` →
      `bg-white/15` — verificando por busca as classes novas e as antigas ausentes.
- [x] 3.5 Documentação da sidebar no mesmo grupo: `docs/01` §3.3 passa a descrever a sidebar
      **navy** (container, ativo Q1, inativo slate-300, cabeçalho de sessão, divisor `white/15`)
      e **recebe a tabela das 8 tintas D9** (migrada do §3.5); linha do Navy no §2.1 perde
      "header/menus dark" e ganha "sidebar"; `docs/03` §4 (4.1–4.4) atualizado com as mesmas
      classes e a referência a `tinta()` — verificando que §3.3 contém os 8 hexes das tintas e
      que §2.1 não cita mais "Header" ao lado do Navy.

## 4. Vitrine §14 — espelho completo + sino

- [x] 4.1 Virar o default da demo: renomear `shellInvertido` → `shellTradicional` (default
      `false`), inverter a ordem dos ~15 ternários (ramo novo passa a ser o default), rótulos do
      toggle → **"Atual"** (pressed quando `!shellTradicional`) e **"Antigo (comparação)"**, e
      flip nos bindings `aria-pressed`/`variant` — verificando por busca **zero**
      `shellInvertido` em `design.vue` e a presença dos dois rótulos novos (zero "Invertido"
      no bloco da §14).
- [x] 4.2 Trocar a fonte das tintas da demo: remover o mapa `corTinta` e `corDemo` locais
      (`design.vue:408-419`) e passar os bindings `--item-cor`/`color` a usar `tinta(...)` —
      verificando por busca zero `corDemo`/`corTinta` em `design.vue` e os bindings com
      `tinta(` nos mesmos 2 pontos.
- [x] 4.3 Classe de legado: o container da demo (`design.vue:1895`) passa a aplicar
      `ds-shell-antigo` quando `shellTradicional` (substituir o binding `ds-shell-invert`) —
      verificando por busca zero `ds-shell-invert` no projeto e o binding com `ds-shell-antigo`.
- [x] 4.4 Sino + painel na demo §14 (design D6): estado `notificacoes` (cópia de
      `notificacoesIniciais`), `notificacoesAberto`, `visualizarNotificacao`,
      `limparNotificacoes`, exclusão mútua com o menu da conta nos dois handlers de alternância,
      clique fora e `Escape` estendidos em `fecharMenuSeFora`/`fecharMenuComEscape`
      (`design.vue:433-444`), e markup espelhado do `AppHeader` com ternários de tema (navy no
      estado antigo, mapeamento D5 no atual) — verificando por leitura do bloco: dados vindos
      de `notificacoesIniciais`, painel com ramo `shellTradicional ? …` e handlers estendidos.
- [x] 4.5 Documentação da vitrine no mesmo grupo: `docs/01` §3.5 repurpada em "Modelo legado
      (comparação na vitrine §14)" (sem "não implementada") e cross-refs §3.1/§3.3 corrigidas
      (param de dizer que o header real "continua dark"); `docs/03` §10 (toggle
      "Atual|Antigo", default = modelo novo, sino na demo) e §11 revisada — verificando por
      busca zero "não implementada" e zero "continua dark"/"Header Dark" em `docs/01` e
      `docs/03`.

## 5. Verificação de integração

- [x] 5.1 Rodar `npm run build` e confirmar build sem erros (gate único do projeto — não existe
      lint/test).
- [x] 5.2 SSR `/admin`: header renderiza `bg-white border-b border-slate-200` (busca no HTML)
      com **zero** `text-[#f8fafc]`, sidebar `bg-brand-primary`, pelo menos um hex de tinta
      (ex.: `#96c7ff`) e ativo `text-lime-300` presentes; nenhum `ds-shell-antigo` no HTML.
- [x] 5.3 SSR `/design`: default = modelo novo (header `bg-white border-b` no HTML da demo),
      botão "Atual" com `aria-pressed="true"`, sino presente no HTML da §14; zero ocorrências de
      `shellInvertido` e `ds-shell-invert` em `/design`.
- [x] 5.4 SSR `/`: continua 200 sem nenhum elemento do shell (sem `ds-shell-antigo`, sem
      `bg-brand-primary` de header) — Área Pública intacta.
- [x] 5.5 Conferência visual (usuário): `/admin` com sino aberto (painel branco com **cabeçalho
      navy/branco** e **"Limpar tudo" verde** `#0f7a06`, dispensar), menu Account branco, sidebar navy (ativo lime-300, hovers, tintas, cabeçalho
      de sessão, rail com divisor `white/15` e tooltips); `/design` §14 nos dois sentidos do
      toggle ("Atual" igual ao `/admin`, "Antigo" igual ao modelo antigo, sino em ambos).
- [x] 5.6 `openspec validate adotar-shell-claro-escuro` passa (delta `MODIFIED` de
      `design-system/layout-navigation` reconhecido, sem `skip_specs`).
