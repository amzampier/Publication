# Design — update-admin-shell-navigation

## Context

O shell (`app/layouts/default.vue` → `AppHeader` + `AppSidebar`) é **dirigido por dados**: `sidebarOpen`
nasce no layout e desce por prop, e a navegação vem de `app/config/navigation.ts`. O markup de
`AppSidebar.vue` **já** renderiza `itemRaiz` acima das sessões (`:40-54`) e itera `sessoes` com tooltips
no rail — ou seja, a árvore nova entra só mudando o dado. `AppHeader.vue` já tem o markup correto do
menu (Meu Perfil · divisor · itens · divisor · Encerrar Sessão); o que está errado são o logo, o bloco
"Matriz/Filial" e o conteúdo de `accountMenuItens`.

Há **três fontes divergentes** de navegação: `config/navigation.ts` (código real), a seção 14 do
`/design` (cópia local `sidebarGrupos`/`accountMenuItens`, com markup próprio) e `docs/01` §3.3
(descreve sessões que nenhum código implementa). Ver `proposal.md` para a motivação e
`specs/design-system/layout-navigation/spec.md` para o contrato.

## Goals / Non-Goals

**Goals:**

- Uma árvore canônica (item raiz + Publicações/Cadastros/Administração) e um menu Account canônico,
  definidos em um só lugar e observados igual por shell, vitrine e documentação.
- Eliminar os resquícios de outro projeto (logo, empresa/filial, troca de filial).
- Spec nova `design-system/layout-navigation` como contrato validável por QA.
- `docs/03 - Header e Sidebar.md` como referência única de estrutura/comportamento.

**Non-Goals:**

- Rotas `/admin/**`, middleware de auth, RBAC ou persistência de estado (`sidebarOpen` segue em memória).
- Separar Área Pública × Área Administrativa (shell admin continua em `/` — pendência declarada).
- Alterar tokens, cores, larguras, tipografia ou estados de foco (specs `brand-tokens` e
  `form-control-states` permanecem intactos).
- Construir os módulos Parceiros/Softwares (os itens são apenas navegação).

## Decisions

1. **Fonte única em `config/navigation.ts`; a vitrine importa os dados.**
   Alternativa descartada: manter cópia local na vitrine (é o que gerou a divergência atual) ou
   reimplementar dados em composable. A seção 14 importa `sessoes`, `itemRaiz`, `conta`,
   `accountMeuPerfil`, `accountMenuItens`, `accountEncerrarSessao` e remove `sidebarGrupos` local.

2. **A vitrine mantém markup próprio, não usa `LayoutAppHeader`/`LayoutAppSidebar`.**
   Os componentes reais são fixos no shell (`h-16`, altura de viewport, sidebar com `flex-1`); dentro de
   uma seção da página `/design` isso quebraria a caixa de demo (`min-h-[200px]`, impressão). O custo do
   markup duplicado é aceitável **desde que os dados sejam importados** — a divergência restante seria
   só de estilo, e fica coberta por conferência manual (tarefa) + spec.

3. **`AppSidebar.vue` não muda.** O item raiz e a estrutura de sessões já existem; escrever condicionais
   novas seria código morto. Consequência: o rail já herda tooltips/divisores corretos para os 9 itens novos.

4. **Ícones por semântica, todos verificados em `@lucide/vue`:**
   `BookOpen` (Manuais), `Newspaper` (Release Week), `FileText` (Escopo), `Handshake` (Parceiros),
   `Boxes` (Softwares), `Users`/`ShieldCheck`/`Settings` (mantidos), `ScrollText` (Auditoria — troca de
   `Newspaper` para não colidir com Release Week) e `LayoutDashboard` (item raiz, já usado).
   A vitrine passa de `TrendingUp`/`BarChart3`/`Shield`/`Settings2` para os mesmos ícones do real.

5. **Cor do item "Gestão de Auditoria": `#2dd4bf`.** As existentes são `#50a1ff`, `#b070ef`, `#f5b302`
   e `#f45f71`; o turquesa não colide e preserva a leitura por cor do menu (`MenuItem.cor` via `:style`,
   porque Tailwind não resolve cor dinâmica em classe).

6. **Remover `empresaAtiva` e o bloco "Matriz/Filial" (e o separador `#f59e8b ml-[3cm]`, que existia só
   para ele).** `docs/01` §3.1 e `docs/02` §2.1 já mandam escopo único — o código é que divergia.
   Alternativa descartada: manter o texto como "informação inerte" (mantém contradição documentada).

7. **Largura do menu Account = `w-56` (vale a do código real).** `docs/01` §3.2 e a vitrine dizem
   `w-44`; a convenção do projeto é *vitrine/docs espelham o real*. Mesmo critério para o logo:
   `Building2` + `Publications` nos dois lugares.

8. **Spec nova dentro da família `design-system` (`layout-navigation`)**, porque `docs/01` §3 já é a
   fonte visual do shell e as specs existentes (`brand-tokens`, `form-control-states`) seguem o mesmo
   padrão de "uma preocupação por capability". Nenhuma capability existente muda de requisito.

9. **Rótulos de sessão em caixa mista no dado, caixa alta no CSS** (`uppercase` no cabeçalho) — não
   gravar "PUBLICAÇÕES" no código (o `aria-label` ficaria estranho e o dado duplica o estilo).

10. **`app/app.vue` passa a envolver `<NuxtPage />` em `<NuxtLayout>`** *(escopo adicionado durante a
    implementação, aprovado pelo usuário)*. Sem isso o Nuxt emite **NUXT_E4007** e
    `layouts/default.vue` nunca é montado: header e sidebar não apareciam em nenhuma rota, tornando a
    spec inverificável e as tarefas 1.1/2.1/4.2/4.3 impossíveis. Alternativas descartadas: duplicar o
    shell dentro de cada página; adiar para outro change (deixaria 4 tarefas bloqueadas).
    Consequência aceita: `/` passa a exibir o shell da Área Administrativa — a divergência com
    `docs/02` §2.1 já era pendência declarada (`docs/03` §11).

## Risks / Trade-offs

- **A vitrine volta a divergir do shell** → mitigação: dados importados (nada para duplicar), spec
  `layout-navigation` com cenário de fonte única, `docs/03` §10 e tarefa de conferência visual dos dois.
- **Remoção de `empresaAtiva` quebra import em outro arquivo** → mitigação: grep antes de remover
  (hoje só `AppHeader.vue` importa; `notificacoesIniciais` e `conta` permanecem).
- **Itens de menu sem rota parecem "quebrados" ao clicar** → é o comportamento atual (item ativo é mock);
  registrado como escopo não aplicável em `docs/03` §11 e na proposta.
- **`docs/02` §2.1 manda a raiz ser Área Pública e o shell admin continua em `/`** → não endereçado
  aqui de propósito (escopo decidido como "só estrutura de navegação"); a contradição fica declarada em
  `docs/03` §11 e no proposal.
- **Sem lint/test** → o gate é `npm run build` + inspeção visual (CDP) em `/` e `/design`.

## Migration Plan

1. `app/config/navigation.ts` (sessões + menu + remoções).
2. `AppHeader.vue` (logo, remoção do bloco de empresa, limpeza de import).
3. `app/pages/design.vue` §14 (import dos dados, item raiz, menu `w-56`, logo/ícone).
4. `docs/01` §3.1–3.3 e conferência de `docs/03`.
5. `npm run build` + verificação visual (CDP) em `/` e `/design`: árvore, rail (10 tooltips), menu do
   Account, ausência de "Matriz/Filial", sino intacto.
6. `openspec validate` → sync da spec → archive.

Rollback: `git revert` do conjunto — não há dados persistentes, migrations nem contratos de API.

## Open Questions

- **Persistir `sidebarOpen`** (localStorage) entre sessões: não muda nenhum requisito desta spec e pode
  vir em change próprio; hoje segue em memória.
- **Ícone do sino/vazão de notificações** (mock atual) depende do módulo de notificações, ainda inexistente.
