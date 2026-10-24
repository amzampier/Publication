# Design

## Context

As buscas usam `LIKE '%termo%'` em Chamadas, Auditoria e Usuários; as exportações montam o conjunto
em memória e o cliente gera o arquivo. Os assets `/_nuxt/**` não têm uma regra explícita de cache
imutável e a compressão depende do servidor. Ver `proposal.md` e os delta specs.

## Goals / Non-Goals

**Goals:**

- Usar FULLTEXT para termos textuais, mantendo códigos/e-mails e termos curtos em caminhos
  indexáveis.
- Entregar CSV em fluxo com filtros/RBAC e sem materializar todo o conjunto.
- Formalizar cache/compressão e um checklist de produção verificável.

**Non-Goals:**

- Substituir o PDF client-side por geração assíncrona.
- Criar um serviço de busca externo (Elastic/Meilisearch).
- Instalar CDN gerenciado; a camada de proxy pode variar por ambiente.

## Decisions

### 1. FULLTEXT por módulo, com adaptador de termos

Migration 35 adiciona índices InnoDB FULLTEXT:

- `entregas_itens (chamada, titulo, descricao_completa, solucao, modulo, menu_funcionalidade)`;
- `auditoria (usuario_nome, entidade, detalhes)`;
- `usuarios (nome_completo, email_corporativo)`.

O adaptador de busca:
- termo com 3+ caracteres → `MATCH(colunas) AGAINST (? IN BOOLEAN MODE)`, com `+termo*` para prefixo;
- código/e-mail ou termo <3 → `LIKE 'termo%'`/igualdade em coluna indexada;
- combina com os filtros existentes e mantém `LIMIT/OFFSET` + `COUNT`.
MariaDB `innodb_ft_min_token_size` (default 3) é pressuposto; se o ambiente usar outro, o fallback de
prefixo cobre termos curtos. Alternativa descartada: FULLTEXT com `LIKE` simultâneo em todas as
colunas, que perde o índice.

### 2. CSV streaming por keyset

Novo helper `csvStream` cria um `Readable` Node que consulta páginas por cursor (id/código) e escreve
linhas com escape CSV (aspas, CR/LF, anti-fórmula). Os endpoints `?exportar=1&formato=csv` usam
`sendStream`, `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`, e mantêm o
JSON antigo quando `formato` não é `csv` (compatibilidade/PDF). O cliente passa a usar a URL direta
para CSV e não monta mais o arquivo no browser.

### 3. Cache/compressão

`routeRules['/_nuxt/**']` define `Cache-Control: public, max-age=31536000, immutable` e
`Vary: Accept-Encoding`. HTML/rotas administrativas permanecem sem cache público. Compressão
Brotli/gzip fica no proxy/Nitro; o checklist de produção valida `Accept-Encoding` e `Content-Encoding`.
`/uploads/**` mantém cache curto/revalidável. O checklist vira `docs/18 - Produção.md`.

### 4. Testes e medição

- Medir consultas antes/depois com `EXPLAIN`/`EXPLAIN ANALYZE` e dataset de volume.
- Testar FULLTEXT para termos, prefixos, acentos e termos curtos.
- Testar CSV com 1/100/10k linhas, filtros, permissão, abort e escape.
- Validar headers/cache/compressão em `npm run preview` ou proxy local.

## Risks / Trade-offs

- **Semântica FULLTEXT diferente de substring** → documentar e testar termos/prefixos; códigos/e-mails
  continuam no caminho antigo.
- **Token mínimo do MariaDB** → fallback de prefixo para termos curtos; checklist registra o valor.
- **Streaming e erros tardios** → se a conexão falhar após o início, o cliente recebe arquivo
  incompleto; usar `Content-Length` desconhecido/chunked e logar abort.
- **Cache imutável** → só para `/_nuxt/**` com hash; nunca HTML.
- **Compressão no app vs proxy** → evitar dupla compressão; definir no runbook.

## Migration Plan

1. Aplicar migration 35 em banco de teste; validar índices e `EXPLAIN`.
2. Ativar CSV streaming atrás de `formato=csv`; comparar totais com a listagem.
3. Configurar cache/compressão no proxy e validar headers.
4. Rodar carga e o checklist de produção; rollback remove índices/rotas novas de CSV.
