# Proposal

## Why

A tela de Lançar as Chamadas já existe, mas opera com dataset em memória: nada é persistido, a
importação XLSX não existe, as imagens ficam como data URL e o schema ainda não reflete o contrato
da tela (`manual_titulo`, status `Recusado` e unicidade de `chamada`). Sem backend real, o CRUD de
`entregas_itens` continua sem dono e os demais módulos dependem de dados fictícios.

## What Changes

- **Backend real de `entregas_itens`** em `/api/lancar-chamadas`: listar, opções, criar, editar,
  aprovar, recusar, excluir e importar. Persistência em MariaDB, RBAC e auditoria em todas as rotas.
- **Migração 24**: `status` passa a aceitar `Recusado`, nova coluna `manual_titulo` e índice único
  `uk_entregas_chamada` em `chamada` (com pré-checagem de duplicatas).
- **Importação `.xlsx`** de chamadas, com modelo versionado, parser puro, preview
  (`pronto` / `já cadastrado` / `repetido` / `inválido`), revalidação no servidor e commit
  transacional all-or-nothing (limite de 500 linhas).
- **Permissão `importar`** adicionada ao módulo `lancar-chamadas` no catálogo RBAC, com migração da
  matriz existente para Administrador e Editor e atualização do total do catálogo de 90 para 91.
- **Upload de imagens** para `uploads/chamadas/<ano>/<mes>/`, usando o ano/mês de `data_lancamento`,
  persistindo os URLs em `entregas_itens.imagens` (JSON). O upload acontece no **salvar** da chamada.
- **Exclusão/edição com limpeza de imagens**: ao excluir uma chamada salva, os arquivos vinculados
  são removidos; na edição, imagens retiradas do array também são removidas. A limpeza é
  best-effort, restrita a `uploads/chamadas/`, e preserva arquivos compartilhados por outra chamada.
- **Frontend integrado à API**: lista e catálogos reais, loading/erro no F5, escrita via API,
  importação com modal de preview, upload no salvar e guarda `download` nos relatórios.
- **Documentação e specs**: `docs/15`, `docs/07`, `docs/02`, `docs/05` e `docs/bd/01-02` atualizados;
  specs de `lancar-chamadas`, `uploads`, `perfis-acesso` e `autorizacao-rbac` sincronizadas.

## Capabilities

### New Capabilities

<!-- Nenhuma capability nova: o módulo e o componente de upload já existem. -->

### Modified Capabilities

- `lancar-chamadas`: persistência real, API, importação XLSX, upload de imagens no salvar, exclusão
  com limpeza de arquivos, `manual_titulo`, status `Recusado` e unicidade de `chamada`.
- `uploads`: novo destino `chamadas` com subpastas `<ano>/<mes>`, URL pública correspondente,
  validação de ano/mês e permissão do módulo.
- `perfis-acesso`: catálogo de `lancar-chamadas` ganha `importar`; total do catálogo passa de 90
  para 91 e as contagens normativas dos perfis são atualizadas.
- `autorizacao-rbac`: catálogo de rotas administrativas passa a incluir as rotas de
  `lancar-chamadas` e a ação `importar`.

## Impact

- **Código novo:** `server/utils/lancar-chamadas.ts`; `server/api/lancar-chamadas/**`;
  `app/components/lancar-chamadas/Importar.vue`;
  `app/components/lancar-chamadas/lerPlanilhaLancarChamadas.ts`;
  `docs/modelos/modelo-importacao-lancar-chamadas.xlsx`;
  `server/migration/24_lancar-chamadas_backend.sql`.
- **Código alterado:** `shared/lancar-chamadas.ts` (contrato de API/importação, se necessário);
  `useLancarChamadasModelo.ts`; `Midias.vue`; `Tabela.vue`; `Cabecalho.vue`; `Formulario.vue`;
  `server/utils/uploads.ts`; `server/api/uploads/index.post.ts`;
  `app/config/perfis.ts`; `server/utils/perfis.ts`; `tests/perfis-funcionalidades.test.ts`.
- **Documentação:** `docs/15`, `docs/07`, `docs/02`, `docs/05`, `docs/bd/01` e `docs/bd/02`.
- **Fora de escopo:** anexos em `anexos_midias`, Área Pública, ação Arquivar, importação de imagens
  pela planilha, filtros/paginação server-side da listagem, exclusão de arquivos órfãos de uploads
  cancelados e alteração do layout do módulo.
