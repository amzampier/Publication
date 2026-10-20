# Design: manuais-backend-e-importacao

## Context

Ver `proposal.md - Why`. Estado relevante já verificado no código:

- O frontend de Manuais Mensais (change arquivada `construir-manuais-mensais`) opera sobre `useState`
  em `useManuaisModelo.ts`; os validadores puros estão em `app/components/manuais/validadores.ts`.
- `manuais_mensal` já tem `arquivada` (migration 21), `UNIQUE (ano, mes_numero)`, `UNIQUE (codigo)`,
  `autor_id`/`revisor_id` (FK para `usuarios`), `data_criacao` (DATE NOT NULL),
  `data_publicacao` (DATE NULL) e timestamps.
- O catálogo RBAC `manuais` já tem 13 funcionalidades; o total é **90** e não muda neste change.
- O padrão de backend é `server/utils/<modulo>.ts` + `server/api/<modulo>/**` com
  `requirePermission` e `registrarAuditoria` (molde `release-week`).
- A importação da Release Week já fixou o padrão: parser puro (`exceljs`) + pré-visualização +
  `POST /api/.../importar` transacional + modelo `.xlsx` em `docs/modelos/`.
- `entregas_itens.manual_id` referencia `manuais_mensal(id)` com `ON DELETE SET NULL` (por isso a
  exclusão precisa de guarda); `anexos_midias.manual_id` é `ON DELETE CASCADE`.
- `docs/02` ainda diz que `manuais_mensal` está “sem UI/API”; `docs/05` mapeia 23 rotas auditadas e
  `docs/13` descreve a fase frontend em memória.

## Goals / Non-Goals

**Goals:**
- Persistir os catálogos mensais e seus itens reais, com RBAC e auditoria no servidor.
- Fechar a importação histórica por planilha.
- Trocar o dataset em memória pela API sem mudar a experiência da tela (lista, KPIs, filtros, ações).
- Manter uma única fonte de regras puras entre app, server e testes.

**Non-Goals:**
- CRUD de `entregas_itens` (pertence a "Lançar as Chamadas"); aqui os itens são somente leitura.
- UI de anexos (`anexos_midias`), Área Pública, fluxo de revisão/`revisor_feedback`.
- Exportação gerada no servidor (CSV/PDF continua no cliente; a API só expõe a guarda `exportar`).
- Preservar o autor histórico na importação (autor = usuário que importa).
- Nova migration: o schema já tem `arquivada`, unicidade e FKs; o RBAC já está em 90.

## Decisions

### D1 — Regras puras em `shared/utils/manuais.ts`
Mover tipos, validação, `gerarCodigo`, `prefillClone`, guarda de exclusão, KPIs, filtros e helpers de
data para `shared/utils/manuais.ts`. `app/components/manuais/validadores.ts` passa a reexportar
`#shared/utils/manuais` (mesmo padrão de `release-week`). App, server, parser e testes usam a mesma
base.

- **Por que:** evita divergência entre a validação da tela e a do servidor.
- **Alternativa descartada:** duplicar a validação em `server/utils` — mais risco de drift.

### D2 — API por ação, com permissão própria
Rotas em `server/api/manuais/**`, com `server/utils/manuais.ts` concentrando validação, SQL e regras:
`GET /api/manuais` (visualizar; `?exportar=1` → exportar), `GET /:id/itens` (visualizar_itens),
`POST` (criar), `PUT /:id` (alterar), `PUT /:id/publicar` (publicar), `PUT /:id/arquivar` (arquivar),
`DELETE /:id` (excluir) e `POST /importar` (importar). As rotas só aplicam RBAC, chamam o util e
registram auditoria.

- **Clone:** o cliente abre o formulário pré-preenchido e grava por `POST` (`criar`); `clonar`
  controla a affordance e a matriz exige `criar` junto.

### D3 — Código gerado/regenerado no servidor
`codigo = MAN-<mês>/<ano>` derivado de `mes`/`ano` na criação e **regenerado** na edição quando
`mes`/`ano` mudam. Unicidade por `codigo` e `(ano, mes_numero)`; violação `1062` → `409` com
`data.erros.mes`. O cliente nunca envia `codigo`.

- **Trade-off:** editar mês/ano altera o código; o formulário mostra o código somente leitura e a
  resposta da API atualiza a linha.

### D4 — Datas: criação e publicação históricas
`data_criacao` = data da planilha (importação) ou `CURRENT_DATE` (cadastro normal). `data_publicacao`
= data da planilha (importação), `CURRENT_DATE` quando o status é `Publicado` no cadastro normal, ou
`null`. O publicar usa `COALESCE(data_publicacao, CURRENT_DATE)` — **não sobrescreve** a data
histórica. A edição do status para `Publicado` também só preenche se estiver vazia. Não há regra de
segunda-feira nem exigência de a publicação cair no mês de referência.

- **Por que:** a importação é para meses históricos; a data de publicação é visível na listagem e
  precisa ser preservada.
- **Alternativa descartada:** sempre usar a data da importação — falsearia o histórico.
- **Limitação:** `criado_em`/`atualizado_em` continuam sendo timestamps do banco; `data_criacao` é a
  data civil histórica (armazenada, mas não exibida na lista; o formulário exibe `criado_em`).

### D5 — Guarda de exclusão no servidor
`DELETE /:id` recusa `409` quando `arquivada = 1`, quando existe `entregas_itens.manual_id = :id` ou
quando existe `anexos_midias.manual_id = :id`. A UI desabilita pelo `itensCount`; a API é a fonte da
verdade (inclusive para anexos, que ainda não têm UI).

- **Por que:** `entregas_itens` usa `ON DELETE SET NULL` (órfãos) e anexos usam `CASCADE`; a guarda
  evita perda silenciosa de relacionamentos.

### D6 — Itens sob demanda
`GET /:id/itens` devolve `entregas_itens` com `manual_id = :id` (inclui `origem = Manual` e `Ambos`)
em modo somente leitura e exige `visualizar_itens`. A expansão busca na primeira abertura e faz
cache por manual; o "Tentar novamente" usa `forcar`. `itensCount` na lista é só contagem
(visualizar).

- **Por que:** o CRUD de itens pertence a "Lançar as Chamadas"; aqui a leitura basta.
- **Alternativa descartada:** editar itens nesta tela — misturaria responsabilidades.

### D7 — Frontend API-backed
`useManuaisModelo` troca `useState`/seed por `useApiFetch`: `carregarManuais` (loading/erro),
`itensDoManual`/`carregarItens` (lazy), `adicionar`/`atualizar`/`publicar`/`arquivar`/`excluir`
(API) e `clonarPreenchimento` (local). Remove o seed e o reset no F5. A página reexibe o `UiLoading`
no F5; `linhas` usa `manual.itensCount`; a guarda visual de exclusão usa `linha.itensCount` (não o
cache de itens). O `Formulario` passa a aguardar a API e mapear `400/409` para os campos; o
`Cabecalho` valida `?exportar=1` antes de gerar PDF/CSV.

- **Por que:** paridade com Release Week e persistência real.
- **Trade-off:** ações passam a ter latência de rede e precisam de estados de loading/erro.

### D8 — Importação histórica transacional
`ManuaisImportar` + `lerPlanilhaManuais.ts` leem o `.xlsx`, classificam as linhas
(`pronto`/`já cadastrado`/`repetido`/`inválida`) e enviam JSON para `POST /api/manuais/importar`. O
servidor revalida campos, status e datas, exige `Data de Publicação` quando o status é `Publicado`,
confere `(ano, mes_numero)` no banco (inclui arquivados), grava em transação com códigos gerados e
registra auditoria. Limite de 500 linhas. Autor = usuário da sessão; o autor histórico não é
preservado.

- **Por que:** segue o molde já validado da Release Week e atende meses históricos sem upload de
  arquivo no servidor (o parser roda no cliente, como na Release Week).
- **Modelo:** Título, Mês, Ano, Descrição, Status, Data de Criação, Data de Publicação, Destaque do
  mês, Destaque da semana.
- **Alternativa descartada:** importar itens de `entregas_itens` — pertence a "Lançar as Chamadas".

### D9 — Auditoria
Recurso **"Manuais Mensais"**: criar/importar → `Inclusão` (importação em 1 evento com a contagem);
editar/arquivar → `Alteração`; publicar → `Homologação`; excluir → `Exclusão`. O filtro de recursos
da Auditoria é derivado do banco, então o novo recurso aparece automaticamente.

### D10 — Sem migration e sem mudança de catálogo RBAC
As migrations 21 (`arquivada`) e 22 (RBAC `clonar`/`visualizar_itens`) já existem; o catálogo já tem
90 funcionalidades. Este change só usa as permissões existentes.

- **Alternativa descartada:** nova migration de RBAC — desnecessária; o catálogo já está correto.

## Risks / Trade-offs

- [Autor histórico não preservado] → decisão do usuário; documentar em `docs/13` e no spec de
  importação.
- [Preview mostra `pronto` para mês arquivado e o commit falha com 409] → o servidor é a fonte da
  verdade; a mensagem de conflito identifica o mês.
- [Delta de `autorizacao-rbac` é longo e pode perder cenários no sync] → copiar o requirement
  inteiro, com todos os cenários, e validar com `openspec validate`.
- [`itensCount` x cache de itens] → a lista e a guarda visual usam o campo da API; o cache serve só à
  expansão.
- [Data histórica sobrescrita no publicar] → `COALESCE` no servidor e teste de publicação com data
  existente.
- [Datas de planilha em formatos diferentes] → parser normaliza Date do Excel, `dd/mm/aaaa` e
  `AAAA-MM-DD`, com classificação de linha inválida.
- [Verificação manual da UI depende de credenciais válidas] → E2E/API pode usar sessão de teste; a
  conferência clicável precisa de um login real.

## Migration Plan

1. `shared/utils/manuais.ts` + reexport em `app/components/manuais/validadores.ts` + testes.
2. `server/utils/manuais.ts` (listar, buscar, itens, criar, atualizar, publicar, arquivar, excluir,
   importar) + testes de regras/import parser.
3. Rotas `server/api/manuais/**` com `requirePermission` e auditoria.
4. `useManuaisModelo` API-backed; `Formulario`, `Tabela`, `Itens`, `Cabecalho` e página.
5. `Importar.vue` + `lerPlanilhaManuais.ts` + modelo `.xlsx`.
6. Specs/docs (`manuais-mensais`, `autorizacao-rbac`, `docs/13`, `docs/02`, `docs/05`).
7. Gates e E2E/API.

**Rollback:** remover as rotas/utilitários e o modal de importação; restaurar o dataset em memória
do frontend; nenhuma migration é aplicada, então não há rollback de banco.
