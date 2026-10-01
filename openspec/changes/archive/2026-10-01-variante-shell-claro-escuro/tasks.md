# Tasks

## 1. Estado, toggle e dados da variante (`app/pages/design.vue`)

- [x] 1.1 Adicionar `const shellInvertido = ref(false)`, o mapa `corTinta` (8 hexes D9:
      `#f45f71→#f89faa`, `#1a9e07→#76c56a`, `#50a1ff→#96c7ff`, `#047857→#68ae9a`, `#0364f7→#68a2fa`,
      `#b070ef→#d0a9f5`, `#f5b302→#f9d167`, `#2dd4bf→#81e5d9`) e o helper `corDemo(hex)` (devolve a
      tinta se existir, senão o hex original) — verificando por busca que ref, mapa e helper existem,
      que os 8 hexes originais do `config/navigation.ts` têm entrada e que `#50a1ff` cobre Escopo e
      Configurações.
- [x] 1.2 Inserir no cabeçalho da seção 14 (lado direito do `justify-between`, `design.vue:1836`) o
      toggle "Padrão | Invertido": dois `UiButton size="sm"` (sem criar botão paralelo — AGENTS) com
      `aria-pressed` ligados a `shellInvertido` — verificando por busca os dois labels, os
      `aria-pressed` e os `@click` que setam `false`/`true`.
- [x] 1.3 Condicionar `ds-shell-invert` ao container da demo (`design.vue:1857`) via
      `:class="{ 'ds-shell-invert': shellInvertido }"` — verificando por busca a classe e o binding.

## 2. Header branco na demo

- [x] 2.1 Mover a cor do texto do header para o container: ramo padrão ganha `bg-brand-primary
      text-[#f8fafc]`, ramo variante `bg-white border-b border-slate-200 text-slate-900`, e remover
      `text-[#f8fafc]` dos filhos (toggle, logo, nome/perfil da conta, chevron) para herdarem —
      verificando por leitura do bloco que **só o menu suspenso** (superfície própria navy) ainda
      contém `text-[#f8fafc]`.
- [x] 2.2 Aplicar ternários de variante no header: hover do botão da conta `bg-white/5` →
      `hover:bg-slate-100`, e badge do logo `bg-lime-500/15 text-brand-accent` →
      `bg-brand-primary/10 text-brand-primary` (Q2) — verificando por busca as classes dos dois
      ramos.

## 3. Sidebar dark na demo

- [x] 3.1 Container da sidebar (`design.vue:1978`): ternário `bg-white border-r border-slate-200` →
      `bg-brand-primary border-r border-white/10` (larguras `w-52`/`w-[46px]` intactas) — verificando
      por busca os dois ramos.
- [x] 3.2 Item raiz (`design.vue:1995`): ativo variante `bg-white/10 text-lime-300` (Q1) e inativo
      variante `text-slate-300 hover:text-white hover:bg-white/10`, ramo padrão idêntico ao atual —
      verificando por busca os quatro ramos (ativo/inativo × padrão/variante).
- [x] 3.3 Cabeçalho de sessão (`design.vue:2018`) e divisor (`design.vue:2010`): variante com
      `hover:text-white` e divisor `bg-white/15` — verificando por busca os ramos alternativos.
- [x] 3.4 Item colorido (`design.vue:2046-2057`): ternários de estado (inativo `text-slate-300
      hover:bg-white/10`; ativo `bg-white/10 text-lime-300`) e bindings condicionais de `--item-cor`
      e da cor do ícone passando por `corDemo()` quando `shellInvertido` (D4 — inline style vence
      CSS) — verificando por busca os bindings `corDemo(...)` nos 2 pontos (`--item-cor` do botão e
      `color` do ícone).
- [x] 3.5 Em `app/assets/css/main.css`, adicionar a regra
      `.ds-shell-invert .ds-item-hover:hover { color: var(--item-cor, #f8fafc); }` com comentário —
      verificando que a regra existe com o fallback `#f8fafc` e que a regra base
      `.ds-item-hover:hover` continua `#0f172a`.
- [x] 3.6 Menu Account da demo (`design.vue`, bloco "Menu suspenso do Account"): na variante, fundo/
      borda `bg-white border-slate-200`, rótulo `text-slate-700`, hover `bg-slate-100` (Meu Perfil,
      itens do `v-for` e Encerrar Sessão) e divisores `bg-slate-200` — cores cheias dos ícones
      mantidas (mesma regra da sidebar branca padrão); em `main.css`, regra
      `.ds-shell-invert .ds-item-hover-dark:hover { color: var(--item-cor, #0f172a); }` —
      verificando por leitura do bloco os 4 ternários e por busca a nova regra.

## 4. Documentação (regra AGENTS: docs no mesmo change)

- [x] 4.1 Criar `docs/01 - design_system.md` §3.5 "Variante de tema do shell (vitrine §14)": propósito
      ("não implementada no shell real"), local do toggle, **mapa de inversão** (tabela header/sidebar
      com todas as classes dos grupos 2-3), tabela das 8 tintas D9, estados (ativo Q1, hover com
      tintas, fallback `#f8fafc` na sidebar, menu Account branco com fallback `#0f172a`) e nota de
      specs — e acrescentar cross-ref de uma
      linha em §3.1 e §3.3 — verificando que a tabela de hexes/classes coincide com o código
      (`design.vue`/`main.css`) e que §3.1/§3.3 citam §3.5.
- [x] 4.2 Estender `docs/03 - Header e Sidebar.md` §10 (Vitrine `/design` §14) com a variante: toggle,
      escopo só-vitrine (shell real intocado), herança de dados intacta e pointer para docs/01 §3.5 —
      verificando que §10 menciona a variante e o escopo.

## 5. Verificação de integração

- [x] 5.1 Rodar `npm run build` e confirmar build sem erros (gate único do projeto — não existe
      lint/test).
- [x] 5.2 SSR: buscar `/design` e `/admin` — confirmar que `ds-shell-invert`/`shellInvertido`
      aparecem **só** em `/design`, que `/admin` não contém nenhuma ocorrência (shell real intacto) e
      que as contagens de sempre (`ds-icon-light`, `ds-item-hover`) seguem em `/admin`.
- [x] 5.3 Conferência visual em `/design` §14: toggle nos dois sentidos; tema atual idêntico ao de
      antes quando em "Padrão"; variante com header branco (badge navy), sidebar navy com rótulos
      claros, ícones tingidos, hover tingido, ativo lime-300, rail navy e menu Account branco;
      impressão do
      rodapé inalterada.
- [x] 5.4 `openspec validate variante-shell-claro-escuro` passa (com INFO de `skip_specs`).
