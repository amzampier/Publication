# Tasks

## 1. Fundação de dados e regras compartilhadas

- [x] 1.1 Criar `server/migration/23_add_escopo_arquivada_e_ano_versao.sql` com `arquivada`, `idx_projetos_arquivada` e `uk_projetos_ano_versao`, sem nenhum `INSERT`/seed; verificar o boot/migration e confirmar `SELECT COUNT(*) FROM projetos_escopo` = 0 em banco limpo
- [x] 1.2 Criar `shared/utils/escopo-projetos.ts` com tipos (`ProjetoEscopoModelo`, `ItemProjeto`, `StatusEscopo`, `FiltrosEscopo`, `KpisEscopo`), `STATUS_ESCOPO`, validação (nome/versão/ano/datas e unicidade `(ano, versao)`), geração `PE-<ano>.<sequencial>`, filtros, busca, KPIs, guarda de exclusão e helpers de apresentação; verificar `npm run typecheck`
- [x] 1.3 Fazer `app/components/escopo-projetos/validadores.ts` reexportar `#shared/utils/escopo-projetos` e remover `SOFTWARES_MOCK`/lógica de seed da camada compartilhada; verificar que o frontend ainda compila
- [x] 1.4 Atualizar `tests/escopo-projetos-validadores.test.ts` para a nova validação `(ano, versao)`, remoção da obrigatoriedade de softwares e helpers compartilhados; verificar `npm run test`
- [x] 1.5 Atualizar `docs/02` para registrar `projetos_escopo` com backend/API, coluna `arquivada` e ausência de seed; conferir que não restou a afirmação de “API pendente”

## 2. Núcleo do backend e rotas

- [x] 2.1 Criar `server/utils/escopo-projetos.ts` com `validarIdEscopo`, mapeamento do shape da API, `listarEscopos` (não arquivados, `itensCount` e softwares derivados), `buscarEscopo`, `criarEscopo`, `atualizarEscopo`, `publicarEscopo`, `arquivarEscopo` e `excluirEscopo`; verificar com `npm run typecheck`
- [x] 2.2 Implementar geração de código e tratamento de concorrência/`1062` para `(ano, versao)` e `codigo`, com respostas `409` consistentes; verificar com chamadas reais de criação em sequência e em paralelo
- [x] 2.3 Criar as rotas `server/api/escopo-projetos/index.get.ts`, `index.post.ts`, `[id]/index.put.ts`, `[id]/publicar/index.put.ts`, `[id]/arquivar/index.put.ts` e `[id]/index.delete.ts`, todas com `requirePermission`, `registrarAuditoria` e auditoria no recurso "Escopo de Projetos"; verificar 401/403/201/409/200 e os eventos de auditoria
- [x] 2.4 Implementar a guarda `?exportar=1` na listagem exigindo `exportar` e registrar no `docs/14` o contrato de leitura/escrita da API; verificar a resposta 403 para perfil sem a permissão
- [x] 2.5 Atualizar `docs/05` com o recurso de auditoria "Escopo de Projetos" e conferir que os eventos de inclusão/alteração/homologação/exclusão aparecem na Gestão de Auditoria

## 3. Itens e softwares derivados

- [x] 3.1 Implementar `listarItensEscopo` em `server/utils/escopo-projetos.ts` lendo `entregas_itens` por `projeto_id` e devolvendo Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status e Data de liberação; verificar com um escopo sem itens e com itens inseridos manualmente em ambiente de teste
- [x] 3.2 Criar `GET /api/escopo-projetos/:id/itens` com `visualizar`, validação de id e `404` para escopo inexistente; verificar a leitura e os códigos de erro
- [x] 3.3 Implementar a derivação de softwares por `entregas_itens`/`softwares` (nomes distintos, fallback para o texto do item), gravar `softwares_contemplados = []` no create/import e atualizar `docs/14` com a regra “softwares vêm das chamadas”; verificar a listagem sem itens e após inserir itens de teste

## 4. Importação XLSX de escopos

- [x] 4.1 Criar `app/components/escopo-projetos/lerPlanilhaEscopoProjetos.ts` com `COLUNAS_MODELO` (Nome, Versão, Ano, Data de Início, Data Final, Data de Previsão, Data de Publicação, Status, Descrição Geral), normalização de datas, `classificarLinhasEscopoProjetos` pura e leitura `exceljs`; verificar `npm run test`
- [x] 4.2 Criar `tests/escopo-projetos-import-parser.test.ts` cobrindo linhas vazias, status, datas, repetição `(ano, versao)`, já cadastrado e linhas inválidas; verificar `npm run test`
- [x] 4.3 Implementar `importarEscopos` em `server/utils/escopo-projetos.ts` e `POST /api/escopo-projetos/importar` com revalidação, limite de 500 linhas, conflito `(ano, versao)` e transação all-or-nothing; verificar importação válida, conflito no arquivo, conflito na base e rollback sem gravação
- [x] 4.4 Criar `docs/modelos/modelo-importacao-escopo-projetos.xlsx` com o cabeçalho e uma aba de modelo; verificar a abertura do arquivo e a leitura pelo parser
- [x] 4.5 Criar `app/components/escopo-projetos/Importar.vue` reutilizando `UiUploadFiles`, `UiDataTable` e `UiModal`, com preview, seleção, contadores e commit; verificar o fluxo completo com planilha válida, inválida e duplicada
- [x] 4.6 Ligar o ícone Import da `Grade.vue` e a coordenação da página ao modal de importação; verificar que o ícone deixa de ser inerte e respeita `importar`
- [x] 4.7 Atualizar `docs/14` com o modelo, colunas, regras de duplicidade, limite, transação e permissão da importação; conferir os caminhos citados

## 5. Frontend integrado à API

- [x] 5.1 Refatorar `useEscopoProjetosModelo.ts` para carregar da API, com `carregando`, `carregado`, itens lazy (`itensCarregando`/`itensErro`), filtros/KPIs sobre a lista e ações assíncronas de criar/editar/publicar/arquivar/excluir/importar; verificar `npm run typecheck` e a ausência de seed/dados mock
- [x] 5.2 Atualizar a página `app/pages/admin/escopo-projetos.vue` com `UiLoading` no primeiro carregamento, toast de erro e lista vazia real; verificar F5 com banco vazio e com dados persistidos
- [x] 5.3 Atualizar `Formulario.vue` para `POST/PUT` da API, mapear `400/409` para os campos, manter código somente leitura e exibir os softwares retornados pela API; verificar criação/edição e conflito `(ano, versao)`
- [x] 5.4 Atualizar `Itens.vue` para carregar `GET /:id/itens` sob demanda, com loading/erro/retry e estado vazio, mantendo o `UiDataTable` e o modal `xl`; verificar escopo com itens, sem itens e falha de API
- [x] 5.5 Atualizar `Cabecalho.vue` para validar `?exportar=1` antes de PDF/CSV e usar os nomes de softwares da API; verificar exportação com e sem permissão
- [x] 5.6 Atualizar `docs/14` para a tela persistida (loading, erros, itens lazy, sem seed) e remover as referências ao dataset mock; conferir que o documento não contradiz a spec

## 6. Fechamento, documentação e gates

- [x] 6.1 Atualizar `docs/14` com a migration 23, o contrato final da API, RBAC/auditoria e a lista de pendências (itens/Área Pública); conferir todos os caminhos citados
- [x] 6.2 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar os quatro gates verdes
- [x] 6.3 Executar E2E/API: banco vazio, criar, editar, publicar, arquivar, excluir (guarda), itens, PDF/CSV, importação válida/inválida/duplicada, 401/403 e F5; confirmar que não há seed e que os dados persistem
- [x] 6.4 Conferir regressão em `/design`, Parceiros, Release Week e Manuais (HTTP 200 e componentes compartilhados sem alteração) e rodar `openspec validate "escopo-projetos-backend-e-importacao"`
