# Proposal

## Why

Hoje as imagens da chamada são apenas URLs em um array JSON (`entregas_itens.imagens`), enquanto a
tabela relacional `anexos_midias` já existe com FK, ordem, capa, legenda e metadados de mídia, mas
nunca foi usada pelo módulo. A Área Pública futura precisa consumir imagens com metadados e a
limpeza atual depende de `JSON_CONTAINS` sem índice. Migrar a fonte de verdade para `anexos_midias`
agora evita retrabalho e prepara a galeria pública.

## What Changes

- `anexos_midias` passa a ser a fonte de verdade das imagens da chamada (uma linha por imagem, com
  `ordem_exibicao`, `destaque_capa`, `legenda_alt`, `tipo_mime` e `nome_arquivo`).
- Migration 30 faz backfill idempotente de `entregas_itens.imagens` para `anexos_midias` e adiciona
  unicidade `(entrega_item_id, url_arquivo)` e índice por URL.
- Criação/edição gravam as mídias na mesma transação da chamada; a leitura em lote devolve `midias`
  com metadados e mantém `imagens` como lista derivada de URLs para compatibilidade.
- A coluna JSON `entregas_itens.imagens` permanece como snapshot legado nesta change (será removida
  em uma change futura). A API não depende dela para ler.
- A limpeza de arquivos no editar/excluir passa a consultar referências em `anexos_midias` por URL
  indexada, em vez de varrer JSON.
- O teto de imagens por chamada sobe de 20 para 100, validado no cliente e no servidor.
- O upload continua igual (`POST /api/uploads`, pasta `chamadas/<ano>/<mes>`); o formulário segue
  enviando as imagens no salvar.

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities

- `lancar-chamadas`: persistência relacional das imagens, backfill, leitura com metadados, limite de
  100 e limpeza baseada em `anexos_midias`.

## Impact

- **Banco:** migration 30 com backfill e índices em `anexos_midias`.
- **Shared:** `shared/lancar-chamadas.ts` ganha o tipo de mídia e o novo limite; `imagens` permanece
  como lista derivada.
- **Server:** novo `server/utils/midias.ts`; `server/utils/lancar-chamadas.ts` grava/lê mídias e
  troca a checagem de compartilhamento; APIs de listar/criar/editar/excluir mantêm o contrato atual
  e passam a devolver `midias`.
- **App:** `Midias.vue`, `Detalhes.vue`, `EsteiraDetalhe.vue` e cards seguem usando `imagens`; o
  limite e as mensagens são atualizados. A UI de legenda/capa fica para a Área Pública.
- **Docs/specs:** `docs/15`, `docs/16` e `docs/bd/01`; delta em `lancar-chamadas`.
- **Fora de escopo:** UI da Área Pública, geração de miniaturas/redimensionamento, remoção da coluna
  JSON e edição de legenda/capa pelo usuário.
