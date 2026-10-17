# Tasks

## 1. Schema e seed

- [x] 1.1 Criar `server/migration/14_softwares_codigo_pk.sql` (drop FK `fk_entregas_soft_id`, `softwares.id` → `codigo VARCHAR(20)` PK, recria o FK para `softwares(codigo)`) com rollback comentado; verificar no boot que o schema aplica e que o FK referencia `softwares(codigo)`
- [x] 1.2 Criar `server/migration/15_seed_softwares.sql` com o catálogo inicial (`SFT-001`…) e atualizar `docs/bd/01 - banco_dados_mariadb.sql` (PK `codigo` + FK) e `docs/bd/02_seed.sql`; verificar que o provisionamento insere os softwares sem duplicar no boot repetido
- [x] 1.3 Extrair o cálculo/parse do próximo código para uma função pura e cobrir `SFT-001`, incremento e limite de dígitos em `tests/`; verificar com `npm run test`

## 2. Backend do catálogo

- [x] 2.1 Criar `server/utils/softwares.ts` (shape `SoftwareApi` com `codigo`, validadores de descrição ≤ 200 / categoria / situação, `proximoCodigo` com `MAX + retry`, `listar`/`buscar`/`criar`/`atualizar`/`excluir`, 400/404); verificar com `npm run typecheck`
- [x] 2.2 Criar as rotas `server/api/softwares/index.get.ts`, `index.post.ts`, `[codigo]/index.put.ts` e `[codigo]/index.delete.ts` com `requirePermission(event, 'softwares', …)` e `registrarAuditoria` (recurso "Softwares"); verificar 401 sem sessão, 403 sem permissão, 400 inválido, 404 inexistente e o registro na trilha
- [x] 2.3 Adicionar os testes unitários dos validadores (descrição vazia/limite, categoria/situação fora do domínio) em `tests/`; verificar com `npm run test`
- [x] 2.4 Atualizar `docs/05 - Gestão de Auditoria.md` (linhas Softwares na tabela rota → ação → recurso) e `docs/02` §3.7 (endpoints do módulo); verificar que as rotas documentadas batem com as implementadas

## 3. Importação (servidor)

- [x] 3.1 Implementar `importarSoftwares` em `server/utils/softwares.ts` (revalidação contra o banco, dedup por descrição case-insensitive, `400` com `motivos`/`conflitos`, gravação em transação com códigos sequenciais, limite de 500 linhas) e a rota `server/api/softwares/importar/index.post.ts` (`softwares`/`importar` + auditoria); verificar que linha inválida recusa tudo e que descrição repetida retorna conflito sem gravar
- [x] 3.2 Adicionar teste unitário da revalidação/classificação de linhas (inválida, repetida, já cadastrada, pronta) em `tests/`; verificar com `npm run test`

## 4. Frontend (código + importação)

- [x] 4.1 Migrar `id` → `codigo` em `useSoftwaresModelo.ts`, `Tabela.vue` (coluna "Código" à esquerda), `Formulario.vue` (Código read-only na edição), `Exclusao.vue`, `Cabecalho.vue` e `gerarPdfSoftwares.ts` (Código no CSV/PDF); verificar com `npm run typecheck` e que a tabela/relatórios mostram o código
- [x] 4.2 Criar `app/components/softwares/lerPlanilhaSoftwares.ts` (colunas Descrição/Categoria/Situação; classifica pronto/já cadastrado/repetido/inválido) e `Importar.vue` (upload, prévia, seleção, POST) e trocar o toast-placeholder da página pelo modal; verificar com `npm run typecheck`, `npm run lint` e o fluxo de importar
- [x] 4.3 Atualizar `docs/10 - Módulo dos Softwares.md` (código como identidade, backend, importação, contrato `GET`/escritas/`importar`); verificar que cada seção bate com a implementação e com a spec `softwares`
- [x] 4.4 Conferir em `http://localhost:3000/admin/softwares` listar, incluir, editar, excluir e importar (planilha modelo `docs/modelos/modelo-importacao-softwares.xlsx`) sem erro de runtime

## 5. Verificação integrada

- [x] 5.1 Rodar os gates `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar que passam
- [x] 5.2 Conferir de ponta a ponta: `GET /api/softwares` ordenado por código, códigos únicos gerados na criação/importação, FK de `entregas_itens` apontando para `softwares(codigo)` e a trilha de auditoria registrando "Softwares"
