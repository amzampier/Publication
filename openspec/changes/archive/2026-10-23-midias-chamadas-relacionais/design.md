# Design

## Context

Ver `proposal.md` para a motivação. Estado atual relevante:

- `entregas_itens.imagens` é JSON e é a única fonte de verdade; a API devolve `string[]` e as telas
  (Lançar as Chamadas, Detalhes, Esteira) consomem `imagens`.
- `anexos_midias` já existe em `01_create_tables.sql`, com FK `entrega_item_id`/`manual_id`
  `ON DELETE CASCADE`, `ordem_exibicao`, `destaque_capa`, `legenda_alt`, `tipo_mime`, `nome_arquivo`,
  `tamanho_bytes`, dimensões e timestamps. Nenhum `INSERT` é feito pelo módulo; o único uso é o
  `COUNT(*)` da guarda de exclusão de Manuais.
- O upload (`POST /api/uploads`) já grava em `uploads/chamadas/<ano>/<mes>/`, valida magic bytes e
  devolve `{ url }`; o formulário mantém data URLs no rascunho e envia no salvar.
- `removerImagensChamadas` verifica compartilhamento com `JSON_CONTAINS` em `entregas_itens.imagens`.
- `MAX_IMAGENS_CHAMADA = 20` no shared e a documentação fala em 20.

## Goals / Non-Goals

**Goals:**

- `anexos_midias` como fonte de verdade, com ordem/capa/metadados e leitura em lote.
- Backfill idempotente do JSON legado, mantendo a coluna como snapshot temporário.
- Compatibilidade total com as telas atuais via `imagens: string[]` derivado.
- Limpeza de arquivos baseada em referências indexadas em `anexos_midias`.
- Teto de 100 imagens, validado no cliente e no servidor.

**Non-Goals:**

- UI da Área Pública, legendas/capa editáveis e galeria rica.
- Miniaturas, compressão ou redimensionamento de imagens.
- Remoção da coluna `entregas_itens.imagens` (change futura).
- Alterar o endpoint de upload ou a pasta física.

## Decisions

### 1. `anexos_midias` é a fonte de verdade; o JSON vira snapshot legado

Criação/edição gravam as linhas relacionais na mesma transação da chamada. A leitura usa
`anexos_midias`; se um registro ainda não tiver linhas (pré-backfill), cai para o JSON. A coluna JSON
continua sendo escrita como snapshot de compatibilidade por um ciclo, mas não é lida como fonte
principal. Alternativa descartada: continuar lendo o JSON e usar a tabela só para a Área Pública —
manteria duas fontes divergentes e a limpeza caro.

### 2. Sintonia por URL, não delete/reinsert cego

`server/utils/midias.ts` expõe `sincronizarMidias(executor, itemId, urls)`:

1. normaliza/deduplica as URLs;
2. remove as linhas cujo `url_arquivo` não está mais na lista;
3. faz `INSERT ... ON DUPLICATE KEY UPDATE` por URL, atualizando `ordem_exibicao`,
   `destaque_capa`, `nome_arquivo` e `tipo_mime`.

`legenda_alt` não é sobrescrita no upsert, preservando o valor quando a UI de legenda existir. Sem
isso, um simples re-save perderia metadados. Alternativa descartada: `DELETE` + `INSERT` de todas as
linhas — perderia `legenda_alt` e IDs.

### 3. Metadados derivados no servidor

O cliente continua enviando `imagens: string[]` (URLs). O servidor deriva:

- `nome_arquivo`: último segmento da URL;
- `tipo_mime`: extensão `.png`/`.jpg`/`.jpeg`/`.webp`/`.gif`, com fallback `image/png`;
- `ordem_exibicao`: índice no array;
- `destaque_capa`: `1` para o índice 0;
- `legenda_alt`: `null` nesta change;
- `tamanho_bytes`, `largura_px`, `altura_px`: `null` (sem lib de imagem).

Isso evita mudar o contrato do upload e mantém o formulário atual. Alternativa descartada: retornar
metadados no upload — exigiria alterar o endpoint, o formulário e a spec de `uploads` sem ganho nesta
fase.

### 4. API devolve `midias` e `imagens` derivado

`ChamadaModelo` ganha `midias: ImagemChamada[]` e mantém `imagens: string[]`. `imagens` é
`midias.map(m => m.url)`; no fallback legado, vem do JSON. As telas atuais continuam funcionando sem
mudança; a futura Área Pública consome `midias`. Alternativa descartada: trocar `imagens` por objetos
agora — quebraria Detalhes/Esteira/PDF sem necessidade.

### 5. Backfill via `JSON_TABLE`, com deduplicação

Migration 30 usa `JSON_TABLE` para explodir o array e `GROUP BY e.id, jt.url` com `MIN(ord)` para
tolerar URLs repetidas em dados antigos. Insere com `NOT EXISTS` por `(entrega_item_id, url_arquivo)`
e só depois cria a `UNIQUE KEY uk_midias_item_url` e o índice `idx_midias_url`. A ordem do backfill
antes do índice evita falha por duplicatas legadas. MariaDB 11.8 suporta `JSON_TABLE` e a chave
composta cabe no limite InnoDB (64*4 + 500*4 = 2256 bytes).

### 6. Limpeza com consulta indexada

`removerImagensChamadas` recebe as URLs removidas (antes/depois no PUT; lista da chamada no DELETE) e
consulta:

```sql
SELECT id FROM anexos_midias
 WHERE entrega_item_id <> ? AND url_arquivo = ?
 LIMIT 1
```

O índice `idx_midias_url` atende a consulta. As linhas da própria chamada são removidas por
`ON DELETE CASCADE` (exclusão) ou por `sincronizarMidias` (edição), antes da limpeza física. A
remoção continua best-effort e restrita a `uploads/chamadas/`.

### 7. Compatibilidade e rollback

O JSON snapshot permite voltar ao código anterior sem perder URLs. A migration 30 é aditiva e
idempotente; o rollback manual remove os índices e as linhas backfilled, opcionalmente restaurando o
JSON (que nunca foi apagado). A remoção da coluna fica para uma change posterior, após a Área Pública
consumir `midias`.

### 8. Limite de 100

O teto passa a ser 100 no shared (`MAX_IMAGENS_CHAMADA`), no texto de validação e na documentação. O
limite é aplicado no cliente (validação já existente) e no servidor (`validarChamada`). O upload por
arquivo continua limitado a 5 MB; não há limite agregado além da contagem.

## Risks / Trade-offs

- **Dual-write JSON + relacional** → a fonte de verdade é relacional; o JSON é snapshot e será
  removido em change futura. Testar que ambos não divergem enquanto coexistirem.
- **`JSON_TABLE` e chave composta** → validar a migration 30 em MariaDB 11.8 antes do deploy; usar
  `GROUP BY` para duplicatas e criar a unique key após o backfill.
- **Legenda/capa sem UI** → `legenda_alt` fica nula e `destaque_capa` é a primeira imagem; a UI
  futura poderá editar sem perder dados graças ao upsert.
- **100 imagens por chamada** → a galeria atual não tem thumbnails; a Área Pública deverá usar
  `loading="lazy"` e, idealmente, miniaturas numa change futura.
- **Arquivos órfãos** → o upload antes do save pode deixar arquivos sem linha; comportamento já
  existente e fora de escopo.
- **Fallback JSON** → registros não backfilled continuam legíveis; a ausência de `midias` nesses
  casos é esperada até a migration rodar.

## Migration Plan

1. Deploy da migration 30 junto do código.
2. Backfill roda no boot; verificar contagem de linhas em `anexos_midias` e ausência de URLs
   duplicadas por chamada.
3. Validar criação/edição/exclusão e a limpeza de arquivos em banco local.
4. Rollback: remover índices `uk_midias_item_url`/`idx_midias_url`, apagar as linhas backfilled se
   necessário (o JSON permanece) e registrar a reversão manual no rodapé da migration.

## Open Questions

Nenhuma pendente. O limite de 100, a manutenção do JSON como snapshot e a UI de legenda/capa fora do
escopo foram confirmados antes da proposta.
