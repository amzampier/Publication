# Design

## Context

O board usa `listarChamadasParaEsteira`, cuja query seleciona `COLUNAS_LISTA`. Essa lista inclui os campos do card, mas não `entregas_itens.descricao_completa`; `montarChamada` devolve `descricaoCompleta` vazio. O `ChamadaCard` já está correto e exibe o fallback quando o campo chega vazio.

## Goals / Non-Goals

**Goals:**

- Enviar o texto puro da descrição no board.
- Preservar a projeção enxuta dos demais consumidores.
- Cobrir card e busca.

**Non-Goals:**

- Enviar `descricao_html` no board.
- Alterar o card, o layout ou a busca server-side.
- Alterar schema/migrations.
- Incluir a descrição nos payloads da listagem principal/PDF.

## Decisions

### 1. Projeção exclusiva do board

Definir em `server/utils/lancar-chamadas.ts`:

```ts
const COLUNAS_ESTEIRA = `${COLUNAS_LISTA}, e.descricao_completa`
```

Usar somente em `listarChamadasParaEsteira`. `COLUNAS_LISTA` permanece inalterada para `listarChamadasPaginadas` e `listarChamadasFiltradas`.

Rationale: o card e a busca do board precisam do texto; as outras rotas não, e não devem pagar o payload extra.

### 2. Texto puro

`descricao_completa` é o texto puro já sanitizado no save; `descricao_html` continua fora do board. O `line-clamp-3` do card limita a exibição visual.

### 3. Fallback preservado

`ChamadaCard.vue` continua usando `descricaoCompleta || 'Sem descrição.'`. O fallback agora só aparece para chamadas realmente sem descrição.

## Risks / Trade-offs

- **Payload do board aumenta** com o texto puro → o board é paginado (200 itens) e não inclui HTML; medir o payload com 200 itens.
- **Texto longo** → `line-clamp-3` limita a UI; o detalhe continua com o conteúdo completo.
- **Busca** → passa a funcionar para termos na descrição; solução continua fora do board, como antes.

## Migration Plan

Sem migration. Deploy/rollback por reversão do arquivo.

## Open Questions

Nenhuma.
