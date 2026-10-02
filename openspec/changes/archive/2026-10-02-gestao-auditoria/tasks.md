# Tasks

## 1. Rota, navegação e base de demonstração

- [x] 1.1 Criar `app/pages/admin/auditoria.vue` (`definePageMeta({ layout: 'admin' })`, `p-4 sm:p-6 lg:p-8 > mx-auto max-w-5xl`) com o cabeçalho do módulo (ícone `ScrollText` `text-[#2dd4bf]` + título "Gestão de Auditoria") e a estrutura montando os painéis dos grupos 3-4 — verificar: `curl http://localhost:3000/admin/auditoria` retorna 200, o HTML contém "Gestão de Auditoria" e `id="app-sidebar"` (shell herdado)
- [x] 1.2 Em `app/config/navigation.ts`, adicionar `to: '/admin/auditoria'` ao item "Auditoria" da sidebar e ao item "Gestão de Auditoria" do menu da conta — verificar (CDP): clicar em cada item navega para `/admin/auditoria` e o item da sidebar aparece como ativo na rota
- [x] 1.3 Criar `app/components/auditoria/useAuditoriaDemo.ts`: `useState` dos 4 filtros, ~25 registros coerentes com o `docs/02` §3.6 (`registradoEm` nos últimos 30 dias em ordem decrescente, ações Inclusão/Alteração/Exclusão/Homologação, ≥4 usuários, ≥5 recursos, IPs variados) e `registrosFiltrados` (computed: período/usuário/ação/recurso) — verificar: consumido sem erro pelos componentes do grupo 3 (contagem e ordenação validadas no grupo 7.2)

## 2. Componente de kit — `UiDataTable` (busca padrão DS + botão Filtros)

- [x] 2.1 Em `DataTable.vue`, substituir o `<input>` de busca da toolbar por `UiInput` (`leftIcon` lupa, limpar via `rightIcon` condicional + `rightIconClick`, `v-model="searchQuery"`) mantendo placeholder "Filtrar dados da tabela...", busca case-insensitive e estado vazio — verificar (CDP): foco exibe o overlay `.ds-bottom-clip` `border-brand-focus` (controle do kit), digitar filtra, limpar restaura todos os registros
- [x] 2.2 Adicionar ao `DataTable.vue` as props `showFilters` (default `false`) e `filtersCount` (badge quando > 0) e o emit `open-filters`, com `UiButton` (variante outline, ícone de filtro, rótulo "Filtros") à direita do campo de busca, e o `v-if` do header contemplando `showFilters` — verificar (CDP): sem `showFilters` (aba Segurança, demos atuais) a toolbar **não** muda; com `showFilters` o botão aparece à direita, o clique emite `open-filters`, `filtersCount=2` rende badge "2" e a 375px busca + botão não geram overflow
- [x] 2.3 Atualizar `docs/01` §5.11 (props `showFilters`/`filtersCount`, linha "Emits: nenhum" → `open-filters`, bullet da busca no padrão do `UiInput`, exemplo) e a vitrine `/design` §13 com `show-filters` + `@open-filters` exibindo toast de demonstração — verificar: grep do §5.11 não encontra mais "Emits: nenhum" e, via CDP, o botão Filtros aparece na §13 e dispara o toast ao clicar

## 3. Componentes de domínio (`app/components/auditoria/`)

- [x] 3.1 `Cabecalho.vue` — título + botão "Exportar" com mini-menu `role=menu` no padrão do menu da conta do `AppHeader` (Escape fecha, clique fora fecha, `aria-expanded`); **sem** botão Filtros (o da tabela cobre a página) — verificar (CDP): menu abre, exibe as 2 opções, Escape fecha, e a página não tem botão Filtros no cabeçalho
- [x] 3.2 `Kpis.vue` — 4 `UiKpi`: Registros (contagem do filtrado), Período (rótulo vigente), Usuários distintos, Última atividade — verificar (CDP): sem filtros, "Registros" = nº da base e "Última atividade" = registro mais recente
- [x] 3.3 `Filtros.vue` — `UiModal` com UiSelects de período (Tudo/7/30/90 dias), usuário, ação e recurso + botões "Aplicar filtros"/"Limpar filtros" — verificar (CDP): aplicar período "Últimos 7 dias" reduz a contagem do KPI e a tabela; limpar restaura tudo e zera o `filtersCount` da toolbar
- [x] 3.4 `Tabela.vue` — `UiDataTable` ligada ao modal: `show-filters`, `:filters-count`, `@open-filters`, colunas data/hora, usuário, ação (slot `default` do `UiBadge`), recurso, detalhes e IP (dados já em ordem decrescente) e slot `#actions` com ícone + `UiTooltip` "Ver detalhes" — verificar (CDP): colunas visíveis, 4 variantes de badge distintas, paginação funcionando e o botão Filtros da toolbar abre o modal com o contador refletindo os filtros ativos
- [x] 3.5 `Detalhe.vue` — `UiModal` (size `sm`) exibindo todos os campos do registro selecionado + rodapé com "Fechar" — verificar (CDP): acionar "Ver detalhes" abre o modal com data/hora, usuário, ação, recurso, IP e detalhes; Escape/X/Fechar fecha
- [x] 3.6 Montar os componentes na página com o rodapé "Registros sujeitos à política de retenção" + controle de navegação para `/admin/configuracoes-globais` — verificar (CDP): nota visível sob a tabela e o clique leva à rota de Configurações

## 4. Exportação (registros filtrados)

- [x] 4.1 Opção "Exportar em CSV": `Blob` com BOM UTF-8, cabeçalhos do modelo, linhas = `registrosFiltrados` + `<a download>` — verificar (CDP): com filtro ativo, o evento de download traz somente as linhas filtradas e o conteúdo inicia com o BOM e os cabeçalhos
- [x] 4.2 Opção "Listar em PDF": `window.print()` acionada pelo item do menu — verificar (CDP): `window.print` é invocado (spy) e, com mídia emulada `print`, header/sidebar/botões ficam ocultos pela regra existente de `main.css`

## 5. Nomenclatura canônica da tabela (docs no mesmo grupo)

- [x] 5.1 Trocar `logs_auditoria` → `auditoria` na query do banner de `AbaRetencaoAuditoria.vue:39` e na citação de `docs/04:129` — verificar: grep por `logs_auditoria` em `app/` e `docs/` retorna 0 e o banner da aba Retenção exibe `DELETE FROM auditoria …`

## 6. Documentação

- [x] 6.1 Criar `docs/05 - Gestão de Auditoria.md` com o esqueleto do `docs/04` (sumário, visão geral/rota, estrutura de componentização, componentes de domínio, componentes de kit — registrando **nenhum novo**, com o `UiDataTable` evoluído no grupo 2 —, comportamento de filtros na toolbar/tabela/detalhe, exportação, dados fase 1, navegação, estilo, specs OpenSpec, verificação, pendências) — verificar: sumário confere com as seções e todos os caminhos/arquivos citados existem no repositório

## 7. Verificação integrada

- [x] 7.1 `npm run build` sem erro e `openspec validate gestao-auditoria --strict` válido
- [x] 7.2 Checagem CDP unificada: rota com shell + item ativo, busca `UiInput` no padrão do DS, filtros aplicar/limpar/contador no botão da toolbar, KPIs recalculando, detalhe, download CSV, impressão e screenshots a 375 e 1440px; regressão da Configurações (banner com `auditoria`, abas operando) e das tabelas sem `showFilters`
## 8. Ajustes do modal de Filtros (pedido do usuário)

- [x] 8.1 `useAuditoriaDemo.ts`: substituir `periodo` (presets) por `dataInicial`/`dataFinal` (`yyyy-mm-dd`), filtrar por dia local inclusivo, contar as 5 dimensões em `filtrosAtivosCount` e derivar `periodoRotulo` do intervalo — verificar: sem datas o rótulo é "Tudo"; com 01/10–02/10 o rótulo é "01/10 – 02/10" (CDP no grupo 8.4)
- [x] 8.2 `Filtros.vue`: header com `:icon` (igual ao `UiModal` do kit), 2 `UiDatePicker` (Data Inicial/Data Final), chips de seleção única para usuário/ação/recurso (sem `UiSelect`), rodapé com "Limpar Filtros" à esquerda e "Cancelar" + "Aplicar" à direita — verificar (CDP): modal sem barra de rolagem anômala ao interagir, datas filtram a tabela/KPIs, Cancelar descarta o rascunho, Limpar zera, ícone + separador no header
- [x] 8.3 Atualizar `docs/05` (§3.2 KPI Período, §3.3 Filtros, §5 comportamento) — verificar: grep do docs/05 não encontra mais "presets Tudo / Últimos 7" e descreve datas/chips/botões
- [x] 8.4 `npm run build` + checagem CDP do modal novo (datas, chips, footer, cancelar, contador badge) com screenshot de evidência
- [x] 8.5 `UiTooltip.vue`: abrir no foco **apenas com `:focus-visible`** (foco programático do modal não mostra mais o tooltip "Fechar" no X) e atualizar `docs/01` §5.5 — verificar (CDP): abrir o modal com mouse real não exibe o balão, hover no X exibe, mouse fora esconde e foco de teclado ainda exibe (4/4)