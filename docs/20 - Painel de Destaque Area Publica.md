# 20 - Painel de Destaque da Área Pública

**Versão:** 1.0.0 - **Data:** 2026-10-28 - **Idioma:** Português do Brasil (pt-BR)
**Status:** Referência visual e contrato proposto. A implementação está no change
`painel-publico-destaques`; o contador de visualizações e as páginas de detalhe são dependências
separadas.
**Escopo:** painel de entrada da Área Pública em `/` - última release liberada da semana, manuais em
destaque, releases mais vistas/recentes e histórico filtrável de Releases Week.
**Fora de escopo:** contador de visualizações, páginas de detalhe `/releases/[id]` e
`/manuais/[id]`, busca server-side, painel de resultados, RBAC público, SEO avançado e alterações
no shell administrativo.
**Fonte visual:** imagens de referência da conversa (hero escuro, manuais + ranking, histórico em
cards) e [`01 - design_system.md`](01%20-%20design_system.md).
**Autoridade de comportamento:** `openspec/changes/painel-publico-destaques/specs/painel-publico/spec.md`
e o delta de `design-system/brand-tokens`. Em caso de divergência, a spec prevalece.
**Documentos relacionados:**
[`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md) -
[`19 - API Pública de Navegação.md`](19%20-%20API%20P%C3%BAblica%20de%20Navega%C3%A7%C3%A3o.md) -
[`12 - Módulo das Releases Week.md`](12%20-%20M%C3%B3dulo%20das%20Releases%20Week.md) -
[`13 - Módulo de Manuais Mensais.md`](13%20-%20M%C3%B3dulo%20de%20Manuais%20Mensais.md)

> Este documento descreve o **conteúdo** da Área Pública. O shell (header, sidebar, tema e drawer)
> continua sendo o do doc 18. A leitura pública da navegação continua sendo a do doc 19; este
> documento acrescenta a leitura do painel e do histórico.

---

## Sumário

1. [Papel e rota](#1-papel-e-rota)
2. [Escopo e não escopo](#2-escopo-e-não-escopo)
3. [Layout e grid](#3-layout-e-grid)
4. [Última Release Liberada da Semana](#4-última-release-liberada-da-semana)
5. [Manuais em Destaque dessa Semana](#5-manuais-em-destaque-dessa-semana)
6. [Releases Mais Vistas](#6-releases-mais-vistas)
7. [Histórico de Releases Week](#7-histórico-de-releases-week)
8. [Busca](#8-busca)
9. [Contrato de dados e API](#9-contrato-de-dados-e-api)
10. [Regras de seleção, gate e contagens](#10-regras-de-seleção-gate-e-contagens)
11. [Visual, tokens e tema](#11-visual-tokens-e-tema)
12. [Responsividade](#12-responsividade)
13. [Acessibilidade](#13-acessibilidade)
14. [Estados](#14-estados)
15. [Componentização](#15-componentização)
16. [Desempenho e índices](#16-desempenho-e-índices)
17. [Testes e verificação](#17-testes-e-verificação)
18. [Governança](#18-governança)
19. [Checklist](#19-checklist)

---

## 1. Papel e rota

O painel é a **entrada editorial** da Área Pública. Ele transforma a leitura anônima dos resumos da
sidebar em uma vitrine utilizável: a release da semana, os manuais em destaque, as releases mais
acessadas/recentes e o histórico completo com filtros.

```
HOJE
  /            -> app/pages/index.vue (placeholder "Conteúdo em preparação")
  /admin/**    -> shell administrativo

ALVO
  /            -> shell público (doc 18) + Painel de Destaques
  /releases/[id]                    -> detalhe da release (change separado)
  /manuais/[id]                     -> detalhe do manual (change separado)
  /manuais/[id]/itens/[itemId]      -> detalhe do item de manual (change separado)
  /admin/**                         -> shell administrativo, intocado
```

- A página herda `app/layouts/default.vue`; não usa `layout: false`.
- O atalho **“Painel de Destaques & Busca”** da sidebar permanece ativo (`aria-current="page"`)
  quando nenhuma seleção estiver ativa.
- O painel é **somente leitura**, **anônimo** e não expõe controles da Área Administrativa.
- O título visível/acessível da página é **“Painel de Destaques & Busca”**.

## 2. Escopo e não escopo

**Entra no v1**

- Hero da última release liberada da semana, com até três chamadas.
- Cards de manuais em destaque por item.
- Ranking de releases mais vistas com fallback para recentes.
- Histórico de Releases Week com filtros de software/tipo e paginação.
- Leitura pública anônima e cacheável.
- Estados de carregamento, vazio e erro.
- Responsividade, acessibilidade e tema claro/escuro.
- Documentação visual e contrato de dados.

**Não entra no v1**

- Contador de visualizações, deduplicação por sessão e rate limit de view.
- Páginas de detalhe e deep links de conteúdo.
- Busca server-side e painel de resultados.
- RBAC público, SEO avançado, sitemap e dados estruturados.
- Alterações no schema do banco; índices só se os planos de execução exigirem.
- Qualquer mudança no shell administrativo.

## 3. Layout e grid

```
+----------------------------------------------------------------------------------+
| [* Ultima Release Liberada da Semana] Semana 39 de 2026  [v26.06a] [Rel: ...]    |
| Publicada em 28/09/2026  .  1.434 visualizacoes                                   |
| Release Week 39 - Otimizacao Fiscal e Sincronizacao PDV Offline                   |
| descricao...                                                                      |
| +----------------+ +----------------+ +----------------+                          |
| | ERP Enterprise | | PDV Touch      | | WMS Logistica  |                          |
| | [Correcao]     | | [Melhoria]     | | [Nova Func.]   |                          |
| | titulo...      | | titulo...      | | titulo...      |                          |
| | Parceiro: ...  | | Parceiro: ...  | | Parceiro: ...  |                          |
| | 2 fotos        | | 1 foto         | | 1 foto         |                          |
| +----------------+ +----------------+ +----------------+                          |
| [ Ver release completa -> ]   (Aprovado pelo revisor tecnico: ...)                |
+----------------------------------------------------------------------------------+
+------------------------------------------+ +---------------------------------------+
| Manuais em Destaque dessa Semana         | | Releases Mais Vistas                  |
| +--------------------------------------+ | | 1 Semana 37 / 2026         3108       |
| | [ERP Enterprise]  Fiscal . Set/2026  | | |   Release Week 37 - ...               |
| | Guia Completo: ...                   | | |   1 chamada . 14/09/2026              |
| | [Ver video] [Manual online] [Ler ->] | | | 2 Semana 38 / 2026         2183       |
| +--------------------------------------+ | | ...                                   |
| +--------------------------------------+ | | 3 Semana 36 / 2026         1850       |
| | [PDV Touch] ...                      | | | ...                                   |
| +--------------------------------------+ | +---------------------------------------+
+----------------------------------------------------------------------------------+
| Historico de Releases Week                    Software [Todos v] Tipo [Todos v]  |
| +----------------+ +----------------+ +----------------+                          |
| | Semana 39/2026 | | Semana 38/2026 | | Semana 37/2026 |                          |
| | v26.06a Rel... | | ...            | | ...            |                          |
| | 1434 views     | | 2183 views     | | 3108 views     |                          |
| | titulo...      | | titulo...      | | titulo...      |                          |
| | 2 corr . 1 mel | | 1 corr . 1 nova| | 1 melhoria     |                          |
| | Publ. ...  Ver | | Publ. ...  Ver | | Publ. ...  Ver |                          |
| +----------------+ +----------------+ +----------------+                          |
| [ Carregar mais ]                                                                 |
+----------------------------------------------------------------------------------+
```

- Container: `mx-auto max-w-[85rem] px-4 py-6 sm:px-6 lg:px-8`.
- Hero: largura total.
- Manuais + ranking: `grid gap-6 lg:grid-cols-3`; manuais ocupam 2 colunas, ranking 1.
- Histórico: `grid gap-4 md:grid-cols-2 xl:grid-cols-3`.
- A sidebar pública permanece `w-72` no desktop e fica fixa; o painel vive em `main` com `min-w-0`
  e rolagem própria (`overflow-y-auto`).

## 4. Última Release Liberada da Semana

### 4.1 Anatomia

```
+----------------------------------------------------------------------------------+
| [badge de destaque] . Semana 39 de 2026 . [v26.06a] . [Rel: 26.06a10.05a]        |
| Publicada em 28/09/2026 . 1.434 visualizacoes                                     |
| H2: Release Week 39 - Otimizacao Fiscal e Sincronizacao PDV Offline               |
| Descricao editorial da release...                                                 |
| +----------------+ +----------------+ +----------------+                          |
| | Chamada 1      | | Chamada 2      | | Chamada 3      |                          |
| +----------------+ +----------------+ +----------------+                          |
| [ Ver release completa -> ]   Aprovado pelo revisor tecnico (Nome)                |
+----------------------------------------------------------------------------------+
```

### 4.2 Regras

- Selecionar a release publicada com `destaque_semana = 1` mais recente por `publicado_em`.
- Sem release marcada, selecionar a release publicada mais recente e trocar o rótulo para
  **“Última Release Publicada”**.
- Sem release publicada, exibir estado vazio próprio, sem CTA.
- Exibir até três chamadas publicadas, ordenadas por `ordem_apresentacao` e, no empate, por
  `chamada`/`id`.
- Cada card de chamada exibe: chamada (`CH`), título, software, módulo, tipo, parceiro e
  contagem de fotos quando maior que zero.
- O badge de destaque só aparece quando `destaque_semana = 1`.
- A data exibida é `publicado_em` (data efetiva), formatada em `dd/mm/aaaa`.
- Visualizações só aparecem quando `total_visualizacoes > 0`.
- O crédito do revisor só aparece quando `revisor_nome` existir.
- O CTA **“Ver release completa”** aponta para `/releases/{id}`.

### 4.3 Dados

| Campo | Origem | Uso |
|---|---|---|
| `id` | `release_week.id` | CTA |
| `semana`, `ano`, `mes` | `release_week.semana`, `ano`, `mes` | Cabeçalho |
| `versao`, `release` | `release_week.versao`, `release` | Chips |
| `nome`, `descricao` | `release_week.nome`, `descricao` | Título e texto |
| `publicadoEm` | `release_week.publicado_em` | Data e ordenação |
| `totalVisualizacoes` | `release_week.total_visualizacoes` | Contador |
| `destaqueSemana` | `release_week.destaque_semana` | Rótulo |
| `revisorNome` | `release_week.revisor_nome` | Crédito |
| `chamadas[]` | `entregas_itens` publicados da release | Cards |
| `fotos` | `COUNT(anexos_midias)` por item | Rodapé do card |

## 5. Manuais em Destaque dessa Semana

### 5.1 Anatomia

```
+--------------------------------------+
| [ERP Enterprise]  Fiscal . Set/2026  |
| H3: Guia Completo: Configuracao ...  |
| Descricao do item...                 |
| [Ver video] [Manual online] [Ler ->] |
+--------------------------------------+
```

### 5.2 Regras

- Selecionar manuais publicados com `destaque_semana = 1`.
- O card representa um **item publicado** vinculado ao manual, não o catálogo mensal.
- Exibir até dois cards, sem repetir o mesmo item.
- Preferir manuais distintos; dentro do manual, priorizar o primeiro item com `link_video` ou
  `link_manual`.
- Cada card exibe: software, módulo, mês/ano, título, descrição e tipo do item.
- Ações:
  - **“Ver vídeo”** quando `link_video` existir; abrir em nova aba com `rel="noopener noreferrer"`.
  - **“Manual online”** quando `link_manual` existir; mesma regra de segurança.
  - **“Ler conteúdo”** sempre, apontando para `/manuais/{manualId}/itens/{itemId}`.
- Sem item publicado no manual em destaque, exibir card de fallback do catálogo mensal com título,
  descrição e **“Ler conteúdo”** para `/manuais/{id}`.
- Sem manuais em destaque, exibir estado vazio próprio.

### 5.3 Dados

| Campo | Origem |
|---|---|
| `manualId` | `manuais_mensal.id` |
| `titulo`, `descricao` | `entregas_itens.titulo`, `descricao_completa` (texto puro) |
| `software`, `modulo`, `tipo` | `entregas_itens` |
| `mes`, `ano` | `manuais_mensal` |
| `linkVideo`, `linkManual` | `entregas_itens.link_video`, `link_manual` |
| `publicadoEm` | `entregas_itens.publicado_em` |

## 6. Releases Mais Vistas

### 6.1 Anatomia

```
+---------------------------------------+
| 1  Semana 37 / 2026          3108     |
|    Release Week 37 - Portal B2B ...   |
|    1 chamada . 14/09/2026             |
+---------------------------------------+
| 2  Semana 38 / 2026          2183     |
+---------------------------------------+
| 3  Semana 36 / 2026          1850     |
+---------------------------------------+
```

### 6.2 Regras

- Excluir a release do hero.
- Se ao menos uma release tiver `total_visualizacoes > 0`:
  - título **“Releases Mais Vistas”**;
  - ordenar por visualizações decrescentes, com `publicado_em` decrescente no empate;
  - se houver menos de três com views, completar com as mais recentes (sem views).
- Se nenhuma release tiver views:
  - título **“Releases Recentes”**;
  - ordenar por `publicado_em` decrescente;
  - ocultar a contagem de visualizações.
- Cada item exibe semana/ano, título, descrição, quantidade de chamadas, data efetiva e views
  apenas quando maiores que zero.
- CTA para `/releases/{id}`.
- Sem releases disponíveis, estado vazio próprio.

> O contador de visualizações ainda não é incrementado pela aplicação. O fallback para recentes é
> deliberado; quando o contador existir, a mesma seção passa a refletir os acessos reais.

## 7. Histórico de Releases Week

### 7.1 Anatomia

```
+----------------------------------------------------------------------------------+
| H2: Historico de Releases Week                     Software [Todos v] Tipo [Todos v] |
| Subtitulo: entregas semanais organizadas cronologicamente                        |
+----------------------------------------------------------------------------------+
| +----------------+ +----------------+ +----------------+                          |
| | Semana 39/2026 | | Semana 38/2026 | | Semana 37/2026 |                          |
| | v26.06a        | | v26.05b        | | v26.04a        |                          |
| | Rel: ...       | | Rel: ...       | | Rel: ...       |                          |
| | 1434 views     | | 2183 views     | | 3108 views     |                          |
| | titulo...      | | titulo...      | | titulo...      |                          |
| | 2 correcoes    | | 1 correcao     | | 1 melhoria     |                          |
| | 1 melhoria     | | 1 nova func.   | |                |                          |
| | Publ. 28/09    | | Publ. 21/09    | | Publ. 14/09    |                          |
| | Ver chamadas ->| | Ver chamadas ->| | Ver chamadas ->|                          |
| +----------------+ +----------------+ +----------------+                          |
| [ Carregar mais ]                                                                 |
+----------------------------------------------------------------------------------+
```

### 7.2 Regras

- Exibir todas as releases publicadas, ordenadas por `publicado_em` decrescente.
- Paginação de seis itens; **“Carregar mais”** anexa a página seguinte sem duplicar itens.
- Filtros:
  - **Software:** opções derivadas apenas de chamadas publicadas.
  - **Tipo:** “Correção”, “Melhoria” e “Nova Funcionalidade”.
  - Combinados com E lógico.
- O filtro de software seleciona releases com ao menos uma chamada publicada daquele software.
- O filtro de tipo seleciona releases com ao menos uma chamada publicada daquele tipo.
- As contagens do card refletem **todas** as chamadas publicadas da release, independentemente do
  filtro ativo. O filtro seleciona releases; não recontam itens.
- Cada card exibe: semana/ano, versão, código da release, título, descrição, contagens de correções,
  melhorias e novas funcionalidades, data efetiva, views quando maiores que zero e CTA para
  `/releases/{id}`.
- Filtros e página são refletidos na URL (`software`, `tipo`, `pagina`); alterar filtro volta à
  página 1.
- Sem resultados, exibir estado vazio com **“Limpar filtros”**.

## 8. Busca

- A busca global continua no header público (doc 18) e não ganha um segundo campo no painel.
- O painel de resultados da busca é outra capability; o título “Painel de Destaques & Busca” é
  mantido por ser o nome do atalho da sidebar.
- O painel não executa busca server-side nesta entrega.

## 9. Contrato de dados e API

### 9.1 Endpoints

```
GET /api/publico/painel
  -> PublicoPainel

GET /api/publico/releases?software=&tipo=&pagina=&porPagina=
  -> PublicoHistorico
```

- Ambos são anônimos, somente leitura, sob o middleware que libera `GET`/`HEAD` em
  `/api/publico/**`.
- Cache:
  - `/api/publico/painel`: `public, max-age=60, stale-while-revalidate=300`.
  - `/api/publico/releases`: `public, max-age=30, stale-while-revalidate=120`.
- Erros de banco: `500` genérico, sem SQL, host ou stack trace.
- Escritas em `/api/publico/**` continuam bloqueadas.

### 9.2 DTOs

```ts
type PublicoModoRanking = 'vistas' | 'recentes'

interface PublicoContagensTipo {
  correcao: number
  melhoria: number
  nova: number
}

interface PublicoChamadaDestaque {
  id: string
  chamada: string
  titulo: string
  software: string
  modulo: string
  tipo: TipoItem
  parceiro: string
  fotos: number
  linkVideo: string
  linkManual: string
}

interface PublicoReleaseDestaque {
  id: string
  semana: number
  ano: number
  mes: string
  versao: string
  release: string
  nome: string
  descricao: string
  publicadoEm: string
  totalVisualizacoes: number
  destaqueSemana: boolean
  revisorNome: string
  chamadas: PublicoChamadaDestaque[]
}

interface PublicoManualItemDestaque {
  card: 'item' | 'catalogo'
  id: string
  manualId: string
  titulo: string
  descricao: string
  software: string
  modulo: string
  tipo: TipoItem | null
  mes: string
  ano: number
  linkVideo: string
  linkManual: string
  publicadoEm: string
}

interface PublicoReleaseResumoPainel {
  id: string
  semana: number
  ano: number
  versao: string
  release: string
  nome: string
  descricao: string
  chamadas: number
  contagens: PublicoContagensTipo
  publicadoEm: string
  totalVisualizacoes: number
}

interface PublicoFiltrosPainel {
  softwares: string[]
  tipos: TipoItem[]
}

interface PublicoPainel {
  releaseDestaque: PublicoReleaseDestaque | null
  manuaisDestaque: PublicoManualItemDestaque[]
  maisVistas: PublicoReleaseResumoPainel[]
  modoMaisVistas: PublicoModoRanking
  filtros: PublicoFiltrosPainel
}

interface PublicoHistorico {
  itens: PublicoReleaseResumoPainel[]
  total: number
  pagina: number
  porPagina: number
}
```

### 9.3 Privacidade

**Expõe:** identificadores públicos, semana, ano, mês, versão, release, título, descrição, tipo,
software, módulo, parceiro, chamada, data efetiva, visualizações, contagem de fotos, links de
vídeo/manual e `revisorNome`.

**Não expõe:** `autor_id`, `autor_nome`, `revisor_id`, `revisor_feedback`, status interno,
arquivamento, auditoria, anexos completos, caminhos físicos e timestamps internos.

O crédito do revisor é o único dado de revisor exposto. O feedback e a autoria permanecem internos.

### 9.4 Normalização

- `pagina` inválida -> 1.
- `porPagina` padrão 6, máximo 50.
- `tipo` fora do enum -> ignorado.
- `software` desconhecido -> resultado vazio.
- `software` é comparado com o nome público do software (snapshot do item).

## 10. Regras de seleção, gate e contagens

### 10.1 Gate público

Toda leitura aplica:

```sql
status = 'Publicado'
AND arquivada = 0
AND publicado_em IS NOT NULL
AND publicado_em <= NOW(6)
```

Para as chamadas filhas, o mesmo gate é aplicado. Arquivar o pai esconde o pai e as filhas. Rascunho,
revisão, aprovação sem publicação efetiva e publicação futura não aparecem.

### 10.2 Seleção

| Seção | Regra |
|---|---|
| Hero | `destaque_semana = 1` mais recente; fallback para a publicada mais recente |
| Chamadas do hero | Até 3, por `ordem_apresentacao`; empate por `chamada`/`id` |
| Manuais | Manuais em destaque, um item por manual, até 2 cards; fallback de catálogo |
| Mais vistas | Exclui o hero; top 3 por views; fallback recente; completa posições |
| Histórico | Publicadas por `publicado_em` desc; 6 por página; filtros software/tipo |

### 10.3 Contagens

- `contagens.correcao` / `melhoria` / `nova` contam chamadas publicadas da release.
- A soma das três contagens é igual a `chamadas` da release.
- Uma chamada com `origem = 'Ambos'` pode aparecer no hero e nos manuais; não é duplicidade.
- Uma chamada com múltiplos softwares pode aparecer em mais de uma opção de filtro; o filtro de
  software seleciona a release, não multiplica o card.

### 10.4 Datas

- Exibição e ordenação usam `publicado_em` (carimbo efetivo).
- `data_publicacao` (data editorial) não é usada como gate nem como ordenação no painel.
- Formato visual: `dd/mm/aaaa`; semana/versão/release em `font-mono tabular-nums`.

### 10.5 Terminologia

- No público, adotar **“chamadas”** para os itens editoriais, alinhado ao doc 18.
- O CTA do histórico pode ser **“Ver chamadas”**; o hero usa **“Ver release completa”**.
- A copy editorial pode usar “entregas” dentro da descrição da release.

## 11. Visual, tokens e tema

### 11.1 Hero

- Superfície: `rounded-2xl border border-slate-800 bg-gradient-to-br from-brand-primary via-slate-950 to-indigo-950 text-slate-100`.
- É a **única nova superfície com degradê** na Área Pública; registrar no doc 01 §2.1 e no delta de
  `design-system/brand-tokens`.
- Chips:
  - versão: `bg-white/10 text-indigo-200 border-white/15`;
  - release: `bg-indigo-500/15 text-indigo-200 border-indigo-400/30`;
  - chamada: `bg-white/5 text-slate-300 border-white/10`.
- Cards de chamada: `rounded-xl border border-white/10 bg-white/[0.04] p-3`.
- Texto principal `text-slate-100`; secundário `text-slate-300`; discreto `text-slate-400`.
- Foco: `ring-2 ring-brand-focus/50`.
- Tema escuro: manter o hero e ajustar contraste de bordas/chips; não usar cores administrativas.

### 11.2 Seções

- Releases (hero, ranking, histórico): índigo.
- Manuais: esmeralda.
- Escopo de Projetos: indigo-700 (`#4338ca`; já no shell, não usado no painel).
- O histórico é de releases e usa indigo, não o indigo-700 do Escopo, para manter a identidade da
  seção.

### 11.3 Badges de tipo

| Tipo | Cor | Ícone | Rótulo |
|---|---|---|---|
| Correção | `rose-700` | `Wrench` | Correção |
| Melhoria | `emerald-700` | `Sparkles` | Melhoria |
| Nova Funcionalidade | `indigo-700` | `PlusCircle` | Nova Funcionalidade |

- O rótulo textual sempre acompanha a cor; nenhum tipo depende apenas de cor.
- O `rose-700` de tipo não substitui o `rose-700` de erro/validação.
- As variantes `correcao`, `melhoria` e `nova` entram no `UiBadge`; o doc 01 §5.2 e a vitrine são
  atualizados no mesmo change.

### 11.4 Cards e superfícies

- Tema claro: cards `bg-white border-slate-200`; hover `border-slate-300`.
- Tema escuro: cards `bg-slate-900 border-slate-800`; hover `border-slate-700`.
- Títulos `font-bold tracking-tight`; descrições `text-sm`; metadados `text-xs`.
- Contadores e códigos em `font-mono tabular-nums`.
- Visualizações formatadas com `Intl.NumberFormat('pt-BR')` (ex.: `1.434`).
- Não usar `lime-500` para foco; foco canônico `brand-focus` `#1a9e07`.
- Erro/validação continua `rose-700` `#be123c`.

## 12. Responsividade

| Viewport | Hero | Manuais + ranking | Histórico |
|---|---|---|---|
| `>= 1280px` | Largura total; 3 cards de chamada lado a lado | 2 colunas + 1 coluna | 3 colunas |
| `1024px - 1279px` | Largura total; 3 cards | 2 colunas + 1 coluna | 2 colunas |
| `768px - 1023px` | Largura total; cards empilhados se necessário | Empilhados | 2 colunas |
| `< 768px` | Largura total; cards empilhados | Empilhados | 1 coluna |

- Chips quebram linha; filtros empilham no mobile.
- Alvos de toque mínimos de 44x44 no mobile.
- Nenhum overflow horizontal entre 320px e 1440px.
- O drawer da sidebar continua independente e com foco controlado.

## 13. Acessibilidade

- `h1` “Painel de Destaques & Busca”; `h2` por seção com `aria-labelledby`; `h3` nos cards.
- Links de CTA com nome acessível que inclua a semana ou o título do item.
- Badges de tipo com texto; nunca apenas cor.
- Visualizações com `aria-label` (“1.434 visualizações”).
- Filtros com rótulos visíveis; resultado anunciado por `aria-live="polite"`.
- Carregamento com `aria-busy="true"`; erro com `role="alert"` e “Tentar novamente”.
- Foco visível em todos os controles; ordem de tabulação: hero -> manuais -> ranking -> filtros ->
  cards do histórico.
- Links externos com `target="_blank"` e `rel="noopener noreferrer"`.
- Contraste AA nos temas claro e escuro; respeitar `prefers-reduced-motion`.

## 14. Estados

| Estado | Comportamento |
|---|---|
| Carga inicial | Skeleton por seção; sem números parciais |
| Falha de `/api/publico/painel` | Erro no lugar das seções, com “Tentar novamente”; sem dados antigos |
| Falha de `/api/publico/releases` | Erro restrito ao histórico; hero/manuais/ranking seguem |
| Hero vazio | “Nenhuma release publicada ainda.” sem CTA |
| Manuais vazios | “Nenhum manual em destaque nesta semana.” |
| Ranking vazio | “Ainda não há releases publicadas.” |
| Histórico vazio | “Nenhuma release encontrada para os filtros selecionados.” + “Limpar filtros” |
| Filtros | Loading apenas na lista; controles utilizáveis |
| Views zero | Contador oculto; ranking em modo “recentes” |

## 15. Componentização

```
app/pages/index.vue                         (composição + SEO + URL)
app/composables/usePublicoPainel.ts         (duas leituras + retry)
app/components/publico/
  PainelUltimaRelease.vue                   (hero + cards)
  PainelManuaisDestaque.vue                 (cards por item)
  PainelMaisVistas.vue                      (ranking/recentes)
  PainelHistorico.vue                       (filtros + grid + carregar mais)
  PainelReleaseCard.vue                     (card reutilizado)
```

- Reutilizar `UiButton`, `UiSelect`, `UiLoading`, `UiErrorState`, `UiBadge` e `UiTooltip`.
- Não criar botão, campo ou tooltip paralelos.
- `UiBadge` ganha as variantes `correcao`, `melhoria` e `nova`.
- O hero usa `UiButton variant="primary"`; o gradiente do botão é o canônico.
- A página não usa `layout: false`; o shell público permanece.

## 16. Desempenho e índices

- Consultas agregadas no servidor, sem N+1:
  1. hero + chamadas + fotos;
  2. manuais + itens + fotos;
  3. ranking + contagem de chamadas;
  4. histórico + contagens por tipo;
  5. opções de filtro.
- Filtros de software/tipo com `EXISTS`, não `JOIN` que multiplique a release.
- Contagem de fotos por subquery em `anexos_midias`.
- Histórico devolve apenas a página; não materializa todas as chamadas.
- Cache curto por endpoint; `stale-while-revalidate`.
- Índices candidatos (avaliar com `EXPLAIN`):
  - `release_week (status, arquivada, publicado_em, total_visualizacoes)`
  - `entregas_itens (release_id, status, publicado_em, ordem_apresentacao)`
  - `entregas_itens_softwares (software_codigo, entrega_item_id)`
  - `anexos_midias (entrega_item_id)`
  - `manuais_mensal (status, arquivada, publicado_em, destaque_semana)`
- Nenhuma migration é obrigatória no v1; se um índice for necessário, a migration é aditiva.

## 17. Testes e verificação

- `tests/publico-painel.test.ts` cobre:
  - destaque com flag e fallback;
  - ordem/limite das chamadas;
  - manuais por item, prioridade de links e fallback de catálogo;
  - ranking com views, parcial e todas zero;
  - exclusão do hero;
  - contagens por tipo;
  - filtros combinados;
  - normalização de página/tamanho/tipo/software;
  - rótulos pt-BR.
- `tests/visibilidade-publica.test.ts` cobre o gate pai/filho e publicação futura.
- Manual:
  - publicar, arquivar e agendar conteúdo;
  - conferir que o painel e as contagens escondem o não público;
  - testar os filtros e a paginação;
  - conferir os temas e os viewports 1440/1024/768/390;
  - percorrer por teclado e verificar foco, `aria-live` e contraste.
- Gates: `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`.

## 18. Governança

- Este documento é a referência **visual e de conteúdo**; a autoridade de comportamento é
  `openspec/changes/painel-publico-destaques/specs/painel-publico/spec.md`.
- A exceção do degradê do hero e os badges de tipo passam pelo delta de
  `design-system/brand-tokens`.
- As páginas de detalhe e o contador de visualizações são changes separados.
- Atualizações na implementação:
  - `docs/01 - design_system.md` §2.1, §3 e §5.2;
  - `docs/18` §12.4 (próximo passo);
  - `docs/19` (endpoints, DTOs e privacidade);
  - `app/pages/design.vue` (seção 29 do painel público);
  - `AGENTS.md` (faixa de seções da vitrine).
- O change de implementação é `painel-publico-destaques`; o archive ocorre depois dos gates.

## 19. Checklist

### 19.1 Conteúdo

- [ ] Hero seleciona destaque e fallback corretamente.
- [ ] Hero limita a três chamadas e ordena por `ordem_apresentacao`.
- [ ] Fotos, parceiro, chamada e revisor aparecem apenas quando existem.
- [ ] Manuais usam item, não catálogo, quando há item publicado.
- [ ] Ações de vídeo/manual só aparecem quando há link.
- [ ] Fallback de catálogo funciona.
- [ ] Ranking exclui o hero e ordena por views.
- [ ] Ranking cai para “Releases Recentes” quando todas as views são zero.
- [ ] Histórico ordena por data, pagina de seis em seis e não duplica itens.
- [ ] Filtros de software/tipo combinam com E lógico.
- [ ] Contagens do card não são alteradas pelo filtro.
- [ ] URL preserva `software`, `tipo` e `pagina`.

### 19.2 Gate e privacidade

- [ ] Rascunho, revisão, aprovação sem publicação, arquivamento e publicação futura não aparecem.
- [ ] Chamada filha não publicada não entra em hero, manuais ou contagens.
- [ ] `origem = 'Ambos'` pode aparecer nas duas seções sem ser duplicidade.
- [ ] Nenhum autor, feedback, ID interno ou auditoria é exposto.
- [ ] `revisorNome` só aparece quando existe.

### 19.3 Visual e responsividade

- [ ] Hero escuro com degradê sutil, sem degradê em outras superfícies.
- [ ] Releases em índigo; manuais em esmeralda.
- [ ] Badges de tipo com cor, ícone e rótulo.
- [ ] Tema claro e escuro com contraste AA.
- [ ] 1440, 1024, 768 e 390 sem overflow horizontal.
- [ ] Drawer da sidebar preservado.

### 19.4 Acessibilidade e qualidade

- [ ] H1/H2/H3 e `aria-labelledby` corretos.
- [ ] CTAs com nomes acessíveis.
- [ ] Filtros com rótulo e `aria-live`.
- [ ] Foco visível e ordem de tabulação previsível.
- [ ] Links externos com `rel` seguro.
- [x] `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` passam (verificado em 2026-10-28).

### 19.5 Verificação executada

- `npm run lint`, `npm run typecheck`, `npm run test` (339 testes) e `npm run build` passaram.
- Leitura anônima: `GET /api/publico/painel` e `GET /api/publico/releases` responderam `200`; `GET /api/release-week` sem cookie respondeu `401`.
- Seed de integração (removido depois): release 39 com destaque, três chamadas no hero, duas fotos em uma chamada, manuais de setembro/agosto, ranking 38/37, histórico com contagens por tipo, `origem = 'Ambos'` e opções de filtro.
- Gate: release e manual em revisão, release arquivada, release com publicação futura e release em rascunho não apareceram no painel nem no histórico.
- Filtros: `software=ERP Enterprise&tipo=Melhoria` retornou apenas a release correspondente; `pagina=abc` foi normalizada para 1; `porPagina=999` foi limitado a 50.
- Viewports 390, 768, 1024 e 1440: `document.documentElement.scrollWidth === window.innerWidth` em todos, sem overflow horizontal.
- Tema escuro: `[data-publico-shell].dark` aplicado; títulos, cards, chips e contadores com contraste legível; o hero mantém o degradê previsto.
- **Dependência conhecida:** as rotas `/releases/[id]`, `/manuais/[id]` e `/manuais/[id]/itens/[itemId]` ainda não existem. Os CTAs e “Ler conteúdo” apontam para elas e responderão `404` até o change de páginas de detalhe. O Vue Router emite aviso de rota ausente no console; é esperado e não quebra o painel.
- A matriz de teclado/foco foi revisada por código (controles nativos, anéis `brand-focus`, `aria-live`); a conferência interativa completa fica para o QA visual do change de detalhe, quando as rotas existirem.

---

## Referências

- [`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md) - shell público.
- [`19 - API Pública de Navegação.md`](19%20-%20API%20P%C3%BAblica%20de%20Navega%C3%A7%C3%A3o.md) - leitura pública de navegação.
- [`01 - design_system.md`](01%20-%20design_system.md) - tokens, tipografia, foco, badges e exceções.
- [`12 - Módulo das Releases Week.md`](12%20-%20M%C3%B3dulo%20das%20Releases%20Week.md) - modelo da release.
- [`13 - Módulo de Manuais Mensais.md`](13%20-%20M%C3%B3dulo%20de%20Manuais%20Mensais.md) - modelo do manual.
- `openspec/changes/painel-publico-destaques/` - proposta, spec, design e tarefas do change.
- `app/layouts/default.vue`, `app/components/layout/`, `shared/publico.ts`, `server/utils/publico.ts` - implementação.
