# 19 — API Pública de Navegação

**Versão:** 1.0.0 · **Data:** 2026-10-28 · **Idioma:** Português do Brasil (pt-BR)
**Status:** Implementado no change `area-publica-shell`.
**Escopo:** leitura anônima dos resumos publicados que alimentam o header e a sidebar da Área
Pública.
**Arquivos-fonte:** [`shared/publico.ts`](../shared/publico.ts) ·
[`server/utils/publico.ts`](../server/utils/publico.ts) ·
[`server/api/publico/navegacao.get.ts`](../server/api/publico/navegacao.get.ts) ·
[`server/middleware/auth-api.ts`](../server/middleware/auth-api.ts)
**Documentação visual:** [`18 - Sidebar e Header Area Publica.md`](18%20-%20Sidebar%20e%20Header%20Area%20Publica.md)

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
