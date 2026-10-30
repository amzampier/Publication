# 19 — API Pública de Navegação

**Versão:** 1.0.0 · **Data:** 2026-10-28 · **Idioma:** Português do Brasil (pt-BR)
**Status:** Implementado no change `area-publica-shell`.
**Escopo:** leitura anônima dos resumos publicados que alimentam o header, a sidebar e o Painel de
Destaques da Área Pública, incluindo o histórico filtrável de Releases Week.
**Arquivos-fonte:** [`shared/publico.ts`](../shared/publico.ts) →
[`server/utils/publico.ts`](../server/utils/publico.ts) →
[`server/api/publico/navegacao.get.ts`](../server/api/publico/navegacao.get.ts) →
[`server/api/publico/painel.get.ts`](../server/api/publico/painel.get.ts) →
[`server/api/publico/releases.get.ts`](../server/api/publico/releases.get.ts) →
[`server/middleware/auth-api.ts`](../server/middleware/auth-api.ts)
**Documentação visual:** [`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md)
e [`20 - Painel de Destaque Area Publica.md`](20%20-%20Painel%20de%20Destaque%20Area%20Publica.md)

> Esta API é **somente leitura** e **anônima**. Ela existe para o shell da Área Pública; não
> substitui as APIs administrativas e não expõe conteúdo em rascunho, revisão, arquivado ou
> agendado.

---

## 1. Rota

```
GET /api/publico/navegacao
```

- **Autenticação:** nenhuma. O middleware `server/middleware/auth-api.ts` libera apenas
  `GET`/`HEAD` sob `/api/publico/`.
- **Cache:** `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
- **Formato:** JSON.
- **Erros:** `500` genérico em falha de banco (tratado pelo error handler global), sem detalhe de
  infraestrutura.

## 2. Gate de visibilidade

O endpoint aplica o mesmo gate da Área Pública:

```sql
status = 'Publicado'
AND arquivada = 0
AND publicado_em IS NOT NULL
AND publicado_em <= NOW(6)
```

Para as chamadas filhas, o gate também exige:

```sql
e.status = 'Publicado'
AND e.publicado_em IS NOT NULL
AND e.publicado_em <= NOW(6)
```

Consequências:

- Rascunho, Em Revisão, Aprovado sem publicação efetiva, arquivado e publicação futura **não**
  aparecem.
- Arquivar um pai esconde o pai e as filhas, mesmo que as filhas estejam `Publicado`.
- Contagens de chamadas e sistemas incluem apenas chamadas publicamente visíveis.

## 3. DTO

```ts
export interface PublicoNavegacao {
  releases: PublicoReleaseResumo[]
  manuais: PublicoManualResumo[]
  escopos: PublicoEscopoResumo[]
}

export interface PublicoReleaseResumo {
  id: string
  ano: number
  mes: string
  semana: number
  versao: string
  release: string
  destaqueSemana: boolean
  chamadas: number
  publicadoEm: string
}

export interface PublicoManualResumo {
  id: string
  ano: number
  mes: string
  mesNumero: number
  titulo: string
  publicadoEm: string
}

export interface PublicoSistemaResumo {
  nome: string
  chamadas: number
}

export interface PublicoEscopoResumo {
  id: string
  codigo: string
  nome: string
  versao: string
  ano: number
  chamadas: number
  sistemas: PublicoSistemaResumo[]
  publicadoEm: string
}
```

Campos **não** expostos: autor, revisor, descrição, feedback, anexos, imagens, status interno,
arquivamento, trilha de auditoria e timestamps internos.

## 4. Exemplo de resposta

```json
{
  "releases": [
    {
      "id": "7a0d...",
      "ano": 2026,
      "mes": "Setembro",
      "semana": 39,
      "versao": "26.06a",
      "release": "26.06a10.05a",
      "destaqueSemana": true,
      "chamadas": 4,
      "publicadoEm": "2026-09-28T00:00:00.000Z"
    }
  ],
  "manuais": [
    {
      "id": "9b1e...",
      "ano": 2026,
      "mes": "Setembro",
      "mesNumero": 9,
      "titulo": "Manual de Setembro",
      "publicadoEm": "2026-09-01T00:00:00.000Z"
    }
  ],
  "escopos": [
    {
      "id": "c2f4...",
      "codigo": "PE-2026.01",
      "nome": "Escopo de Projeto Anual 2026",
      "versao": "v2026.1",
      "ano": 2026,
      "chamadas": 4,
      "sistemas": [
        { "nome": "ERP Enterprise", "chamadas": 1 },
        { "nome": "PDV Touch", "chamadas": 1 },
        { "nome": "WMS Logística", "chamadas": 1 }
      ],
      "publicadoEm": "2026-10-01T00:00:00.000Z"
    }
  ]
}
```

## 5. Contagens

| Seção | Contagem |
|---|---|
| Releases Week | `chamadas` = chamadas públicas vinculadas à release |
| Manuais Mensais | a sidebar agrupa a lista de manuais por mês; a contagem é o tamanho do grupo |
| Escopo de Projetos | `chamadas` = chamadas públicas do projeto; `sistemas[].chamadas` = chamadas públicas daquele sistema |

Uma chamada com múltiplos softwares conta em cada sistema. Por isso, a soma de
`sistemas[].chamadas` pode ser maior que `chamadas` do projeto; são agregados diferentes.

## 6. Segurança e operação

- O endpoint só responde a `GET`/`HEAD`; escritas em `/api/publico/**` não são liberadas pelo
  middleware.
- As APIs administrativas continuam exigindo sessão e RBAC.
- Não há migration: a leitura usa as tabelas e índices existentes.
- O cache de 60 s pode atrasar a exibição de uma publicação recém-feita; é o trade-off aceito para
  reduzir carga. Para tempo real, trocar para `no-store` no handler.

## 7. Verificação

- `npm run test` cobre os agrupamentos, a ordenação e os rótulos em
  `tests/publico-navegacao.test.ts` e a resolução de tema em `tests/publico-tema.test.ts`.
- `tests/visibilidade-publica.test.ts` cobre a semântica do gate público.
- Manual: `GET /api/publico/navegacao` sem cookie deve retornar `200`; `GET /api/release-week`
  sem cookie deve retornar `401`.
- Conferência de conteúdo: publicar uma release, um manual e um escopo e confirmar que aparecem;
  arquivar ou manter em rascunho e confirmar que desaparecem.

## 8. Painel de Destaques

### 8.1 Rota

```
GET /api/publico/painel
```

- **Autenticação:** nenhuma.
- **Cache:** `Cache-Control: public, max-age=60, stale-while-revalidate=300`.
- **Formato:** JSON.
- **Erros:** `500` genérico em falha de banco, sem detalhe de infraestrutura.

### 8.2 Resposta

```ts
interface PublicoPainel {
  releaseDestaque: PublicoReleaseDestaque | null
  manuaisDestaque: PublicoManualItemDestaque[]
  maisVistas: PublicoReleaseResumoPainel[]
  modoMaisVistas: 'vistas' | 'recentes'
  filtros: { softwares: string[]; tipos: TipoItem[] }
  escopoDestaque: PublicoEscopoResumo | null
  chamadasCriticas: PublicoChamadaCritica[]
}
```

- `releaseDestaque`: release com `destaque_semana = 1` mais recente; fallback para a release
  publicada mais recente; `null` quando não há release publicada.
- `manuaisDestaque`: até dois itens publicados de manuais com `destaque_semana = 1`; card de
  fallback `card: 'catalogo'` quando o manual não tem item publicado.
- `maisVistas`: até três releases, excluindo o hero; `modoMaisVistas = 'recentes'` quando nenhuma
  release tem `total_visualizacoes > 0`.
- `filtros`: softwares e tipos derivados apenas de chamadas publicadas em releases públicas.
- `escopoDestaque`: último escopo publicado por `publicado_em` (desempate por ano e versão); `null`
  quando não há escopo publicado. Contém código, nome, versão, ano, chamadas, sistemas e
  `publicadoEm`.
- `chamadasCriticas`: até três chamadas publicadas do escopo em destaque com `impacto` `Crítico` ou
  `Alto`, com as críticas antes das altas e, dentro de cada impacto, por `ordem_apresentacao` e
  `chamada`; lista vazia quando o escopo não tem chamadas em destaque ou quando não há escopo.

### 8.3 Campos públicos

**Expõe:** identificadores públicos, semana, ano, mês, versão, release, título, descrição, tipo,
software, módulo, parceiro, chamada, `publicadoEm`, `totalVisualizacoes`, contagem de fotos,
`linkVideo`, `linkManual` e `revisorNome`; para o escopo em destaque, código, nome, versão, ano,
chamadas, sistemas e `publicadoEm`; para as chamadas em destaque, código, título, sistemas, parceiro,
tipo e impacto (`Crítico` ou `Alto`).

**Não expõe:** autor, feedback de revisor, IDs internos, status interno, arquivamento, auditoria,
anexos completos, caminhos físicos e timestamps internos.

O crédito do revisor é o único dado de revisor exposto; `revisor_feedback`, `autor_id` e
`autor_nome` permanecem internos.

### 8.4 Exemplo

```json
{
  "releaseDestaque": {
    "id": "7a0d...",
    "semana": 39,
    "ano": 2026,
    "mes": "Setembro",
    "versao": "26.06a",
    "release": "26.06a10.05a",
    "nome": "Release Week 39 - Otimização Fiscal e Sincronização PDV Offline",
    "descricao": "Esta release semanal contempla 5 entregas prioritárias...",
    "publicadoEm": "2026-09-28T00:00:00.000Z",
    "totalVisualizacoes": 1434,
    "destaqueSemana": true,
    "revisorNome": "Carlos Eduardo Mendes",
    "chamadas": [
      {
        "id": "e1...",
        "chamada": "0000578990",
        "titulo": "Ajuste no cálculo de partilha do ICMS/DIFAL",
        "software": "ERP Enterprise",
        "modulo": "Fiscal",
        "tipo": "Correção",
        "parceiro": "Distribuidora Master",
        "fotos": 2,
        "linkVideo": "",
        "linkManual": ""
      }
    ]
  },
  "manuaisDestaque": [],
  "maisVistas": [],
  "modoMaisVistas": "recentes",
  "filtros": { "softwares": ["ERP Enterprise"], "tipos": ["Correção", "Melhoria"] },
  "escopoDestaque": {
    "id": "ab7d...",
    "codigo": "PE-2026.01",
    "nome": "Projeto 26.06a",
    "versao": "26.06a",
    "ano": 2026,
    "chamadas": 8,
    "sistemas": [{ "nome": "Arquivos Digitais - SPED", "chamadas": 3 }],
    "publicadoEm": "2026-10-29T21:48:58.552Z"
  },
  "chamadasCriticas": [
    {
      "id": "177a...",
      "chamada": "0000456822",
      "titulo": "Registro 1601 - SPED Fiscal",
      "softwares": ["Arquivos Digitais - SPED"],
      "parceiro": "MT8 Soluções",
      "tipo": "Melhoria",
      "impacto": "Crítico"
    },
    {
      "id": "9c31...",
      "chamada": "0000457104",
      "titulo": "Divergência de saldo após a conferência",
      "softwares": ["WMS Logística"],
      "parceiro": "Logística Express",
      "tipo": "Correção",
      "impacto": "Alto"
    }
  ]
}
```

## 9. Histórico público de Releases Week

### 9.1 Rota

```
GET /api/publico/releases?software=&tipo=&pagina=&porPagina=
```

- **Autenticação:** nenhuma.
- **Cache:** `Cache-Control: public, max-age=30, stale-while-revalidate=120`.
- **Normalização:** `pagina` inválida vira `1`; `porPagina` padrão `6` e máximo `50`; `tipo` fora do
  enum é ignorado; `software` desconhecido produz resultado vazio.
- **Formato:** JSON.

### 9.2 Resposta

```ts
interface PublicoHistorico {
  itens: PublicoReleaseResumoPainel[]
  total: number
  pagina: number
  porPagina: number
}
```

Cada item contém `id`, `semana`, `ano`, `versao`, `release`, `nome`, `descricao`, `chamadas`,
`contagens` (`correcao`, `melhoria`, `nova`), `publicadoEm` e `totalVisualizacoes`.

### 9.3 Filtros

- `software`: nome público do software; seleciona releases com ao menos uma chamada publicada
  daquele software (snapshot ou relação N:N).
- `tipo`: `Correção`, `Melhoria` ou `Nova Funcionalidade`; seleciona releases com ao menos uma
  chamada publicada daquele tipo.
- Os filtros combinam com E lógico.
- As contagens por tipo refletem todas as chamadas publicadas da release, não apenas as que
  correspondem ao filtro.

### 9.4 Gate

As duas leituras do painel usam o mesmo gate do restante da Área Pública:

```sql
status = 'Publicado'
AND arquivada = 0
AND publicado_em IS NOT NULL
AND publicado_em <= NOW(6)
```

As chamadas filhas também precisam de `status = 'Publicado'` e `publicado_em` efetivo. Arquivar o
pai esconde pai e filhas; publicação futura não aparece.

### 9.5 Verificação

- `npm run test` cobre as regras puras em `tests/publico-painel.test.ts` e o gate em
  `tests/visibilidade-publica.test.ts`.
- Manual: `GET /api/publico/painel` e `GET /api/publico/releases` sem cookie devem retornar `200`;
  `GET /api/release-week` sem cookie deve continuar retornando `401`.
- Manual: alternar `software`, `tipo` e `pagina` e confirmar que o painel e a URL refletem o estado.
- Manual: publicar, arquivar e agendar conteúdo e confirmar que o painel esconde o não público.

## 10. Página pública do Escopo de Projetos

### 10.1 Rotas

```http
GET /api/publico/escopos/:id
GET /api/publico/escopos/:id/chamadas?sistema=&pagina=&porPagina=
```

- **Autenticação:** nenhuma; o middleware libera apenas `GET`/`HEAD` em `/api/publico/**`.
- **Cache:**
  - detalhe: `public, max-age=60, stale-while-revalidate=300`;
  - chamadas: `public, max-age=30, stale-while-revalidate=120`.
- **Formato:** JSON.
- **Erros:** `404` para escopo inexistente, não publicado ou arquivado; `500` genérico em falha de
  banco, sem SQL, host ou stack trace.

### 10.2 Resposta do detalhe

```ts
interface PublicoEscopoDetalhe {
  id: string
  codigo: string
  nome: string
  versao: string
  ano: number
  chamadas: number
  sistemas: { nome: string; chamadas: number }[]
  publicadoEm: string
}
```

`chamadas` é o total de chamadas públicas do escopo. `sistemas` é derivado das chamadas públicas,
com a junção `entregas_itens_softwares` e fallback para o software principal. Uma chamada com dois
softwares conta em cada sistema; a soma de `sistemas[].chamadas` pode ser maior que `chamadas`.
`publicadoEm` é o carimbo efetivo de publicação.

### 10.3 Resposta das chamadas

```ts
interface PublicoChamadaEscopo {
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
  evidencias: { id: string; url: string; alt: string; capa: boolean }[]
  linkManual: string
  linkVideo: string
  dataLiberacao: string
}

interface PublicoEscopoChamadas {
  itens: PublicoChamadaEscopo[]
  total: number
  pagina: number
  porPagina: number
  sistemaSelecionado: string
}
```

- `descricao` é o texto puro de `descricao_completa`.
- `solucao` é o texto puro de `solucao`.
- `impacto` é o valor de `impacto` (`Baixo`, `Médio`, `Alto` ou `Crítico`), exibido com rótulo
  textual no card.
- `evidencias` vem de `anexos_midias` com `tipo_mime LIKE 'image/%'`, ordenada por capa/ordem.
- `softwares` vem da junção N:N, com fallback para o software principal.
- O padrão é 6 itens por página; o máximo de `porPagina` é 50.
- `pagina` inválida vira 1; `sistema` desconhecido produz lista vazia; `id` não público responde
  `404`.

### 10.4 Gate e filtro

O detalhe aplica o gate de `projetos_escopo`; as chamadas aplicam o gate de `entregas_itens` e o
vínculo `e.projeto_id = ?`. O filtro por sistema usa `EXISTS` na junção, com fallback para o software
principal quando não há junção. Arquivar o escopo esconde o escopo e as chamadas; publicação futura
não aparece.

### 10.5 Privacidade

**Expõe:** identificadores públicos, código, nome, versão, ano, contagens, sistemas, data efetiva de
publicação, chamada, título, descrição em texto puro, solução em texto puro, tipo, impacto, módulo,
parceiro, título do manual, softwares, tags, evidências (URL, alt e capa), links externos e data de
liberação.

**Não expõe:** autor, revisor, feedback, status interno, arquivamento, `descricao_html`,
`solucao_html`, auditoria, anexos completos, caminhos físicos ou timestamps internos.

### 10.6 Verificação

- `npm run test` cobre as regras puras em `tests/publico-escopo.test.ts` e o gate em
  `tests/visibilidade-publica.test.ts`.
- Manual: `GET /api/publico/escopos/:id` e `GET /api/publico/escopos/:id/chamadas` sem cookie devem
  retornar `200`; um id não público deve retornar `404`.
- Manual: filtrar por sistema, paginar, testar `pagina=abc`, `porPagina=999` e um sistema
  desconhecido.
- Manual: conferir que chamadas em rascunho, revisão, arquivadas ou com publicação futura não
  aparecem na lista nem nas contagens.
- Documentação visual: [`21 - Módulo Escopo Projeto Área Pública.md`](21%20-%20M%C3%B3dulo%20Escopo%20Projeto%20%C3%81rea%20P%C3%BAblica.md).
