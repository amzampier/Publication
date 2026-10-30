# 21 — Módulo Escopo de Projeto — Área Pública

**Versão:** 1.0.0 · **Data:** 2026-10-29 · **Idioma:** Português do Brasil (pt-BR)
**Status:** Implementado no change `escopo-projeto-area-publica` (planejamento e implementação no
mesmo ciclo).
**Escopo:** página pública do escopo em `/escopos/[id]`, cabeçalho do escopo, lista paginada de
chamadas por sistema, evidências em galeria, links externos, estados, responsividade,
acessibilidade e contrato da leitura anônima.
**Fora de escopo:** páginas públicas de release e manual, busca global, deep links de
release/manual, contador de visualizações, modal de detalhe da chamada, SEO avançado, RBAC público
e alterações no shell administrativo.
**Fonte visual:** imagens de referência da conversa (hero escuro com chips e contadores; card de
chamada com código, tipo, impacto, sistema, parceiro, descrição, solução, tags, evidências e
documentação externa).
**Autoridade de comportamento:** `openspec/changes/escopo-projeto-area-publica/specs/escopo-publico/spec.md`
e os deltas de `design-system/public-layout` e `design-system/brand-tokens`. Em caso de divergência,
a spec prevalece.
**Documentos relacionados:**
[`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md) ·
[`19 - API Pública de Navegação.md`](19%20-%20API%20P%C3%BAblica%20de%20Navega%C3%A7%C3%A3o.md) ·
[`20 - Painel de Destaque Area Publica.md`](20%20-%20Painel%20de%20Destaque%20Area%20Publica.md) ·
[`14 - Módulo do Escopo de Projetos.md`](14%20-%20M%C3%B3dulo%20do%20Escopo%20de%20Projetos.md) ·
[`01 - design_system.md`](01%20-%20design_system.md)

> Esta é a primeira página pública de conteúdo. Ela reutiliza o shell do doc 18, a paleta editorial
> do Escopo (indigo-700) e o degradê aprovado do hero do Painel de Destaques. A leitura é anônima,
> cacheável e limitada ao conteúdo efetivamente publicado.

---

## Sumário

1. [Papel e rota](#1-papel-e-rota)
2. [Navegação e seleção pela URL](#2-navegação-e-seleção-pela-url)
3. [Layout e grid](#3-layout-e-grid)
4. [Cabeçalho do escopo](#4-cabeçalho-do-escopo)
5. [Lista de chamadas](#5-lista-de-chamadas)
6. [Regras de seleção, contagens e gate](#6-regras-de-seleção-contagens-e-gate)
7. [Contrato de dados e API](#7-contrato-de-dados-e-api)
8. [Visual, tokens e tema](#8-visual-tokens-e-tema)
9. [Responsividade](#9-responsividade)
10. [Acessibilidade](#10-acessibilidade)
11. [Estados](#11-estados)
12. [Componentização](#12-componentização)
13. [Desempenho e índices](#13-desempenho-e-índices)
14. [Testes e verificação](#14-testes-e-verificação)
15. [Governança](#15-governança)
16. [Checklist](#16-checklist)

---

## 1. Papel e rota

A página transforma a seleção de um sistema na sidebar em uma leitura verificável das chamadas
publicadas. Ela responde à pergunta “o que foi desenvolvido para este sistema dentro deste escopo?”
com o cabeçalho do projeto, as contagens e os cards das chamadas.

```
HOJE
  /                         -> Painel de Destaques
  clique no sistema         -> apenas estado local na sidebar
  /escopos/**               -> inexistente

ALVO
  /                         -> Painel de Destaques
  clique no sistema         -> /escopos/{id}?sistema={nome}
  "Ver Tudo"                -> /escopos/{id}
  "Voltar aos Destaques"    -> /
```

- Rota: `app/pages/escopos/[id].vue`, herdando `app/layouts/default.vue` (shell público).
- Sem `sistema`, a página mostra todas as chamadas públicas do escopo.
- Com `sistema`, a página mostra apenas as chamadas associadas àquele software.
- A página é somente leitura, anônima e não expõe controles administrativos.
- O título visível é **“Escopo de Projetos: {nome}”**, com `h1` no cabeçalho.
- O Painel de Destaques (`/`) exibe o último escopo publicado e até três chamadas críticas desse
  escopo, com CTA para esta página (ver doc 20 §7).

## 2. Navegação e seleção pela URL

A URL é a fonte da verdade da seleção:

| Ação | Destino |
|---|---|
| Sistema na sidebar | `/escopos/{id}?sistema={nome}` |
| “Ver Tudo” no card do projeto | `/escopos/{id}` |
| “Ver todas as chamadas” (na página, com filtro) | `/escopos/{id}` |
| “Voltar aos Destaques” | `/` |
| Paginação | mesma rota com `pagina` (a partir de 2) |

Regras:

- A sidebar abre o projeto correspondente e marca o sistema ativo com `aria-current="true"`.
- Recarregar, compartilhar e usar voltar/avançar preservam a seleção.
- O clique em um sistema fecha o drawer no mobile e navega.
- O layout (`app/layouts/default.vue`) resolve o id da rota, localiza o escopo na navegação e passa
  a seleção para `PublicSidebar` pela prop `escopoInicial`.
- `PublicSidebar` sincroniza a prop com o estado interno; no demo do `/design`, a seleção continua
  local e não navega.

## 3. Layout e grid

```
+----------------------------------------------------------------------------------+
| [Versao 26.06a] [Ano 2026] [Sistema: Arquivos Digitais - SPED]  [<- Voltar]       |
| H1: Escopo de Projetos: Projeto 26.06a                                            |
| Consulte abaixo as chamadas e demandas contempladas na governanca do escopo...     |
|----------------------------------------------------------------------------------|
| [icon] 8 chamadas no projeto  [icon] 3 sistemas contemplados  [check] 3 neste sistema |
+----------------------------------------------------------------------------------+
| Chamadas contempladas                                  [Ver todas as chamadas]    |
| +------------------------------------------------------------------------------+ |
| | #0000456822 [Melhoria] [Arquivos Digitais - SPED]        Parceiro: MT8 ...    | |
| | Registro 1601 - SPED Fiscal                                                   | |
| | Documentacao funcional referente...                                           | |
| | [#registro 1601] [#sped]                                                      | |
| | EVIDENCIAS / TELAS (1): [thumb]                                               | |
| | [Documentacao Externa ->]                                   Liberada em ...    | |
| +------------------------------------------------------------------------------+ |
| [ UiPagination - 6 por pagina ]                                                   |
+----------------------------------------------------------------------------------+
```

- Container: `mx-auto max-w-[85rem] px-4 py-6 sm:px-6 lg:px-8`.
- Cabeçalho: largura total.
- Lista: uma coluna de cards em largura total.
- Paginação abaixo da lista, quando houver mais de seis chamadas.
- O total “Exibindo X de Y chamadas” é mantido apenas como região `sr-only` com `aria-live` para
  leitores de tela; não é exibido visualmente.
- O shell público ocupa `h-screen`: o header e a sidebar ficam fixos e apenas o `main` rola
  (`overflow-y-auto`). A sidebar permanece `w-72` no desktop e o conteúdo vive em `main` com
  `min-w-0`.

## 4. Cabeçalho do escopo

### 4.1 Anatomia

```
+----------------------------------------------------------------------------------+
| [Versao 26.06a] [Ano 2026] [Sistema: {nome}]                  [<- Voltar]         |
| H1: Escopo de Projetos: {nome do escopo}                                          |
| Consulte abaixo as chamadas e demandas contempladas na governanca do escopo.      |
| Visualizando especificamente as chamadas contempladas do sistema {nome}.          |
|----------------------------------------------------------------------------------|
| [FolderGit2] 8 chamadas no projeto   [Monitor] 3 sistemas contemplados            |
| [CheckCircle2] 3 chamadas neste sistema                                           |
+----------------------------------------------------------------------------------+
```

### 4.2 Regras

- Exibir a versão quando existir e o ano sempre.
- Exibir o chip **“Sistema: {nome}”** apenas quando houver sistema selecionado.
- O título é **“Escopo de Projetos: {nome}”**.
- A copy muda conforme a seleção:
  - com sistema: “Visualizando especificamente as chamadas contempladas do sistema {nome}.”;
  - sem sistema: “Visualizando todas as chamadas contempladas do projeto.”
- Contagens:
  - **chamadas no projeto**: todas as chamadas públicas do escopo;
  - **sistemas contemplados**: quantidade de sistemas com chamadas públicas;
  - **chamadas neste sistema**: apenas quando há sistema selecionado.
- Usar singular/plural: “1 chamada”, “4 chamadas”, “1 sistema”, “5 sistemas”.
- “Voltar aos Destaques” é um link para `/` com `ArrowLeft`.
- O hero usa o degradê aprovado do Painel:
  `bg-gradient-to-br from-brand-primary via-slate-950 to-indigo-950`.
- O indigo-700 do Escopo permanece nos chips, ícones e badges.

### 4.3 Dados

| Campo | Origem | Uso |
|---|---|---|
| `id` | `projetos_escopo.id` | Rota e seleção |
| `codigo` | `projetos_escopo.codigo` | Contrato (não exibido no hero) |
| `nome` | `projetos_escopo.nome` | Título |
| `versao` | `projetos_escopo.versao` | Chip de versão |
| `ano` | `projetos_escopo.ano` | Chip de ano |
| `chamadas` | contagem de itens públicos | "chamadas no projeto" |
| `sistemas[]` | agregação de softwares dos itens públicos | “sistemas contemplados” e filtro |
| `publicadoEm` | `projetos_escopo.publicado_em` | Contrato/ordenação |

## 5. Lista de chamadas

### 5.1 Card

```
+----------------------------------------------------------------------------------+
| [#0000456822] Parceiro: MT8 Solucoes [Melhoria] [Impacto: Medio] [SPED]           |
|                                              Publicado em: 29/10/2026            |
| +==============================================================================+ |
| | H3: Registro 1601 - SPED Fiscal  (degrade do header de modal, filete verde)  | |
| +==============================================================================+ |
| DESCRICAO                                                                         |
| Documentacao funcional referente a geracao do Registro 1601 do SPED Fiscal...     |
| SOLUCAO                                                                           |
| Em situacoes onde recebimentos sao realizados em dinheiro e posteriormente...     |
|                                              Tags: #registro 1601 #sped        |
| EVIDENCIAS / TELAS (1): [thumb 1] [thumb 2] ...                                  |
|----------------------------------------------------------------------------------|
| Manual: Manual de Registro 1601                                                  |
| [Documentacao Externa ->] [Ver video ->]                    Liberada em 26/10/2026 |
+----------------------------------------------------------------------------------+
```

### 5.2 Regras

- Cabeçalho do card, na ordem da esquerda para a direita: **código da chamada, parceiro, tipo,
  impacto e sistema(s)**. O parceiro integra o grupo da esquerda e aparece apenas com o nome, sem o
  rótulo “Parceiro:”.
- O tipo usa `UiBadge` com as variantes `correcao`, `melhoria` e `nova`, sempre com rótulo textual.
- O impacto usa `UiBadge variant="neutral"` com o rótulo **“Impacto: {valor}”** e ícone `Gauge`; o
  valor textual é obrigatório e a cor não é o único sinal.
- O impacto **Crítico** usa `UiBadge variant="critico"` (`rose-700` + `AlertTriangle`) e dá ao card
  uma moldura rose com **barra de 4px na borda esquerda**, acompanhando os cantos superior e
  inferior do card, mais anel/sombra discreta; os demais impactos permanecem neutros e sem moldura.
  O destaque não depende apenas de cor.
- Os sistemas usam os chips indigo-700 com todos os softwares da chamada, sem repetição.
- O bloco da direita exibe **“Publicado em: {publicadoEm}”**, alinhado à direita no desktop e
  empilhado no mobile. A publicação é o carimbo efetivo `publicado_em`, não `data_publicacao`.
- O título é apresentado em um container com o degradê do cabeçalho de modal
  (`from-brand-primary to-brand-structure`) e borda esquerda accent (`border-l-[2.5px]
  border-l-brand-accent`), com texto branco.
- O rodapé **“Liberada em”** continua sendo a data da chamada e não se confunde com “Publicado em”.
- A **Descrição** é o texto puro de `descricao_completa`, com rótulo e `line-clamp-3`, dentro de um
  container `rounded-lg border border-brand-focus/40 bg-slate-50/50 p-3` (borda verde discreta).
- A **Solução** é o texto puro de `solucao`, exibida em bloco próprio dentro de um container
  `rounded-lg border border-brand-structure/40 bg-slate-50/70 p-3` (borda em `brand.structure`),
  com `whitespace-pre-line` para preservar quebras de linha. O HTML de
  `descricao_html`/`solucao_html` não é interpretado.
- As tags são exibidas à direita, precedidas do rótulo **“Tags:”**, como `#tag` em uma lista com
  `aria-label="Tags da chamada"`.
- Evidências aparecem somente quando existem; a galeria é aberta por clique/toque.
- O título do manual (`manual_titulo`) aparece como **“Manual: {título}”** acima das ações quando
  existir. A divisória entre as evidências e o rodapé (manual e ações) usa `brand.accent`
  (`border-t border-brand-accent`), o mesmo verde accent do container do título.
- “Documentação Externa” aparece quando `link_manual` existe e usa o tratamento de ação primária do
  design system (degradê navy/azul, texto branco).
- “Ver vídeo” aparece quando `link_video` existe e usa o tratamento secundário (outline).
- Os links externos abrem em nova aba com `rel="noopener noreferrer"`.
- A data de liberação aparece quando existir, formatada em `dd/mm/aaaa`.
- O card não exibe autor, revisor, status interno ou auditoria.

### 5.3 Evidências

- Fonte: `anexos_midias` com `tipo_mime LIKE 'image/%'`.
- Ordem: `destaque_capa DESC, ordem_exibicao ASC, criado_em ASC, id ASC`.
- Miniatura: variante `-320.webp` quando existir; o original é fallback em caso de erro.
- Texto alternativo: `legenda_alt`; quando vazio, a UI gera “Evidência X de Y da chamada {título}”.
- Galeria: `UiModal` com imagem ampliada, setas anterior/próxima, contagem “X de Y”, miniaturas,
  fechamento por `Escape` e botão “Fechar”.
- Sem imagens, o bloco “EVIDÊNCIAS / TELAS” não é renderizado.

## 6. Regras de seleção, contagens e gate

### 6.1 Gate público

Pai:

```sql
p.status = 'Publicado'
AND p.arquivada = 0
AND p.publicado_em IS NOT NULL
AND p.publicado_em <= NOW(6)
```

Chamada:

```sql
e.status = 'Publicado'
AND e.publicado_em IS NOT NULL
AND e.publicado_em <= NOW(6)
AND e.projeto_id = ?
```

Consequências:

- Rascunho, revisão, aprovação sem publicação efetiva, arquivamento e publicação futura não
  aparecem.
- Arquivar o escopo esconde o escopo e as chamadas na página.
- As contagens usam `COUNT(DISTINCT e.id)` e consideram apenas o conteúdo público.

### 6.2 Filtro por sistema

O filtro usa `EXISTS` na junção `entregas_itens_softwares` para não multiplicar chamadas:

```sql
EXISTS (
  SELECT 1 FROM entregas_itens_softwares j
   WHERE j.entrega_item_id = e.id AND j.software_nome = ?
)
OR (
  NOT EXISTS (SELECT 1 FROM entregas_itens_softwares j WHERE j.entrega_item_id = e.id)
  AND COALESCE(NULLIF(TRIM(sw.descricao), ''), NULLIF(TRIM(e.software), '')) = ?
)
```

- A primeira condição cobre chamadas com vínculo N:N.
- A segunda cobre registros legados sem junção, usando o software principal.
- Uma chamada com dois softwares aparece na lista dos dois sistemas e conta em cada contagem de
  sistema.
- Por isso, a soma de `sistemas[].chamadas` pode ser maior que `chamadas` do projeto; são agregados
  diferentes.

### 6.3 Ordenação e paginação

- Ordem: `ordem_apresentacao ASC, chamada ASC`.
- Padrão: 6 itens por página; o seletor de linhas por página do `UiPagination` oferece
  6, 12, 18 e 24 (mesmo padrão das grades administrativas), e trocar o tamanho volta para a página 1.
- `pagina` inválida -> 1.
- `porPagina` máximo 50.
- `sistema` desconhecido -> lista vazia, com "Ver todas as chamadas".
- O total e a página são calculados no servidor; a UI usa o `UiPagination` do kit com resumo,
  seletor de linhas por página e navegação `< < > >`.

## 7. Contrato de dados e API

### 7.1 Endpoints

```http
GET /api/publico/escopos/:id
GET /api/publico/escopos/:id/chamadas?sistema=&pagina=&porPagina=
```

- Ambos são anônimos e somente leitura; o middleware libera apenas `GET`/`HEAD` em
  `/api/publico/**`.
- Cache:
  - detalhe: `public, max-age=60, stale-while-revalidate=300`;
  - chamadas: `public, max-age=30, stale-while-revalidate=120`.
- Escopo inexistente, não publicado ou arquivado -> `404`.
- Falha de banco -> `500` genérico, sem SQL, host ou stack trace.

### 7.2 DTOs

```ts
export type PublicoEscopoDetalhe = PublicoEscopoResumo

export interface PublicoEvidencia {
  id: string
  url: string
  alt: string
  capa: boolean
}

export interface PublicoChamadaEscopo {
  id: string
  chamada: string
  titulo: string
  descricao: string
  solucao: string
  tipo: TipoItem
  impacto: ImpactoItem
  modulo: string
  parceiro: string
  manualTitulo: string
  softwares: string[]
  tags: string[]
  evidencias: PublicoEvidencia[]
  linkManual: string
  linkVideo: string
  dataLiberacao: string
}

export interface PublicoEscopoChamadas {
  itens: PublicoChamadaEscopo[]
  total: number
  pagina: number
  porPagina: number
  sistemaSelecionado: string
}
```

`PublicoEscopoDetalhe` reutiliza `PublicoEscopoResumo` (`id`, `codigo`, `nome`, `versao`, `ano`,
`chamadas`, `sistemas`, `publicadoEm`). Os helpers puros ficam em `shared/publico.ts`:
`normalizarSistema`, `sistemaPertenceAoEscopo`, `resumirEscopo`, `rotuloEvidencias` e
`rotuloImpacto`.

### 7.3 Privacidade

**Expõe:** identificadores públicos, código, nome, versão, ano, contagens, sistemas, data efetiva de
publicação, chamada, título, descrição em texto puro, solução em texto puro, tipo, impacto, módulo,
parceiro, título do manual, softwares, tags, evidências (URL, alt e capa), links externos e data de
liberação.

**Não expõe:** `autor_id`, `autor_nome`, `revisor_id`, `revisor_feedback`, status interno,
arquivamento, `descricao_html`, `solucao_html`, auditoria, anexos completos, caminhos físicos e
timestamps internos.

### 7.4 Normalização

- `sistema`: `trim`; comparação pelo nome exato do software.
- `pagina`: inteiro >= 1; inválido -> 1.
- `porPagina`: inteiro >= 1; padrão 6; máximo 50.
- `sistema` desconhecido -> resultado vazio.
- `id` inexistente/não público -> 404.

## 8. Visual, tokens e tema

- Hero: `rounded-2xl border border-slate-800 bg-gradient-to-br from-brand-primary via-slate-950 to-indigo-950`,
  texto `slate-100`/`slate-300`.
- Chips do hero:
  - versão/ano: `border-white/15 bg-white/10 text-indigo-200`;
  - sistema: `border-indigo-400/30 bg-indigo-500/15 text-indigo-200`.
- “Voltar aos Destaques”: `border-white/20 bg-white/10 text-slate-100`, hover `bg-white/15`.
- Indigo do Escopo: `indigo-700` `#4338ca` (ícone), `indigo-50` (fundo), `indigo-100` (seleção),
  `indigo-200/300/400` (bordas/texto), `indigo-800/950` (texto).
- Cards: `bg-white border-slate-200` no claro; `bg-slate-900 border-slate-800` no escuro.
- Badges de tipo: `correcao` (`rose-700`), `melhoria` (`emerald-700`) e `nova` (`indigo-700`),
  sempre com rótulo textual e ícone.
- Foco: `brand-focus` `#1a9e07`; erro: `rose-700` `#be123c`.
- Nenhum `lime-500` e nenhum degradê fora das superfícies permitidas.

## 9. Responsividade

| Viewport | Cabeçalho | Cards | Paginação |
|---|---|---|---|
| `>= 1280px` | Largura total, chips em uma linha | Uma coluna | Visível abaixo da lista |
| `1024px - 1279px` | Largura total | Uma coluna | Visível |
| `768px - 1023px` | Chips quebram linha | Uma coluna | Visível |
| `< 768px` | Chips e “Voltar” empilham | Uma coluna | Controles utilizáveis |

- Em nenhuma largura entre 320px e 1440px a página pode produzir overflow horizontal.
- Metadados, tags, evidências e ações quebram linha no mobile.
- O drawer da sidebar permanece independente, com backdrop e foco controlado.

## 10. Acessibilidade

- `h1` no cabeçalho, `h2` em “Chamadas contempladas” e `h3` em cada card.
- Contagens com texto visível; o leitor de tela anuncia o número e o rótulo.
- Tags em `<ul>` com `aria-label`.
- Evidências em `<button>` com `aria-label` “Abrir evidência X de Y da chamada {título}”.
- Galeria com foco controlado, setas, `Escape` e botão “Fechar”.
- Links externos com `target="_blank"` e `rel="noopener noreferrer"`.
- Carregamento com `aria-busy`; atualização da lista anunciada por `aria-live="polite"`.
- Foco visível em todos os controles; ordem de tabulação: cabeçalho, lista, cards, paginação.
- Contraste AA nos temas claro e escuro; nenhuma informação depende apenas de cor.

## 11. Estados

| Estado | Comportamento |
|---|---|
| Carga inicial | Skeleton do cabeçalho e da lista, com `aria-busy` |
| Escopo sem chamadas | Cabeçalho + “Nenhuma chamada publicada neste escopo.” |
| Sistema sem chamadas | Cabeçalho + “Nenhuma chamada pública para o sistema {nome}.” + “Ver todas as chamadas” |
| Sistema desconhecido | Lista vazia + aviso de que o sistema não pertence ao escopo + “Ver todas as chamadas” |
| Erro transitório | `UiErrorState` com “Tentar novamente”; sem reutilizar dados antigos |
| Escopo inexistente/não público | `404` |
| Paginação | `UiPagination` com total, página e seis por página |
| Tema escuro | Cards, chips, textos e evidências com contraste AA |

## 12. Componentização

```
app/pages/escopos/[id].vue                    composição, SEO e estados
app/composables/usePublicoEscopo.ts           duas leituras + rota + paginação
app/components/publico/EscopoCabecalho.vue    hero, chips, copy e contagens
app/components/publico/EscopoChamadaCard.vue  card da chamada
app/components/publico/EscopoEvidencias.vue   miniaturas + galeria
```

- Reutiliza `UiButton`, `UiBadge`, `UiPagination`, `UiErrorState` e `UiModal`.
- Não cria botão, campo ou tooltip paralelo.
- O demo da vitrine usa os mesmos componentes com `demo` para não navegar.

## 13. Desempenho e índices

- Consultas:
  1. detalhe do escopo + contagem total;
  2. sistemas agregados por escopo;
  3. página de chamadas + total filtrado;
  4. softwares das chamadas da página em lote;
  5. evidências das chamadas da página em lote.
- Sem N+1: softwares e evidências são carregados por `IN (...)`.
- O filtro de sistema usa `EXISTS`, não `JOIN`, para não multiplicar linhas.
- Índices existentes: `idx_entregas_proj` (`projeto_id`), `idx_entregas_publicado_em`
  (`status`, `publicado_em`), PK de `entregas_itens_softwares` e `idx_midias_entrega_item`.
- Se o `EXPLAIN` mostrar full scan para o filtro por projeto/status/publicação, avaliar um índice
  composto aditivo `(projeto_id, status, publicado_em)` em migration própria.
- Cache curto por endpoint; `stale-while-revalidate` evita bloqueio.

## 14. Testes e verificação

- `tests/publico-escopo.test.ts` cobre:
  - normalização de `sistema`, `pagina` e `porPagina`;
  - contagem por sistema e resumo do escopo;
  - sistema inválido;
  - singular/plural de chamadas, sistemas, evidências e rótulo de impacto.
- Manual:
  - gate: escopo público aparece; rascunho/revisão/arquivado/futuro responde `404`;
  - chamada não publicada não aparece na lista nem nas contagens;
  - contagens do cabeçalho batem com a sidebar;
  - filtro por sistema, chamada multi-software e paginação;
  - “Ver Tudo”, URL direta, recarregar, voltar/avançar e “Voltar aos Destaques”;
  - galeria (abrir, setas, `Escape`, foco);
  - descrição, solução, impacto, título do manual, botão primário e tags à direita no card;
  - destaque do impacto crítico (moldura rose, barra na borda esquerda, badge `critico`) e impacto
    não crítico sem moldura;
  - estados vazio, sistema desconhecido e erro;
  - 390/768/1024/1440 sem overflow; temas claro e escuro.
- Gates: `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.

## 15. Governança

- A autoridade de comportamento é a spec `escopo-publico` e os deltas de
  `design-system/public-layout` e `design-system/brand-tokens`.
- O doc 18 descreve o shell; o doc 19 descreve a leitura pública; o doc 20 descreve o Painel de
  Destaques. Este doc descreve a página do Escopo.
- O doc 01 registra a exceção do hero e a identidade indigo-700.
- A seção 30 da vitrine `/design` deve espelhar os componentes reais.
- As páginas públicas de release e manual continuam como próximos changes.

## 16. Checklist

### 16.1 Conteúdo e navegação

- [x] Rota `/escopos/[id]` com e sem `sistema`.
- [x] Sidebar navega ao selecionar sistema e no “Ver Tudo”.
- [x] Item ativo e projeto aberto derivam da URL.
- [x] “Voltar aos Destaques” retorna para `/`.
- [x] Cabeçalho com versão, ano, sistema, título, copy e três contagens.
- [x] Contagens com singular/plural correto.

### 16.2 Chamadas

- [x] Lista com gate público e filtro por sistema (N:N + fallback).
- [x] Ordenação `ordem_apresentacao`/`chamada` e seis por página.
- [x] Card com código, parceiro, tipo, impacto e sistemas na ordem definida.
- [x] “Publicado em” no lado direito, com todos os sistemas em chips.
- [x] Título em container com degradê do cabeçalho de modal e borda esquerda accent.
- [x] Descrição com borda verde e solução com borda em `brand.structure`.
- [x] Título do manual acima das ações e documentação externa em botão primário.
- [x] Tags alinhadas à direita com o rótulo “Tags:”.
- [x] Card com título e resumo em texto puro.
- [x] Bloco de solução em texto puro, preservando quebras de linha.
- [x] Data de liberação, evidências e links externos condicionais.
- [x] Galeria com miniaturas, setas, contagem e `Escape`.
- [x] Campos internos fora do contrato.

### 16.3 Qualidade

- [x] Estados de carregamento, vazio, erro e 404.
- [x] Responsividade entre 320px e 1440px.
- [x] Acessibilidade: títulos, contagens, tags, evidências, links e foco.
- [x] Tema claro/escuro com contraste AA.
- [x] `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`.
- [x] `openspec validate` do change.

### 16.4 Pendências conhecidas

- Modal de detalhe da chamada com descrição/solução completas fica para uma fase seguinte.
- Páginas públicas de release e manual continuam pendentes.
- O contador de visualizações do escopo não é incrementado nesta fase.

---

## Referências

- [`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md) —
  shell público.
- [`19 - API Pública de Navegação.md`](19%20-%20API%20P%C3%BAblica%20de%20Navega%C3%A7%C3%A3o.md) —
  leitura pública da navegação e novos endpoints.
- [`20 - Painel de Destaque Area Publica.md`](20%20-%20Painel%20de%20Destaque%20Area%20Publica.md) —
  hero, cards e padrões de estados.
- [`14 - Módulo do Escopo de Projetos.md`](14%20-%20M%C3%B3dulo%20do%20Escopo%20de%20Projetos.md) —
  modelo administrativo do escopo.
- [`01 - design_system.md`](01%20-%20design_system.md) — tokens, foco, badges e exceções de degradê.
- `shared/publico.ts`, `server/utils/publico.ts`,
  `server/api/publico/escopos/[id].get.ts`,
  `server/api/publico/escopos/[id]/chamadas.get.ts`,
  `app/composables/usePublicoEscopo.ts`,
  `app/pages/escopos/[id].vue` — implementação.
