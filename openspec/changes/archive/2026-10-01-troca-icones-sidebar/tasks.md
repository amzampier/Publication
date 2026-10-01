# Tasks

## 1. Fonte única — config e dados

- [x] 1.1 Em `app/config/navigation.ts`: trocar em `SidebarItem` os ícones dos itens `release-week`
      (`Newspaper` → `Rocket`) e `escopo-projetos` (`FileText` → `ClipboardList`), adicionando os
      imports novos e removendo os órfãos — verificando por busca que `Newspaper`/`FileText` não
      aparecem mais no arquivo e que `Rocket`/`ClipboardList` estão importados de `@lucide/vue`.
- [x] 1.2 No mesmo arquivo, adicionar `cor?: string` à interface `SidebarItem` e preencher
      `cor: '#1a9e07'` em `release-week` e `cor: '#50a1ff'` em `escopo-projetos` — verificando que
      a interface e os dois hexes existem no arquivo e que os demais itens não têm `cor`.
- [x] 1.3 Atualizar `docs/03 - Header e Sidebar.md`: §5 (árvore de navegação com `Rocket` em
      Release Week e `ClipboardList` em Escopo de Projetos) e §6 (interface `SidebarItem` com
      `cor?: string`) — verificando que a árvore e a interface do doc coincidem com
      `config/navigation.ts`.
- [x] 1.4 Em `app/config/navigation.ts`, adicionar `cor` aos quatro itens da sessão Administração
      com os hexes do `accountMenuItens` (`#b070ef`, `#f5b302`, `#2dd4bf`, `#50a1ff`) — verificando
      por busca que os quatro hexes existem em `sessoes` e que Manuais/Parceiros/Softwares/raiz
      continuam sem `cor`.
- [x] 1.5 Atualizar as listas de cores em `docs/03` §5 e `docs/01` §3.3 com os itens coloridos da
      Administração e os que ficam sem cor — verificando que os hexes dos docs coincidem com
      `config/navigation.ts`.
- [x] 1.6 Em `app/config/navigation.ts`, adicionar `cor` aos três itens restantes: Manuais
      `#f45f71`, Parceiros `#047857`, Softwares `#0364f7` — verificando que todos os nove itens
      de sessão têm `cor` e que só o item raiz continua sem.
- [x] 1.7 Reescrever as listas de cores em `docs/03` §5 (mapa completo por sessão, árvore só com
      nomes de ícone) e `docs/01` §3.3 — verificando que os nove hexes dos docs coincidem com
      `config/navigation.ts` e que só Painel Executivo consta como sem cor.
- [x] 1.8 Suavizar os nove tons da sidebar no config (mistura 60% cor + 40% branco, matiz
      preservado) e atualizar `docs/03` §5 e `docs/01` §3.3 com os tons finais — verificando que
      config e docs coincidem, que nenhuma cor do `accountMenuItens` (menu Account) mudou e que
      o comentário do config documenta a proporção da mistura.
- [x] 1.9 Voltar os nove hexes da sidebar às cores cheias (mesma intensidade do menu suspenso,
      valores de D2/D7/D8) e atualizar `docs/03` §5, `docs/01` §3.3 e o comentário do config —
      verificando que sidebar e docs batem, que o menu Account nunca mudou e que nenhum tom
      claro (`#f89faa`, `#76c56a`, `#96c7ff`, …) sobrevive no config.

## 2. Render da cor (e hover) nos três pontos

- [x] 2.1 Em `app/components/layout/AppSidebar.vue`, aplicar
      `:style="item.cor ? { color: item.cor } : undefined"` nos `<component :is="item.icon">` do
      modo expandido e do modo rail (2 pontos) — verificando por busca que o binding existe 2× no
      arquivo e que o `itemRaiz` continua sem binding.
- [x] 2.2 Em `app/pages/design.vue` (seção 14, render dos itens da sessão), aplicar o mesmo
      `:style` condicional (1 ponto) — verificando por busca que o binding existe 1× na seção e
      que o item raiz da vitrine (~linha 2000) não mudou.
- [x] 2.3 Em `app/assets/css/main.css`, criar o utilitário
      `.ds-item-hover:hover { color: var(--item-cor, #0f172a); }` com comentário — verificando que
      a regra existe e usa o fallback `#0f172a` (slate-900).
- [x] 2.4 Em `AppSidebar.vue`, nos botões de **item** dos modos expandido e rail (2 pontos):
      trocar `hover:text-slate-900` por `ds-item-hover` no ramo inativo e adicionar
      `:style="item.cor ? { '--item-cor': item.cor } : undefined"` no botão — verificando por
      busca que `ds-item-hover` aparece 2×, que os botões do item raiz não mudaram e que o ramo
      ativo não recebe a classe.
- [x] 2.5 Em `app/pages/design.vue` (seção 14), aplicar a mesma troca no botão de item (1 ponto)
      — verificando por busca que `ds-item-hover` aparece 1× na seção e que o item raiz não mudou.
- [x] 2.6 Atualizar `docs/01 - design_system.md` §3.3: ícone/cor de Release Week e Escopo de
      Projetos + descrição do hover (cor do próprio item, fallback slate-900, ativo sem hover) —
      verificando que a seção espelha `config/navigation.ts` e as classes do `AppSidebar.vue`.
- [x] 2.7 Atualizar `docs/03 - Header e Sidebar.md` §4.3: estados inativo/hover com
      `.ds-item-hover` e `--item-cor` no lugar de `hover:text-slate-900` — verificando que o doc
      não menciona mais a classe antiga.
- [x] 2.8 Trocar `font-medium` → `font-normal` nos quatro rótulos da sidebar (2 spans em
      `AppSidebar.vue`, 2 na seção 14 do `design.vue`) e atualizar `docs/03` §4.3 e `docs/01` §3.3
      — verificando por busca que não sobrou `text-xs font-medium` nos rótulos da sidebar e que os
      dois docs citam `font-normal`.
- [x] 2.9 Menu Account: criar `.ds-item-hover-dark` (fallback `#f8fafc`) em `main.css` e aplicar
      classe + `:style` de `--item-cor` no `v-for` de `accountMenuItens` (`AppHeader.vue` +
      seção 14 do `design.vue`), atualizando `docs/03` (item **Menu** do bloco Account) e
      `docs/01` §3.2 — verificando que a classe aparece 2×, que Meu Perfil e Encerrar Sessão não
      receberam a classe e que o fallback é `#f8fafc` (nunca slate).
- [x] 2.10 Criar `.ds-icon-light { stroke-width: 1.5; }` em `main.css` e aplicar a classe nos 6
      ícones `h-4 w-4 shrink-0` (4 em `AppSidebar.vue`, 2 na seção 14 do `design.vue`) e nos docs
      `03` §4.3/`01` §3.3 — verificando por busca as contagens 4/2 e que menu Account e chevrons
      não mudaram.
- [x] 2.11 (feedback da conferência 3.2–3.5) Aplicar `.ds-icon-light` também aos 6 ícones
      `h-3.5 w-3.5 shrink-0` do menu Account (3 em `AppHeader.vue`, 3 na seção 14 do `design.vue`)
      e atualizar `docs/03` (item **Menu**), `docs/01` §3.2/§3.3, `proposal.md` e `design.md`
      (D14) — verificando por busca as contagens 3/3, que o chevron e o trigger do menu não
      mudaram e que `Badge`/`Kpi` (fora do escopo) ficaram intactos.

## 3. Verificação de integração

- [x] 3.1 Rodar `npm run build` e confirmar build sem erros (gate único do projeto — não existe
      lint/test).
- [x] 3.2 Conferência visual em `http://localhost:3000/design` (seção 14): os nove itens com
      ícone em **cor cheia** (igual ao menu suspenso) — Publicações rosa/verde/azul, Cadastros
      esmeralda/azul, Administração roxo/âmbar/turquesa/azul — nos modos expandido **e** rail;
      só o item raiz neutro.
- [x] 3.3 Conferência visual na sidebar real (`/admin/**`): mesma troca nos dois modos; item
      ativo mantém o ícone colorido com rótulo `text-lime-700` e fundo `bg-brand-structure/10`;
      tooltips do rail intactos; menu Account sem alteração (cores de lá e da sidebar iguais).
- [x] 3.4 Conferência do hover (expandido): item colorido no hover pinta rótulo/ícone com a cor
      do item (verde/azul) sobre o fundo `slate-100`; item sem cor escurece para slate-900; item
      ativo não muda com o hover.
- [x] 3.5 Conferência do menu Account e do peso visual: **hover confirmado pelo usuário**
      (rótulo pinta com a cor do item; Meu Perfil segue branco; Encerrar Sessão segue `#f45f71`)
      e **peso dos ícones do menu reconferido** após a tarefa 2.11 (mesmo peso da sidebar, 1.5)
      em `/design` (seção 14) e `/admin/**` — "tudo certo" no fechamento.

> 3.2–3.4 concluídos pelo usuário; 3.5 parcial (hover ✓, ícones do menu pendentes de olho).
> Verificação automatizada: build verde; `.ds-item-hover:hover`, `.ds-item-hover-dark:hover` e
> `.ds-icon-light{stroke-width:1.5}` presentes no CSS do bundle (`entry.*.css`); SSR de
> `/design` e `/admin` com `ds-item-hover` + `--item-cor` nos 9 itens coloridos da sidebar,
> `ds-icon-light` nos 10 ícones da sidebar (raiz + 9), `font-normal truncate` nos rótulos e
> **zero** `font-medium truncate`. O menu Account é `v-if="contaAberto"` (`AppHeader.vue`), então
> as classes dele são conferidas por busca no markup: `ds-icon-light` 3× em `AppHeader.vue` e 3×
> na seção 14 do `design.vue` (2.11), `ds-item-hover-dark` + `--item-cor` 1× cada no `v-for` dos
> dois arquivos — o comportamento no hover é a 3.5.
