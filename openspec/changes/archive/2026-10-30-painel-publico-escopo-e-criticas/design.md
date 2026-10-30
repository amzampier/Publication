# Design

## Context

Ver `proposal.md` — Why. Hoje `GET /api/publico/painel` monta `PublicoPainel` com
`releaseDestaque`, `manuaisDestaque`, `maisVistas`, `modoMaisVistas` e `filtros`
(`server/utils/publico.ts`, `listarPainelPublico`). O painel é servido por uma única leitura SSR em
`usePublicoPainel` e renderizado por `app/pages/index.vue`.

O Escopo público já tem resumo, gate e componentes: `PublicoEscopoResumo` expõe `id`, `codigo`,
`nome`, `versao`, `ano`, `chamadas`, `sistemas` e `publicadoEm`; `listarEscopos` ordena por ano/nome
(não por publicação), `listarSistemasPorEscopo` agrega sistemas e `carregarSoftwaresPorItem` resolve
o vínculo N:N das chamadas. O impacto `Crítico` já é usado pelo card público e pela variante
`critico` do `UiBadge`.

O painel não conhece escopos: não há seção, tipo nem consulta de chamadas críticas. A página pública
do escopo (`/escopos/[id]`) já existe e é o destino natural do CTA.

## Goals / Non-Goals

**Goals:**

- Acrescentar a seção “Escopo de Projeto” ao painel, com o último escopo publicado e suas chamadas
  críticas, sem novo endpoint nem roundtrip extra no cliente.
- Manter o gate público e o cache existentes.
- Reutilizar os tipos/componentes do Escopo e a variante `critico` do `UiBadge`.
- Manter a seção fora do DOM quando não há escopo, e o card de críticas fora quando não há críticas.

**Non-Goals:**

- Listar todos os escopos no painel ou criar um ranking/histórico de escopos.
- Exibir chamadas críticas de releases/manuais fora do escopo em destaque.
- Alterar o schema, criar índices ou migration.
- Mudar a página `/escopos/[id]`, o shell público ou a Área Administrativa.

## Decisions

### D1. Reutilizar `GET /api/publico/painel` em vez de criar endpoint

O painel continua com uma leitura SSR só. `PublicoPainel` ganha `escopoDestaque` e
`chamadasCriticas`; a rota e o `Cache-Control` existentes são mantidos. A alternativa (novo
`/api/publico/painel/escopo`) exigiria outro `useAsyncData`, outra chave de cache e um segundo estado
de carregamento/erro, sem ganho de payload — o escopo em destaque e no máximo três críticas são
pequenos.

### D2. “Último liberado” é `publicado_em`, não `data_publicacao`

A consulta ordena por `p.publicado_em DESC, p.ano DESC, p.versao DESC` e aplica o gate
`gatePai('p')` (`status = 'Publicado'`, `arquivada = 0`, `publicado_em <= NOW(6)`). `data_publicacao`
é editorial e não representa a liberação efetiva; o mesmo critério já vale para a página pública do
escopo. Para testes puros, um helper `selecionarEscopoDestaque(escopos)` replica a ordenação e isola
a regra do SQL.

### D3. Críticas vêm do escopo em destaque, no máximo três

A consulta usa `impacto = 'Crítico'`, `gateChamada('e')` e `e.projeto_id = ?`, ordenando por
`ordem_apresentacao ASC, chamada ASC` e limitando a 3. Os sistemas saem de
`carregarSoftwaresPorItem` (N:N, com fallback para o software principal), garantindo o mesmo
comportamento da página do escopo. A alternativa de um feed global de críticas foi descartada nesta
change: o pedido é contextual ao último projeto liberado e o feed global precisaria de outra regra de
ordenação e de outra seção.

### D4. Tipos e contrato

`shared/publico.ts`:

```ts
export interface PublicoChamadaCritica {
  id: string
  chamada: string
  titulo: string
  softwares: string[]
  parceiro: string
  tipo: TipoItem
  impacto: ImpactoItem
}

export interface PublicoPainel {
  // campos atuais...
  escopoDestaque: PublicoEscopoResumo | null
  chamadasCriticas: PublicoChamadaCritica[]
}
```

`PublicoEscopoResumo` já cobre o necessário (`codigo`, `nome`, `versao`, `ano`, `chamadas`,
`sistemas`, `publicadoEm`), então não há tipo novo para o escopo. `ListarPainelPublico` passa a
executar as duas consultas em paralelo com as atuais.

### D5. Seção e layout

Novo `app/components/publico/PainelEscopoDestaque.vue`:

- `<section aria-labelledby="painel-escopo-titulo">` com `h2` “Escopo de Projeto”.
- Grid `lg:grid-cols-3`: card do escopo em `lg:col-span-2` e card de críticas em 1 coluna; abaixo de
  `lg`, empilhados.
- Card do escopo: acento indigo-700 (`#4338ca`), código/versão, nome, “Publicado em”, contagens de
  chamadas/sistemas e chips dos sistemas; CTA `UiButton variant="primary"` ou link com tratamento
  primário para `/escopos/{id}`.
- Card de críticas: `h3` “Chamadas críticas”, `AlertTriangle`, lista com código, título, sistemas e
  parceiro, `UiBadge variant="critico"` com “Impacto: Crítico”; cada item é link para `/escopos/{id}`.
- `demo` para a vitrine, no mesmo padrão dos demais componentes públicos.

`app/pages/index.vue` insere a seção entre a linha de manuais/ranking e o histórico, com
`v-if="painel.escopoDestaque"`. O card de críticas só aparece quando `painel.chamadasCriticas.length`
for maior que zero.

### D6. Estados e cache

- Carregamento inicial continua coberto pelo bloco existente (`carregandoPainel && !temDadosPainel`);
  a nova seção entra no `template v-else`.
- Sem escopo: seção omitida (sem estado vazio visível).
- Com escopo e sem críticas: só o card do escopo.
- Erro do painel: o `UiErrorState` existente cobre a leitura; não há estado de erro próprio.
- O cache público de curta duração já aplicado a `/api/publico/painel` cobre os novos campos.

### D7. Acessibilidade e responsividade

`h2`/`h3` por seção, links com nome acessível (“Ver escopo completo de {nome}”, “Chamada {código}:
{título}”), badge com texto e ícone (não só cor) e foco canônico. Em 390 px os dois cards empilham e
os chips quebram linha; em 1440 px ficam lado a lado.

## Risks / Trade-offs

- **Duas consultas extras na leitura do painel** → ambas são limitadas (`LIMIT 1` e `LIMIT 3`) e a
  resposta é cacheada; se o `EXPLAIN` mostrar custo alto em `entregas_itens(projeto_id, impacto)`,
  avaliar índice em change futura, não nesta.
- **“Último liberado” depende de `publicado_em` preenchido** → o gate já exclui nulos/futuros; o
  helper de teste cobre o fallback de ordenação.
- **Escopo com muitas chamadas críticas** → o limite de três mantém o card compacto e a contagem
  total continua disponível na página do escopo.
- **Payload do painel cresce** → o acréscimo é de um resumo e até três itens, sem anexos nem HTML.

## Migration Plan

- Sem migration. Publicar código, docs e testes juntos; o contrato antigo continua válido para
  consumidores que ignoram os novos campos.
- Rollback: reverter o commit; os campos extras deixam de ser enviados e a seção não é renderizada.

## Open Questions

Nenhuma.
