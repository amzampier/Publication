# Design: construir-manuais-mensais

## Context

Ver `proposal.md - Why`. Estado relevante já verificado no código:

- `manuais_mensal` existe no schema (`server/migration/01_create_tables.sql` §15) com `codigo`,
  `ano`, `mes`/`mes_numero`, `titulo`, `descricao`, cinco status, `destaque_mes`,
  `destaque_semana`, `total_visualizacoes`, `autor_id`, `revisor_id`, `revisor_feedback`,
  `data_criacao` e `data_publicacao` — **sem** coluna de arquivamento.
- Os itens vivem em `entregas_itens` (`manual_id`, `origem='Manual'`); os arquivos, em
  `anexos_midias` (`manual_id`). As views `v_manual_itens` e `manuais` já existem.
- O item **Manuais** está em `app/config/navigation.ts` (ícone `BookOpen`, `#f45f71`) sem `to`.
- O catálogo RBAC `manuais` tem 11 funcionalidades (`app/config/perfis.ts` e
  `server/utils/perfis.ts`), sem `clonar` e sem `visualizar_itens`; o total do catálogo é **88**
  (`tests/perfis-funcionalidades.test.ts`, `docs/07`).
- O padrão de módulo é o de `docs/10`/`docs/11`/`docs/12`: página fina + componentes em pasta
  própria + `use*Modelo` + `gerarPdf*` + doc `NN - Módulo ...md`.
- `UiDataTable` já tem expansão de linha opcional, `UiActionMenu` já existe e `UiBadge` cobre
  `neutral`, `inReview`, `reconciled` e `publicado`; falta uma variante para
  **Alterações Solicitadas**.
- O `docs/12` registra a fase frontend da Release Week com dataset em memória; este change segue o
  mesmo recorte para o catálogo mensal.

## Goals / Non-Goals

**Goals:**
- Entregar a página `/admin/manuais` navegável e "viva" com dataset em memória, exercitando todas
  as ações sem backend.
- Fixar o contrato do modelo (campos, `arquivada`, itens) e das permissões (`clonar`,
  `visualizar_itens`) para a fase backend.
- Reutilizar o kit existente; nenhum componente de domínio paralelo.
- Deixar `docs/13` como referência do código e da fase backend pendente.

**Non-Goals:**
- APIs (`server/api/manuais/**`), utils de servidor, auditoria server-side e troca do dataset pela
  API.
- CRUD de itens (`entregas_itens`), upload/gerência de anexos (`anexos_midias`) e importação
  funcional (parser/modelo `.xlsx`/commit).
- Área Pública, leitura anônima, contadores de visualização reais e paginação server-side.
- Edição de autor/revisor, `revisor_feedback` e fluxo de revisão (pertencem à Esteira de Revisão).

## Decisions

### D1 — A unidade da tela é o catálogo mensal, com itens expansíveis
Cada linha representa um mês/ano (`manuais_mensal`), não um manual individual. Os manuais
individuais são os itens de `entregas_itens` (`origem='Manual'`), exibidos em expansão somente
leitura — mesmo padrão da Release Week.

- **Por que:** é o modelo do banco (`UNIQUE (ano, mes_numero)`), o nome do módulo ("Manuais
  Mensais") e o padrão já validado em `docs/12`.
- **Alternativa descartada:** listagem plana de manuais — exigiria inventar um cadastro por manual
  que o schema não possui na tabela de cabeçalho.

### D2 — Dataset em memória como `useState` de rascunho
`useManuaisModelo` mantém `ManuaisModelo[]` e `ItemManual[]` em `useState`, semeados com exemplos no
primeiro acesso. Todas as ações (incluir/editar/clonar/publicar/arquivar/excluir) mutam esses
arrays; recarregar a página restaura o conjunto inicial e nada vai ao banco.

- **Por que:** decisão da fase frontend; permite clicar e validar o fluxo sem API/seed.
- **Alternativa descartada:** contract-first vazio (precedente de Softwares) — não permitiria
  exercitar as ações agora.
- **Dívida registrada:** na fase backend, o array é substituído por `GET /api/manuais` e
  `arquivada` passa a ser lido/gravado na coluna criada por este change.

### D3 — `arquivada` entra agora, como migration aditiva
`21_add_manuais_arquivada.sql` adiciona `arquivada TINYINT(1) NOT NULL DEFAULT 0` após
`destaque_semana` e o índice `idx_manuais_arquivada`, espelhando a migration 19 da Release Week.

- **Por que:** o usuário pediu explicitamente a coluna; o campo já faz parte do contrato do modelo e
  evita uma segunda migration na fase backend. A UI desta fase usa o campo apenas em memória.
- **Alternativa descartada:** deixar a coluna para o backend — o modelo e as guardas de
  arquivamento/exclusão ficariam sem lastro no schema.
- **Rollback:** `ALTER TABLE manuais_mensal DROP COLUMN arquivada` + `DROP INDEX`, registrados no
  próprio arquivo.

### D4 — RBAC de `manuais` alinhado à Release Week
`22_reconciliar_rbac_manuais.sql` acrescenta, de forma idempotente, `clonar` ao Administrador e ao
Editor e `visualizar_itens` aos quatro perfis. O catálogo (`app/config/perfis.ts` ↔
`server/utils/perfis.ts`) passa de 11 para 13 funcionalidades; o total vai de **88 para 90**;
`validarMatriz` passa a exigir `criar` para conceder `clonar` em `release-week` **e** `manuais`.

- **Contagens normativas:** Administrador `90/90`, Editor `65/90`, Revisor `39/90`, Leitor `14/90`;
  total concedido `208`; denominador `4 × 90 = 360`.
- **Por que:** sem as permissões no banco o clone e a flag de itens não apareceriam para os perfis
  reais; a atualização do catálogo sem a migration deixaria a tela e a matriz divergentes.
- **Alternativa descartada:** conceder só no cliente — quebraria a fonte única do RBAC e o teste de
  sincronia app × server.
- **Impacto documental:** `docs/07` (catálogo, totais e regra de clonagem), seeds e o teste do
  catálogo.

### D5 — Status e variantes do `UiBadge`
Mapeamento: `Rascunho → neutral`, `Em Revisão → inReview`, `Alterações Solicitadas → alteracoes`
(nova variante âmbar), `Aprovado → reconciled`, `Publicado → publicado`.

- **Por que:** `Alterações Solicitadas` é um estado acionável distinto de "Pendente" e de
  "Bloqueado" (que pulsa); a variante própria evita semântica emprestada.
- **Alternativa descartada:** reutilizar `pending`/`blocked` — menos código, mas o rótulo/ícone não
  representa o estado.
- **Escopo do kit:** adição estritamente aditiva ao `Badge`; atualizar `docs/01 §5.2` e a seção 4 do
  `/design`.

### D6 — Clonagem copia conteúdo, nunca identidade nem vínculos
`Clonar` abre o mesmo `Formulario` em modo criação com `titulo`, `descricao`, `destaque_mes` e
`destaque_semana` copiados. `codigo`, `mes`, `ano`, datas, `status` (`Rascunho`), itens e anexos
ficam em branco. A ação exige `clonar`; a gravação (fase backend) usa a criação e exige `criar`.

- **Por que:** o código e o par `(ano, mês)` são identidade; copiá-los criaria conflito. Itens e
  anexos pertencem ao mês de origem.
- **Alternativa descartada:** clonar tudo — colidiria com `uk_manual_ano_mes` e duplicaria vínculos.

### D7 — Publicar, arquivar e excluir
Publicar muda o status para `Publicado` e preenche `data_publicacao`. Arquivar marca
`arquivada = true` (soft) e remove o mês da listagem/KPIs. Excluir só é oferecido quando
`!arquivada && itens.length === 0`; o motivo fica acessível no controle desabilitado.

- **Por que:** replica a semântica já validada na Release Week e evita apagar histórico/relações.

### D8 — Expansão de itens somente leitura sob `visualizar_itens`
A flag no cabeçalho (`#expandHeader`) liga o `+` por linha; `#expanded` renderiza
`ManuaisItens` com Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status e Data de
liberação. A busca dos itens é lazy/cache por `manual_id` (nesta fase, do dataset em memória; no
backend, de `GET /api/manuais/:id/itens`). Sem `visualizar_itens`, a flag não aparece.

- **Por que:** o CRUD de itens pertence a "Lançar as Chamadas"; aqui a leitura é suficiente e
  simétrica à Release Week.
- **Alternativa descartada:** editar itens nesta tela — misturaria responsabilidades e exigiria
  backend de `entregas_itens`.

### D9 — Exportações e importação
Menu "Relatórios" no cabeçalho com **PDF** (`gerarPdfManuais`) e **CSV** (`;`, BOM UTF-8,
neutralização de fórmulas) do conjunto filtrado, sob `exportar`. O ícone de importação fica à
esquerda de "Filtros", sob `importar`, e nesta fase é inerte (sem modal/parser/requisição).

- **Por que:** mantém paridade com Release Week/Parceiros e deixa a affordance pronta para o
  backend.
- **Alternativa descartada:** importação completa agora — exigiria modelo `.xlsx`, parser e endpoint
  de gravação (backend).

### D10 — Anexos ficam fora desta fase
`anexos_midias` não ganha UI agora; a galeria/upload entra junto do CRUD de itens ou da fase
backend.

- **Por que:** não há endpoint de vínculo `manual_id` × anexo; uma UI local sem persistência
  ensinaria um fluxo falso.

### D11 — Cinco KPIs e filtro de destaque
Cinco `UiKpi` (um por status) sobre o conjunto vigente e filtros **Status, Ano, Mês, Autor e
Destaque** (Todos / Destaque do mês / Destaque da semana).

- **Por que:** cinco status não cabem em quatro KPIs e o destaque é informação de negócio do mês.
- **Alternativa descartada:** quatro KPIs agrupando "Alterações" em "Em Revisão" — perderia a
  leitura do estado acionável.

### D12 — Componentização e documentação
`app/pages/admin/manuais.vue` (coordenação) + `app/components/manuais/`:
`Cabecalho`, `Kpis`, `Tabela`, `Itens`, `Filtros`, `Formulario`, `Publicar`, `Arquivar`,
`Exclusao`, `useManuaisModelo.ts`, `gerarPdfManuais.ts`. `docs/13` documenta a tela, o modelo, o
fluxo, o RBAC, a fase frontend e as pendências de backend.

- **Por que:** mantém o padrão dos módulos existentes e a página fina.
- **Doc:** o `docs/13` é criado na implementação, não neste planejamento.

## Risks / Trade-offs

- [Migrations em uma change "frontend"] → São aditivas/idempotentes, não criam APIs e têm rollback
  no próprio arquivo; o boot do Nitro as aplica e falha cedo se o banco estiver indisponível.
- [Contagens 88→90 espalhadas por specs, docs e testes] → Atualizar catálogo app × server, teste do
  total, `docs/07` e os exemplos `88/88`/`n/88`/`0/88`; `openspec validate` + `npm run test` pegam
  divergências.
- [Dataset em memória some no F5] → Esperado e documentado no `docs/13`; a tela deixa claro que é
  rascunho da fase frontend.
- [Unicidade `(ano, mês)` só em memória] → A validação do cliente cobre a fase atual; a fase backend
  reaplica no banco (`uk_manual_ano_mes`) e responde `409`.
- [Nova variante do `Badge` regride estilos existentes] → Adição pura de `case`, sem alterar as
  variantes atuais; conferir `/design` e as telas que usam Badge.
- [Expansão de itens dentro do `UiDataTable`] → Reutiliza a implementação já validada na Release
  Week; verificar que sem a flag a tabela permanece idêntica.
- [Clone e flag de itens dependem de permissões novas] → A migration 22 e o catálogo entram no mesmo
  change; sem elas, a UI esconderia as ações para todos os perfis.

## Migration Plan

Ordem de implementação (sem APIs):

1. **Contrato de banco:** migrations `21`/`22`, seeds (`server/migration/02_seed.sql` e
   `docs/bd/02_seed.sql`), `docs/bd/01`; validar o boot e o rollback.
2. **RBAC:** catálogo app × server, `validarMatriz` (clonar⇒criar em `manuais`), teste do total 90,
   `docs/07`.
3. **Design system:** variante `alteracoes` no `Badge`, `docs/01 §5.2` e `/design`.
4. **Modelo:** `useManuaisModelo` (dataset, derivados, validação, regras de clone/arquivo/exclusão) +
   `tests/manuais-validadores.test.ts`.
5. **Componentes e página:** `Cabecalho`, `Kpis`, `Tabela`, `Itens`, `Filtros`, `Formulario`,
   `Publicar`, `Arquivar`, `Exclusao`, `gerarPdfManuais`, `app/pages/admin/manuais.vue`.
6. **Navegação:** `to: '/admin/manuais'` no item `manuais`.
7. **Documentação:** `docs/13` espelhando o código e registrando as pendências de backend.
8. **Gates:** `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` + conferência
   manual em `/admin/manuais` e `/design`.

**Rollback:** remover a página/componentes e a rota da sidebar; reverter o `Badge` e o catálogo para
88; executar os rollbacks manuais das migrations 21/22 (coluna/índice e extras JSON). Nenhum dado de
negócio é apagado pelas migrations aditivas.
