# Design

## Context

Ver `proposal.md — Why`. Estado atual que condiciona a solução:

- `entregas_itens.software_id VARCHAR(20) NULL` (FK `softwares.codigo`, `ON DELETE RESTRICT`) e
  `software VARCHAR(100) NOT NULL` (snapshot do nome) modelam **um** software por chamada.
- `server/utils/lancar-chamadas.ts` resolve um `softwareId`, grava os dois campos e monta
  `ChamadaModelo.softwareId`/`software`; a busca e o filtro usam esses campos.
- `escopo-projetos.ts` deriva os softwares contemplados de `entregas_itens.software_id`.
- O formulário usa `UiSelect` (single); o catálogo tem 44 softwares.
- A change `lancar-chamadas-texto-rico-e-solucao` está completa mas **não arquivada**; por isso este
  delta evita MODIFIED nos requisitos que ela também toca (formulário, validação, listagem,
  persistência, detalhes) e concentra a mudança de software em requisitos próprios (ADDED) mais os
  requisitos que ela não altera (filtros, catálogos, importação).

## Goals / Non-Goals

**Goals:**
- Uma chamada vincula N softwares, com no mínimo um, sem quebrar listas, filtros, relatórios e o
  Escopo de Projetos.
- Escolha múltipla com busca e chips (`UiMultiSelect`) reutilizável.
- Importação aceita vários códigos por linha.

**Non-Goals:**
- Área Pública; alterar o catálogo `softwares`; tornar parceiro/release/projeto múltiplos.

## Decisions

### D1 — Tabela de junção (opção A)
Nova tabela `entregas_itens_softwares`:
```
entrega_item_id VARCHAR(64) NOT NULL   FK -> entregas_itens(id) ON DELETE CASCADE
software_codigo VARCHAR(20) NOT NULL   FK -> softwares(codigo)  ON DELETE RESTRICT
software_nome   VARCHAR(200) NOT NULL  -- snapshot
ordem           TINYINT UNSIGNED NOT NULL DEFAULT 0
PRIMARY KEY (entrega_item_id, software_codigo)
KEY idx_entrega_softwares_codigo (software_codigo)
```
*Alternativa descartada:* coluna JSON `softwares` — mais simples, mas sem integridade referencial por
software e com filtro por `JSON_CONTAINS`; a junção é o modelo correto e alinhado à disciplina de FK.

### D2 — Software principal preservado
`entregas_itens.software_id`/`software` continuam sendo gravados com o **primeiro** software da
seleção. Isso mantém intactos leituras, índices e a derivação legada; a junção passa a ser a fonte
completa. Toda escrita grava os dois em uma única transação.

### D3 — Leitura como lista com fallback
`ChamadaModelo` passa a expor `softwareIds: string[]` e `softwares: string[]` (nomes, na ordem
`ordem`). `montarChamada` lê a junção; se não houver linhas (registro legado/importado), devolve uma
lista de um item a partir de `software_id`/`software`. A listagem continua exibindo os nomes
concatenados e os detalhes, um por linha/chip.

### D4 — Filtro por interseção
`FiltrosChamada.softwareIds: string[]`; a chamada corresponde quando possui **ao menos um** dos
softwares selecionados (subquery `EXISTS` na junção ou filtro cliente sobre `softwareIds`).

### D5 — `UiMultiSelect`
Novo componente `app/components/ui/MultiSelect.vue` (auto-import `UiMultiSelect`), com o mesmo DNA
visual dos controles de formulário, busca accent-insensitive, chips removíveis, teclado e papéis
`combobox`/`listbox`/`option`. Sem estilos paralelos; seção nova no `/design` e §5.x no `docs/01`.

### D6 — Importação com `;`
A coluna **Software** do modelo aceita um ou mais códigos separados por `;` (mesmo padrão das tags).
O parser resolve cada código; qualquer código inexistente invalida a linha no preview.

### D7 — Escopo de Projetos
`carregarSoftwares` passa a derivar de `entregas_itens_softwares` (todos os softwares de todas as
chamadas do escopo), com `DISTINCT` por nome. A leitura legada (`software_id`) permanece como fallback
enquanto houver registros sem junção.

## Risks / Trade-offs

- **Duas fontes (junção × `software_id`) podem divergir** → toda escrita atualiza as duas na mesma
  transação; `software_id` é sempre o primeiro item da junção.
- **Custo do filtro/busca por junção** → `EXISTS` com índice em `software_codigo`; o conjunto do
  módulo é pequeno e a paginação é no cliente.
- **Registros legados sem junção** → fallback de lista de um item cobre a leitura; a migration faz
  backfill dos existentes.
- **Conflito de spec com a change de texto rico (não arquivada)** → este delta não altera os
  requisitos que ela toca; arquivar `lancar-chamadas-texto-rico-e-solucao` antes desta mantém o texto
  final coerente.

## Migration Plan

1. Criar `entregas_itens_softwares` (migration nova, aditiva e idempotente, sem `USE`, com bloco de
   rollback comentado).
2. Backfill idempotente: `INSERT ... SELECT` de `entregas_itens` com `software_id IS NOT NULL`,
   usando `NOT EXISTS` para não duplicar.
3. Deploy do backend gravando junção + principal; dados antigos seguem legíveis.
4. Rollback: `DROP TABLE entregas_itens_softwares` (comentado) — os campos `software_id`/`software`
   permanecem intactos, então nenhum vínculo é perdido.
