# Design

## Context

Ver `proposal.md` para a motivação. O estado atual que condiciona a solução:

- `app/layouts/default.vue` já entrega o shell público, e `GET /api/publico/navegacao` alimenta a sidebar com resumos anônimos.
- `app/pages/index.vue` ainda é um placeholder; não há leitura pública de chamadas, descrições, fotos ou revisor.
- `release_week` já possui `nome`, `descricao`, `versao`, `release`, `semana`, `ano`, `publicado_em`, `destaque_semana`, `revisor_nome` e `total_visualizacoes`.
- `entregas_itens` possui `chamada`, `titulo`, `software`, `modulo`, `tipo`, `parceiro`, `link_video`, `link_manual`, `ordem_apresentacao` e `publicado_em`; `anexos_midias` fornece a contagem de fotos.
- `manuais_mensal` possui `destaque_semana`, `destaque_mes` e `total_visualizacoes`; os links de vídeo/manual e o título de guia vivem no item (`entregas_itens.manual_id`).
- `total_visualizacoes` existe, mas não é incrementado em nenhum fluxo atual; o doc 17 registra que o contador está zerado.
- O doc 18 deixou páginas de conteúdo e deep links fora de escopo; o doc 19 hoje não expõe descrição, revisor, anexos ou imagens.
- A Área Pública usa a paleta editorial índigo/esmeralda/púrpura; o `/admin` continua na paleta navy/verde.

## Goals / Non-Goals

**Goals:**

- Entregar o painel em `/` com hero, manuais, ranking/recentes e histórico.
- Criar leitura pública anônima, paginada e cacheável, com gate de publicação reutilizado.
- Manter as regras de seleção e contagem em funções puras compartilhadas e testáveis.
- Preservar o shell, a sidebar e a Área Administrativa sem regressão.
- Documentar a exceção visual do hero e as variantes de tipo no design system.

**Non-Goals:**

- Implementar o contador de visualizações, deduplicação ou rate limit de view.
- Implementar as páginas de detalhe `/releases/[id]` e `/manuais/[id]`.
- Implementar busca server-side ou painel de resultados.
- Criar RBAC público, SEO avançado, sitemap ou dados estruturados.
- Alterar o schema do banco; índices adicionais só entram se os planos de execução exigirem.

## Decisions

### 1. Dois endpoints anônimos, com cache e responsabilidades separadas

- `GET /api/publico/painel` devolve o hero, os manuais em destaque, o ranking/recentes e as opções de filtro.
- `GET /api/publico/releases` devolve apenas o histórico filtrado e paginado.

**Por quê:** trocar filtro não deve refazer o hero nem os manuais; o cache do painel pode ser mais longo que o do histórico. Um endpoint único acoplaria o cache do hero à paginação e criaria recomputação desnecessária.

**Alternativa descartada:** estender `/api/publico/navegacao` com todos os campos. Isso engordaria a resposta usada pela sidebar em todas as rotas e misturaria navegação com conteúdo da home.

**Implementação:** estender `server/utils/publico.ts` com `listarPainelPublico()` e `listarHistoricoPublico()`. Reutilizar o helper de gate e o pool atual, com queries parametrizadas. O middleware `server/middleware/auth-api.ts` já libera `GET`/`HEAD` sob `/api/publico/`; nenhuma alteração de autenticação é necessária.

**Cache:**

- `/api/publico/painel`: `public, max-age=60, stale-while-revalidate=300`.
- `/api/publico/releases`: `public, max-age=30, stale-while-revalidate=120`.
- Em falha de banco, deixar o error handler global responder `500` genérico.

### 2. DTOs novos em `shared/publico.ts`, sem quebrar a navegação

Adicionar tipos sem alterar `PublicoNavegacao`:

```ts
export type PublicoModoRanking = 'vistas' | 'recentes'

export interface PublicoContagensTipo {
  correcao: number
  melhoria: number
  nova: number
}

export interface PublicoChamadaDestaque {
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

export interface PublicoReleaseDestaque {
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

export interface PublicoManualItemDestaque {
  id: string
  manualId: string
  titulo: string
  descricao: string
  software: string
  modulo: string
  tipo: TipoItem
  mes: string
  ano: number
  linkVideo: string
  linkManual: string
  publicadoEm: string
}

export interface PublicoReleaseResumoPainel {
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

export interface PublicoFiltrosPainel {
  softwares: string[]
  tipos: TipoItem[]
}

export interface PublicoPainel {
  releaseDestaque: PublicoReleaseDestaque | null
  manuaisDestaque: PublicoManualItemDestaque[]
  maisVistas: PublicoReleaseResumoPainel[]
  modoMaisVistas: PublicoModoRanking
  filtros: PublicoFiltrosPainel
}

export interface PublicoHistorico {
  itens: PublicoReleaseResumoPainel[]
  total: number
  pagina: number
  porPagina: number
}
```

- `publicadoEm` é a única data pública do painel; a ordenação e a exibição usam o carimbo efetivo, não `data_publicacao`.
- `descricao` é texto puro; o painel não renderiza HTML. O `descricao_html` fica para a página de detalhe.
- `fotos` é contagem de `anexos_midias` do item; URLs de anexos não são expostas.
- `revisorNome` é o único dado de revisor exposto; `revisor_feedback`, `autor_id` e `autor_nome` ficam fora.
- `TipoItem` já existe em `shared/manuais.ts`; importar de lá para evitar duplicação.

### 3. Regras de seleção como funções puras

Criar em `shared/publico.ts` (ou módulo irmão) funções sem dependência de Nuxt/Vue:

| Função | Responsabilidade |
|---|---|
| `selecionarReleaseDestaque(releases)` | `destaque_semana = 1` mais recente; fallback para a mais recente; devolve também o rótulo |
| `selecionarItensDestaque(chamadas, limite = 3)` | ordena por `ordem_apresentacao` e aplica o limite |
| `selecionarManuaisDestaque(manuais, itens, limite = 2)` | itens publicados de manuais em destaque, priorizando manuais distintos e itens com links |
| `ranquearMaisVistas(releases, heroId, limite = 3)` | exclui o hero, ordena por views/data, completa com recentes e devolve `modoMaisVistas` |
| `contarTipos(itens)` | conta correção, melhoria e nova |
| `filtrarHistorico(releases, filtros)` | seleciona releases por software/tipo com E lógico |
| `rotuloFotos(n)`, `rotuloVisualizacoes(n)`, `rotuloTipo(tipo, n)` | pluralização e formatação pt-BR |

**Por quê:** as mesmas regras valem para servidor, cliente e testes; a UI não recalcula seleção nem ranking. `total_visualizacoes` zerado é tratado no seletor, não na tela.

**Casos de borda:**

- Hero ausente: `releaseDestaque = null`; a tela mostra estado vazio.
- Ranking com todas as views zero: `modoMaisVistas = 'recentes'`.
- Ranking com algumas views: `modoMaisVistas = 'vistas'`; as posições restantes são completadas com recentes e exibem views só quando `> 0`.
- `origem = 'Ambos'`: o item pode aparecer no hero e nos manuais; não deduplicar entre seções.
- Manual sem item publicado: fallback para o catálogo mensal.
- Release sem chamadas publicadas: `chamadas = 0`, contagens zero, card permanece no histórico.

### 4. Consultas agregadas, sem N+1

Ordenar a leitura em cinco consultas independentes, executadas em paralelo:

1. Hero: release em destaque/fallback + até 3 chamadas + contagem de fotos.
2. Manuais: manuais em destaque + itens publicados + contagem de fotos.
3. Ranking: releases publicadas com `total_visualizacoes` e contagem de chamadas.
4. Histórico: página de releases + contagens por tipo (subquery agregada ou CTE).
5. Filtros: softwares distintos e tipos presentes em chamadas publicadas.

Regras de implementação:

- Reutilizar o gate `status = 'Publicado' AND arquivada = 0 AND publicado_em IS NOT NULL AND publicado_em <= NOW(6)` para pais e filhos.
- Usar `EXISTS` para os filtros de software/tipo, não `JOIN` que multiplique a release por item.
- Contar fotos com subquery `COUNT(*)` em `anexos_midias` por `entrega_item_id`.
- Não materializar todas as chamadas para contar em memória; o histórico devolve só a página.
- Avaliar `EXPLAIN` com dados reais. Índices candidatos, se ainda não cobertos:
  - `release_week (status, arquivada, publicado_em, total_visualizacoes)`
  - `entregas_itens (release_id, status, publicado_em, ordem_apresentacao)`
  - `entregas_itens_softwares (software_codigo, entrega_item_id)`
  - `anexos_midias (entrega_item_id)`
  - `manuais_mensal (status, arquivada, publicado_em, destaque_semana)`
- Se um índice for necessário, a migration é aditiva e entra no change de implementação; não há mudança de schema obrigatória para o v1.

### 5. Frontend: página fina + componentes de domínio

```
app/pages/index.vue                         (composição + SEO + estado de filtros)
app/composables/usePublicoPainel.ts         (duas leituras SSR + refresh)
app/components/publico/
  PainelUltimaRelease.vue                   (hero + cards de chamadas)
  PainelManuaisDestaque.vue                 (cards por item)
  PainelMaisVistas.vue                      (ranking/recentes)
  PainelHistorico.vue                       (filtros + grid + carregar mais)
  PainelReleaseCard.vue                     (card reutilizado no ranking/histórico)
```

- `usePublicoPainel` usa `useAsyncData` com chaves `publico-painel` e `publico-historico` (a segunda inclui os filtros). O SSR entrega o HTML já preenchido.
- A página sincroniza `software`, `tipo` e `pagina` com `useRoute`/`useRouter`; trocar filtro volta à página 1; “Carregar mais” anexa a próxima página.
- Reutilizar `UiButton`, `UiSelect`, `UiLoading`, `UiErrorState`, `UiBadge` e `UiTooltip`. Não criar campo/botão/tooltip paralelos.
- `UiBadge` ganha as variantes `correcao`, `melhoria` e `nova`, com ícones `Wrench`, `Sparkles` e `PlusCircle`, mantendo o rótulo textual. Atualizar o doc 01 §5.2 e a vitrine.
- O hero usa `UiButton variant="primary"` para o CTA; o gradiente do botão já é canônico.
- A página define `useHead` com título e descrição públicos; não há `definePageMeta({ layout: false })`, pois o shell público deve permanecer.

### 6. Direção visual e tokens

**Hero:** `rounded-2xl border border-slate-800 bg-gradient-to-br from-brand-primary via-slate-950 to-indigo-950 text-slate-100`. É a única nova superfície com degradê; registrar no doc 01 §2.1 e no delta de `brand-tokens`. No tema escuro, manter o mesmo hero e ajustar bordas/chips para não sumir no `slate-950`.

**Chips e cards do hero:**

- Versão: `bg-white/10 text-indigo-200 border-white/15`.
- Código da release: `bg-indigo-500/15 text-indigo-200 border-indigo-400/30`.
- Chamada: `bg-white/5 text-slate-300 border-white/10`.
- Card de chamada: `rounded-xl border border-white/10 bg-white/[0.04] p-3`.
- Texto principal: `text-slate-100`; secundário: `text-slate-300`; discreto: `text-slate-400`.
- Foco: `ring-2 ring-brand-focus/50`.

**Seções:** releases em índigo, manuais em esmeralda; o histórico é de releases e usa índigo, não púrpura, para manter a identidade da seção. O ranking de releases também usa índigo.

**Badges de tipo:** Correção `rose-700`, Melhoria `emerald-700`, Nova Funcionalidade `indigo-700`. O rótulo textual sempre acompanha a cor. O `rose-700` de tipo não substitui o `rose-700` de erro/validação.

**Tipografia e datas:** títulos `font-bold tracking-tight`; semana/versão/release/visualizações em `font-mono tabular-nums`; descrições `text-sm`; datas em `dd/mm/aaaa`; contadores com `Intl.NumberFormat('pt-BR')`.

**Terminologia:** adotar **“chamadas”** no público, alinhado ao doc 18. O CTA do histórico pode ser “Ver chamadas”; o hero usa “Ver release completa”. A copy editorial pode usar “entregas” dentro da descrição.

### 7. Busca e detalhe permanecem fora do painel

- A busca global continua no header e não ganha um segundo campo no painel. O título “Painel de Destaques & Busca” é mantido, mas o painel de resultados é outra capability.
- Os CTAs apontam para `/releases/{id}`, `/manuais/{manualId}/itens/{itemId}` e `/manuais/{manualId}`. As páginas de detalhe são uma dependência separada.
- Para evitar 404 em produção antes da entrega das páginas, a implementação deve coordenar a publicação ou esconder os CTAs atrás de uma flag de configuração até as rotas existirem. O contrato dos `href` permanece o definido na spec.

### 8. Estados e acessibilidade

- Carga inicial: skeleton por seção, `aria-busy="true"`; sem números parciais.
- Falha de `/api/publico/painel`: estado de erro no lugar das seções, com “Tentar novamente”.
- Falha de `/api/publico/releases`: erro restrito ao histórico; hero/manuais/ranking seguem.
- Vazios: hero, manuais, ranking e histórico com mensagens próprias; histórico sem resultado oferece “Limpar filtros”.
- Filtros: `UiSelect` com rótulo visível; resultado anunciado por `aria-live="polite"`; foco permanece no controle.
- Links de CTA com nome acessível que inclua a semana/título; links externos com `target="_blank"` e `rel="noopener noreferrer"`.
- Tipo não depende de cor; visualizações com `aria-label`; contraste AA nos dois temas; respeitar `prefers-reduced-motion`.

### 9. Testes e documentação

- `tests/publico-painel.test.ts` cobre:
  - seleção do hero com flag e fallback;
  - limite e ordem dos itens do hero;
  - seleção de manuais por item e fallback de catálogo;
  - ranking com views, parcial e todas zero;
  - exclusão do hero do ranking;
  - contagens por tipo e pluralização;
  - filtros por software/tipo e combinação;
  - normalização de `pagina`/`porPagina`/`tipo`;
  - formatação de visualizações e fotos.
- `tests/visibilidade-publica.test.ts` existente deve ser mantido; se a implementação criar uma função de gate reutilizável, adicionar cenários para pai/filho.
- Verificação manual: publicar, arquivar e agendar conteúdo; conferir que o painel esconde tudo; testar filtros, temas, 1440/1024/768/390 e teclado.
- Atualizar `docs/20 - Painel de Destaque Area Publica.md` (novo), `docs/01` §2.1/§3/§5.2, `docs/18` §12.4, `docs/19` (endpoints e privacidade) e a vitrine `/design` com a seção do painel público (seção 29).
- Gates: `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`.

## Risks / Trade-offs

| Risco | Mitigação |
|---|---|
| `total_visualizacoes` está zerado; “Mais Vistas” pode parecer vazia | Fallback para “Releases Recentes” e ocultar views zero; o contador entra em change futuro |
| CTAs apontam para rotas de detalhe que ainda não existem | Coordenar a entrega das páginas ou esconder os CTAs atrás de flag até existirem |
| Expor `revisor_nome` contraria o doc 19 atual | Atualizar o doc 19 com a exceção explícita; não expor feedback, autor ou IDs |
| Múltiplas consultas agregadas podem pesar | Cache curto, queries agregadas, `EXISTS` nos filtros e avaliação de índices |
| `origem = 'Ambos'` duplica itens entre hero e manuais | Documentar como esperado; não deduplicar entre seções |
| Contagens do histórico não mudam com o filtro de tipo | Deixar explícito no doc 20 e no texto de apoio; filtro seleciona releases, não recontam itens |
| Degradê do hero vira exceção permanente e se espalha | Delimitar ao hero no doc 01 e no delta de `brand-tokens`; não usar em outras superfícies |
| Cache de 60 s atrasa publicação recém-feita | Trade-off aceito; “stale-while-revalidate” mantém a resposta rápida |
| Links externos de vídeo/manual podem ser inseguros | `rel="noopener noreferrer"`, URL pública e validação no servidor |

## Migration Plan

1. Implementar e testar a leitura pública e as funções puras.
2. Publicar os endpoints primeiro; validar com `curl` anônimo e com conteúdo em rascunho/arquivado/agendado.
3. Publicar a página e os componentes; validar os temas e os viewports.
4. Atualizar a documentação e a vitrine.
5. Rollback: remover a página/rotas e os endpoints; não há schema a reverter. Se índices forem adicionados, remover apenas os índices novos.

## Open Questions

Nenhuma pendência que altere spec, abordagem ou tarefas. Rótulos visuais menores (“Ver chamadas” vs “Ver itens”) e o formato final da data podem ser ajustados na revisão visual sem mudar o contrato.
