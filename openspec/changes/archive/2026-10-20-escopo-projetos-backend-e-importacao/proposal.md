# Proposal

## Why

O módulo **Escopo de Projetos** existe apenas como frontend com um dataset de demonstração em
memória. Não há API, persistência, auditoria nem carga inicial: ao recarregar a tela os dados
voltam ao seed e o ícone de importação é inerte. O schema `projetos_escopo` já está pronto, mas o
módulo precisa nascer vazio e receber os escopos reais por cadastro ou por uma planilha histórica
`.xlsx`.

## What Changes

- **Backend completo** em `/api/escopo-projetos/**`: listar, criar, editar, publicar, arquivar,
  excluir, listar itens e importar, com `requirePermission` e auditoria no recurso
  **"Escopo de Projetos"**.
- **Persistência real**: a tela deixa de usar o seed em memória e passa a ler/gravar no banco.
  O módulo nasce **sem nenhum lançamento** (nenhum `INSERT` de demonstração em migration).
- **Migration 23**: coluna `arquivada` e índice, além do índice único `(ano, versao)` para a
  identidade do escopo; sem seed.
- **Código gerado no servidor** no padrão `PE-<ano>.<sequencial>`, imutável na edição. A duplicidade
  é detectada por `(ano, versao)` e responde `409`.
- **Importação XLSX somente de escopos**: Nome, Versão, Ano, Data de Início, Data Final, Data de
  Previsão, Data de Publicação, Status e Descrição Geral. Preview no cliente e commit transacional
  no servidor; qualquer linha inválida/conflitante cancela a importação inteira.
- **Softwares contemplados derivados das chamadas**: o backend lê os itens de `entregas_itens` e
  devolve os nomes distintos; o JSON `softwares_contemplados` deixa de ser fonte de verdade e é
  gravado como `[]`. Sem itens, a lista fica vazia até "Lançar as Chamadas".
- **Itens somente leitura** via `GET /api/escopo-projetos/:id/itens`, reutilizando o modal
  `UiDataTable` já existente.
- **Frontend integrado à API**: loading, erro, lista vazia, ações assíncronas, itens sob demanda,
  formulário com tratamento de `400/409`, importação funcional e exportações com guarda
  `?exportar=1`.
- **Documentação e testes** atualizados para a fase backend, incluindo o modelo
  `docs/modelos/modelo-importacao-escopo-projetos.xlsx`.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova: o backend e a importação completam o comportamento de escopo-projetos. -->

### Modified Capabilities

- `escopo-projetos`: persistência real, API/RBAC/auditoria, arquivamento no banco, itens via
  `entregas_itens`, softwares derivados e importação XLSX funcional de escopos; substitui o dataset
  em memória e a importação como affordance.

## Impact

- **Código novo:** `shared/utils/escopo-projetos.ts`, `server/utils/escopo-projetos.ts`,
  `server/api/escopo-projetos/**`, `app/components/escopo-projetos/Importar.vue`,
  `app/components/escopo-projetos/lerPlanilhaEscopoProjetos.ts`,
  `tests/escopo-projetos-import-parser.test.ts`.
- **Código alterado:** `app/components/escopo-projetos/useEscopoProjetosModelo.ts`,
  `validadores.ts`, `Formulario.vue`, `Itens.vue`, `Grade.vue`, `Cabecalho.vue`,
  `app/pages/admin/escopo-projetos.vue`, `tests/escopo-projetos-validadores.test.ts`.
- **Banco:** `server/migration/23_add_escopo_arquivada_e_ano_versao.sql` (coluna, índices; sem
  seed).
- **Docs/specs:** `docs/14`, `docs/02`, `docs/05`, `docs/modelos/modelo-importacao-escopo-projetos.xlsx`
  e a spec `escopo-projetos`.
- **Fora de escopo:** CRUD/importação de itens de `entregas_itens` (pertence a "Lançar as
  Chamadas"), Área Pública, alterações visuais no kit e novas funcionalidades de RBAC.
