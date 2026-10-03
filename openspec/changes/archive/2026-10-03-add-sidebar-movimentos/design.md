# Design

## Context

A árvore de navegação vive num único ponto — `app/config/navigation.ts` (`sessoes[]`) — e quase tudo deriva dele por `v-for`: `AppSidebar` (modo expandido e rail com divisores), `useSessoesAbertas` (inicialização por rótulo), os presets globais e os cartões por sessão da aba Sidebar de Configurações Globais, e a seção 14 da vitrine `/design`. A motivação está em `proposal.md` (Why).

Dois pontos **não** derivam e são o cerne do trabalho (ver proposal, What Changes):

- `AbaSidebar.vue` mantém `iconeDaSessao: Record<string, Component>` hardcoded por rótulo de sessão (Publicações/Cadastros/Administração), com fallback `Folder` — um rótulo novo cairia no ícone genérico.
- `AbaSidebar.estaAberta` faz `!!sessoesAbertas[label]`, enquanto `AppSidebar` usa `sessoesAbertas[label] ?? sessao.aberto` — divergence possível quando a chave não existe no estado em memória (sidebar aberta, card "Recolhida").

As specs `design-system/layout-navigation` e `configuracoes-globais` enumeram as sessões por extenso ("três sessões", "nove itens", "(Publicações, Cadastros, Administração)"), e os `docs/01`, `docs/03` e `docs/04` fazem o mesmo — as três fontes precisam ser sincronizadas com a árvore nova.

## Goals / Non-Goals

**Goals:**

- Sessão "Movimentos" com dois itens surgir em sidebar (expandida e rail), vitrine e aba Sidebar a partir do `sessoes[]`, sem duplicação de fonte.
- Ícone do cartão "Movimentos" em Configurações Globais igual ao padrão das demais sessões.
- Card e sidebar nunca discordando sobre estar aberta/recolhida.
- Specs e docs enumerando as mesmas quatro sessões na mesma ordem.

**Non-Goals:**

- Criar páginas/rotas para os itens novos (sem `to`, como Manuais/Parceiros) e criar `server/` ou dados de chamadas/esteira.
- Alterar o menu do Account (não espelha Manuais/Parceiros hoje — mesmo critério para Movimentos).
- Alterar comportamento de recolhimento, presets, persistência ou larguras da sidebar.
- Nova dependência, CSS dedicado ou mudança de estado/lógica de dados.

## Decisions

**D1 — Ordem: Publicações → Movimentos → Cadastros → Administração.**
Definida pelo usuário ("deixar após a Publicações"): o fluxo de negócio (lançar/revisionar) vem antes dos cadastros auxiliares e da administração. Alternativa descartada: no fim da lista (pedido explicitamente recusado).

**D2 — Itens sem rota (`to` ausente).**
Mesmo padrão de Manuais/Release Week/Parceiros/Softwares: clicar marca estado visual sem navegar, enquanto as páginas não existirem. A spec `layout-navigation` já prevê "Itens sem rota preserva o comportamento atual", então nenhum requirement de rota muda; quando as telas nascerem, basta acrescentar `to`.

**D3 — Ícones e cores na tradição da árvore.**
`Workflow` para "Esteira de Revisão" (`#8b5cf6`) e `Megaphone` para "Lançar as Chamadas" (`#f59e0b`) — escolhidos por semântica (fluxo de trabalho; anunciar/chamar) e por estarem fora das nove cores já em uso, mantendo a regra "um item => uma cor" aplicada via `tinta()` (D9 de `docs/01`). Ícone da sessão no card de Configurações: `ArrowLeftRight` (movimento) — entrada nova em `iconeDaSessao`, mantendo o `Record` (alternativa descartada por ora: subir `icon` para `SidebarSession` — refactor de interface sem ganho funcional imediato; a paridade de ícone já fica garantida com uma linha).

**D4 — `aberto: true` por padrão.**
Todas as sessões hoje iniciam abertas ("Recomendado" dos presets); a nova segue a convenção. A preferência continua valendo via `useSessoesAbertas`/Configurações Globais como qualquer outra sessão.

**D5 — Fallback de `estaAberta` alinhado ao `AppSidebar`.**
`!!sessoesAbertas[label]` → `sessoesAbertas[label] ?? sessao.aberto` (mesma expressão de `AppSidebar.vue:17/50`): se a chave faltar no estado em memória (ex.: HMR entre a edição do `navigation.ts` e um reload), card e sidebar passam a concordar. Custo: uma expressão; benefício: elimina divergência conhecida entre duas telas que devem ser a mesma fonte.

**D6 — Specs: dois requirements MODIFIED, sem ADDED.**
`layout-navigation`: requirement da árvore canônica (quatro sessões, onze itens, ordem nova) e requirement da fonte única (cenário do espelho da vitrine: "três" → "quatro"). `configuracoes-globais`: requirement do painel de sidebar (cartões incluem Movimentos) e cenário de escolha múltipla (desmarcar Cadastros deixa as outras **três** marcadas). Nenhum requirement novo — a capacidade de ter sessões já existe; muda o conteúdo enumerado.

**D7 — Docs sincronizados na mesma change.**
`docs/01` §sidebar (lista de sessões + tabela de cores com os dois itens novos), `docs/03` (árvore) e `docs/04:188` (enumeração "(Publicações · Cadastros · Administração)"). `AGENTS.md` exige que mudança visual atualize `docs/01` no mesmo change.

## Risks / Trade-offs

- [Estado em memória sem a chave nova se a sessão não for recarregada] → `?? sessao.aberto` em `AbaSidebar` + fallback idêntico já existente no `AppSidebar` cobrem os dois lados; reload completa o initializer de `useSessoesAbertas`.
- [Specs/docs enumerando a árvore ficarem obsoletos de novo na próxima sessão] → mitigação estrutural já existe (fonte única `sessoes[]`); a enumeração em texto é aceita como custo da spec ser verificável a olho — mantida por decisão, não ignorada.
- [`iconeDaSessao` continua hardcoded e esquecível no próximo grupo] → aceito por D3 (uma linha por sessão); se um quinto grupo aparecer, subir `icon` para `SidebarSession` vira o refactor natural.
- [Vitrine §14 espelhará o grupo novo automaticamente e pode não caber no layout dela] → a vitrine deriva do mesmo array por design (requirement "Fonte única"); conferir visualmente na checklist.
- [Sem teste automatizado] → gate do repo é `npm run build` + conferência visual (`/admin` e `/admin/configuracoes-globais`).

## Migration Plan

Mudança puramente visual/de navegação em front-end, sem dados, contratos ou dependências. Deploy junto com o restante; rollback = reverter `navigation.ts` e `AbaSidebar.vue` (git revert). Estado em memória das sessões não persiste entre recargas, então não há dado a migrar.

## Open Questions

Nenhuma — ordem, ícones, cores, ausência de rotas e `aberto: true` foram confirmados na exploração com o usuário.
