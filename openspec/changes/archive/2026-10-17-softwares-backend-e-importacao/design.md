# Design

## Context

Ver `proposal.md` — Why. O frontend de Softwares já existe (`openspec/specs/softwares`) e chama
`GET/POST/PUT/DELETE /api/softwares`, mas as rotas não existem. A tabela `softwares`
(`server/migration/01_create_tables.sql:129`) tem `id VARCHAR(64)` como PK (sem `DEFAULT`), e o único
FK que a referencia é `entregas_itens.software_id` (`01_create_tables.sql:438`). Nenhuma das duas
tabelas tem dados (o seed não insere entregas). Os moldes são `server/utils/perfis.ts` (CRUD, 400/404/
409, `registrarAuditoria`) e `server/utils/usuarios.ts` (listagem/importação com revalidação e
transação), mais o par cliente `usuarios/lerPlanilhaUsuarios.ts` + `usuarios/Importar.vue`. O módulo
`softwares` já existe na matriz RBAC e nos seeds de permissão.

## Goals / Non-Goals

**Goals:**

- Backend completo do catálogo (leitura, escrita, exclusão) com RBAC e auditoria.
- `codigo` sequencial (`SFT-001`) como identidade e PK do software.
- Importação por planilha (cliente + servidor) com revalidação e transação.
- Seed inicial e docs/specs alinhados; frontend migrado de `id` para `codigo`.

**Non-Goals:**

- Telas/serviços de Releases e Projetos que consomem softwares (apenas o FK é reapontado).
- Exportação/paginação server-side do catálogo (busca/ordenação/paginação seguem no cliente).
- Alterações na trilha de auditoria além do novo recurso "Softwares".

## Decisions

### D1 — `codigo` como chave primária; FK reapontado

`softwares.id` vira `codigo VARCHAR(20)` (PK) e `entregas_itens.software_id` passa a referenciar
`softwares(codigo)`. Migration `14_softwares_codigo_pk.sql`: dropa o FK, troca a PK e recria o FK. É
segura porque ambas as tabelas estão vazias; não usa `DROP TABLE/VIEW/DATABASE` (respeita
"Migrations não destrutivas") e roda uma única vez (tolerância idempotente do runner).

- *Alternativa:* manter PK surrogate (`id` UUID) + `codigo` UNIQUE — rejeitada porque releases e
  projetos passariam a referenciar o UUID, não o código visível.

### D2 — Geração `MAX + retry`

O próximo código é `SFT-%03d`, calculado do maior sufixo numérico existente; a PK única barra a
corrida e a gravação é repetida uma vez. Sem tabela contadora nem `AUTO_INCREMENT` (a PK é string).

- *Trade-off:* sob concorrência muito alta pode falhar após o retry — aceitável para cadastro/import.

### D3 — `GET /api/softwares` devolve array

A listagem devolve o **array completo ordenado por `codigo`** (o frontend já faz busca/ordenação/
paginação no cliente). Sem paginação server-side nesta fase.

### D4 — Estrutura do backend

`server/utils/softwares.ts` (validadores, `proximoCodigo`, listar/criar/atualizar/excluir/importar) e
`server/api/softwares/{index.get,index.post,[codigo]/index.put,[codigo]/index.delete,importar/index.post}.ts`.
Cada rota chama `requirePermission(event, 'softwares', <acao>)`; as escritas chamam `registrarAuditoria`
(recurso "Softwares"). Mesmo shape de saída do frontend
(`{ codigo, descricao, categoria, situacao, criado_em, atualizado_em }`).

### D5 — Importação (cliente + servidor)

- **Cliente:** `lerPlanilhaSoftwares.ts` (colunas Descrição/Categoria/Situação; normaliza acentos/
  caixa; classifica `pronto` / `ja-cadastrado` / `repetido` / `invalido`) e `Importar.vue`
  (`UiModal` com `UiUploadFiles`, prévia em `UiDataTable` com badge de Situação, seleção das linhas
  prontas e `POST /api/softwares/importar`). Molde de `usuarios/Importar.vue`.
- **Servidor:** revalida contra o banco, recusa tudo com `400` + `motivos` quando há linha inválida,
  trata descrições já cadastradas como conflito (case-insensitive) e grava em **transação**, gerando
  os códigos. Limite de linhas por importação (500) como em usuários.
- A base para a pré-classificação vem do `GET /api/softwares` já carregado (catálogo é array
  completo) — sem endpoint extra, diferente de usuários (que precisava de `/emails` por ser paginado).

### D6 — Frontend `id` → `codigo`

`useSoftwaresModelo.ts`, `Tabela.vue` (coluna "Código" à esquerda), `Formulario.vue` (Código
read-only na edição; na criação não aparece), `Exclusao.vue` (mostra código + descrição),
`Cabecalho.vue`/`gerarPdfSoftwares.ts` (Código no CSV/PDF). `salvarSoftware`/`excluirSoftware` passam
a usar `codigo` (o `POST` não envia código; o servidor gera).

### D7 — Seed e documentação

Migration `15_seed_softwares.sql` com ~6 softwares (`SFT-001`…) e espelho em `docs/bd/02_seed.sql`;
`docs/bd/01` reflete a PK `codigo` e o FK. `docs/10`, `docs/02` §3.7 e `docs/05` atualizados.

## Risks / Trade-offs

- **Corrida na geração do código** → PK única + 1 retry; registrar em teste unitário do cálculo.
- **Migration com `DROP PRIMARY KEY/FOREIGN KEY`** → tabelas vazias e sem dados; sem `DROP TABLE`;
  rodar contra uma base provisionada e conferir o FK recriado.
- **Dedup por descrição case-insensitive** (sem `UNIQUE`) → o cadastro manual pode repetir descrição;
  a importação já avisa. Aceito nesta fase.
- **Importação > 500 linhas** → recusada com `400`, como em usuários.

## Migration Plan

1. `14_softwares_codigo_pk.sql` (FK → PK `codigo` → FK).
2. `15_seed_softwares.sql` (catálogo inicial).
3. Backend (`server/utils/softwares.ts` + rotas).
4. Frontend (rename `codigo`, modal de importação) e docs.
5. Gates `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`; conferência em
   `http://localhost:3000/admin/softwares` (listar, incluir/editar/excluir, importar).

Rollback: reverter a migration 14 (FK → `id` → FK) e remover a 15; as rotas e o frontend são
arquivos novos/ajustados.

## Open Questions

- Nenhuma que mude o escopo; a lista exata do seed pode ser ajustada na implementação.
