# Design

## Context

Não existe rota nem tela de auditoria: os itens de navegação apontam para nada (`to` ausente) e o único artefato construído é a aba de Retenção em Configurações. O modelo de registro já está definido no `docs/02` §3.6 (`registrarAuditoria`: ação, recurso, detalhes, data/hora, IP, usuário) e o kit tem todas as peças necessárias (`UiDataTable` com busca/sort/paginação + slot `#actions`, `UiModal`, `UiKpi`, `UiSelect`, `UiBadge`, `UiTooltip`, `UiButton`). O `@media print` de `main.css:125` já oculta shell e botões. Sem `server/`, a tela nasce como fase 1 em memória. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Página `/admin/auditoria` completa com KPIs, filtros em modal, tabela, detalhe e exportação, 100% com o kit existente
- Navegação (sidebar + conta) ligada à rota, com item ativo
- `docs/05` documentando a tela no padrão do `docs/04` e spec `auditoria` como fonte de verdade
- Nomenclatura canônica `auditoria` em toda a base (aba Retenção + `docs/04`)

**Non-Goals:**
- Componentes novos de kit ou novas dependências (`package.json` intocado)
- `server/`, persistência, RBAC/autorização da rota (mesma condição das demais rotas `/admin` de hoje)
- Filtros avançados (IP, busca por recurso), "Atualizar", agrupamento de colunas
- Itens de navegação restantes sem rota (Gestão de Usuários, RBAC, Painel Executivo)
- Vitrine `/design` (sem componente de kit novo, não há demo a espelhar)

## Decisions

1. **Rota + navegação pelo `navigation.ts`** — `to: '/admin/auditoria'` em "Auditoria" (sidebar) e "Gestão de Auditoria" (conta); ativação da sidebar é o comportamento já specado em `layout-navigation`. *Alternativa:* middleware/redirect (rejeitada — sem ganho sem `server/`).

2. **Componentização no padrão Configurações** — página fina (`app/pages/admin/auditoria.vue`, `definePageMeta({ layout: 'admin' })`, `p-4 sm:p-6 lg:p-8 > mx-auto max-w-5xl`) montando `AuditoriaCabecalho`, `AuditoriaKpis`, `AuditoriaFiltros`, `AuditoriaTabela`, `AuditoriaDetalhe` em `app/components/auditoria/` (auto-import `Auditoria*`, como `Configuracoes*`). *Alternativa:* tudo na página (rejeitada — pedido explícito de página toda componentizada e preparada para crescer).

3. **Estado central no composable `useAuditoriaDemo`** — `useState` para os filtros (sobrevivem à troca de rota no mesmo ciclo, como os demais estados do repositório), array constante de ~25 registros de demonstração e `registrosFiltrados` (computed com período/usuário/ação/recurso) compartilhado por KPIs, tabela e exportação — uma fonte única de verdade.

4. **Filtros estruturais em `UiModal`: datas + chips (revisão do usuário)** — data inicial e data final com dois `UiDatePicker` (valor `Date` do componente, estado gravado como `yyyy-mm-dd` para serializar no `useState` e filtrado por dia local, inclusivo); usuário/ação/recurso como **listas de `UiCheckChip` de seleção única** (chips `model-value` derivado do valor vigente, clicar no selecionado limpa — caso de uso documentado do `UiCheckChip`: "filtros rápidos"). Rodapé: "Limpar Filtros" à esquerda; "Cancelar" (fecha sem aplicar) + "Aplicar" à direita. Cabeçalho com `:icon` para igualar o header do kit (ícone + separador + título/subtítulo). *Alternativas descartadas:* presets 7/30/90 (pedido do usuário trocou por intervalo de datas); manter `UiSelect` nos filtros — o dropdown absoluto estende a área rolável do corpo do modal e criava uma barra de rolagem grande (queixa do usuário); radios nativos ou inputs paralelos (fora do kit).

5. **Menu do Exportar hand-rolled no `Cabecalho`** — mini-menu `role=menu` com `aria-expanded`, Escape e clique fora, copiando o padrão do menu da conta do `AppHeader` (linhas conhecidas do próprio repositório). *Alternativa:* criar `UiMenu` no kit (rejeitada — novo componente de kit exigiria aprovação e o menu da conta já é markup de domínio; extrair para o kit vira tarefa futura).

6. **CSV por Blob, PDF por impressão do navegador** — "Exportar em CSV": `Blob` com **BOM UTF-8** (`\uFEFF`) + `<a download>`, cabeçalhos fixos do modelo, sobre o snapshot dos filtrados. "Listar em PDF": `window.print()` usando o `@media print` existente (oculta `header/aside/nav/button`). *Alternativa:* jsPDF (rejeitada — nova dependência exigiria aprovação do usuário; o diálogo de impressão já entrega "Listar em PDF").

7. **Detalhe pela coluna Ações do `UiDataTable`** — slot `#actions` com ícone + `UiTooltip` + `UiModal` (mesmo padrão do "Liberar" na aba Segurança). *Alternativa:* clique na linha (rejeitada — `UiDataTable` não emite evento de linha e modificar o kit está fora de escopo).

8. **Badge da ação por variante semântica** — Inclusão → `done` (esmeralda), Alteração → `inReview` (azul), Homologação → `reconciled` (índigo), Exclusão → `blocked` (rosa), com o slot `default` do `UiBadge` exibindo o rótulo em pt-BR. *Gotcha conhecido:* `blocked` força o dot pulsante — aceito nesta etapa (exclusões destacadas); se poluir em uso real, trocar por variante neutra é ajuste de uma linha.

9. **Ordenação prévia nos dados** — registros chegam à tabela já ordenados por `registradoEm` decrescente (mais recente primeiro), sem depender das regras de sort do kit para o estado inicial.

10. **Naming canônico `auditoria`** — `AbaRetencaoAuditoria.vue:39` (query do banner) e a citação em `docs/04:129` passam de `logs_auditoria` para `auditoria`; `docs/02` e a spec `configuracoes-globais` já usam o nome correto (esta change apenas o fixa no delta).

11. **`docs/05` espelha o `docs/04`** — mesmas 12 seções (sumário, rota, componentização, componentes de domínio, kit, comportamento, dados fase 1, navegação, estilo, specs, verificação, pendências), registrando "nenhum componente de kit novo".

12. **Toolbar do `UiDataTable`: `UiInput` + botão Filtros opt-in** — a busca global troca o `<input>` hand-rolled pelo `UiInput` do kit (`leftIcon` lupa; limpar via `rightIcon` condicional + `rightIconClick`; `v-model` no `searchQuery`; placeholder, busca case-insensitive e estado vazio inalterados) e a linha do header ganha o botão `UiButton` "Filtros" à direita, ativado por `showFilters` (**default `false`**), com badge de `filtersCount` (> 0) e emit `open-filters`; o `v-if` do header passa a contemplar `showFilters`. *Alternativas:* slot `#filters` em que cada consumidor monta seu botão (rejeitada — o pedido é o kit já trazer o botão pronto para as próximas páginas); botão sempre visível (rejeitado — páginas sem filtro ficariam com um botão sem ação; o opt-in por prop elimina regressão nos consumidores atuais). `docs/01` §5.11 e a vitrine §13 são atualizados no mesmo change (tasks próprias do grupo de kit).

13. **Auditoria usa o botão do DataTable, não um no cabeçalho** — `AuditoriaTabela` passa `show-filters`, `:filters-count` e `@open-filters` para abrir o `AuditoriaFiltros`; `AuditoriaCabecalho` fica somente com título + menu Exportar. *Alternativa:* manter o botão no cabeçalho (rejeitada — a mesma tela teria dois botões "Filtros", ou a página divergiria do padrão que as próximas páginas herdam da toolbar).
14. **`UiTooltip`: foco só com `:focus-visible`** — o `@focusin` passa por um guard que só chama `show()` quando o alvo casa com `:focus-visible` (com fallback para navegadores sem suporte: mantém o comportamento antigo). O `UiModal` foca o primeiro focável (botão X) na abertura; com mouse o modality recente é de ponteiro → `:focus-visible` falso → sem tooltip "Fechar" sem hover; navegação por teclado (Tab/foco de teclado) → `true` → balão continua sendo exibido (a11y preservada). *Alternativas:* focar o painel do modal em vez do X (rejeitada — cria arestas no focus-trap com Shift+Tab); remover o tooltip do X (rejeitada — `docs/01` §5.12 documenta ele); exigir hover puro (rejeitada — mataria o conteúdo no foco de teclado, que é comportamento documentado e esperado).

## Risks / Trade-offs

- [Mini-menu duplica a lógica Esc/clique-fora do menu da conta] → mantido local e pequeno (arquivo único do `Cabecalho`); extrair `UiMenu` para o kit fica como pendência em `docs/05`.
- [Duas superfícies de filtragem (busca da `UiDataTable` × filtros do modal)] → complementares por definição: busca = texto livre instantâneo, modal = filtros estruturais com Aplicar/Limpar; documentar em `docs/05`.
- [Impressão com a tabela em estado diferente do esperado] → o `@media print` existente já oculta shell, botões e a toolbar da tabela; o fluxo natural é imprimir com modais fechados (estado normal da página).
- [CSV aberto no Excel com acentos quebrados] → BOM UTF-8 no início do arquivo.
- [KPI "Registros" muda com o filtro (é a contagem do filtrado, não da base inteira)] → fixado na spec com cenário explícito para não gerar ambiguidade.
- [Dot pulsante do badge de Exclusão] → decisão 8; troca por variante neutra é ajuste de uma linha se incomodar.
- [Trocar a busca por `UiInput` muda o visual da toolbar em toda tabela com busca ativa (vitrine §13, demos)] → é a aderência ao DS solicitada; o consumo se restringe a quem usa `showHeaderTop` e a regressão é verificada por CDP (digitar, limpar, estado vazio).
- [Toolbar estreita com busca + botão lado a lado] → cluster da direita em flex com wrap: abaixo de `sm` o input fica full-width e o botão cai para a linha seguinte; verificado a 375px na checagem final.
- [Botão "Filtros" sem listener em páginas atuais] → `showFilters` default `false`; nenhum consumidor existente (aba Segurança, demos atuais) passa a prop — apenas a vitrine §13 e a página de Auditoria, com handler.
## Migration Plan

Frontend puro, sem migrations: implementar → `npm run build` → checagem CDP (rota, filtros, detalhe, CSV, impressão) → `docs/05` e specs no mesmo change; rollback = reverter o commit.

## Open Questions

*(nenhuma — escopo, blocos, exportação, filtros e nomenclatura fechados com o usuário na exploração.)*