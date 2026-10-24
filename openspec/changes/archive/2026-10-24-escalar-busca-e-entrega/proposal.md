# Proposal

## Why

Com o crescimento do catálogo, as buscas por `LIKE '%termo%'` e as exportações que materializam todo o conjunto passam a dominar o custo de leitura. A entrega de assets também ainda depende de compressão/cache do servidor de aplicação. Este bloco prepara o sistema para volume e para o go-live.

## What Changes

- Criar índices `FULLTEXT` no MariaDB e um adaptador de busca que usa `MATCH ... AGAINST` para termos textuais, mantendo prefixo/`LIKE` para códigos e e-mails.
- Oferecer exportação CSV em fluxo (streaming) com cursor/keyset e `Content-Disposition`, sem carregar o conjunto inteiro em memória.
- Adicionar cache imutável para assets com hash, compressão Brotli/gzip no proxy/Nitro e documentar a validação de produção (HTTPS, proxy, banco, backup, carga e rollback).
- Atualizar specs, docs e testes de busca/exportação.

## Capabilities

### New Capabilities

- `busca-fulltext`: busca textual indexada e paginada nos módulos de maior volume.
- `exportacao-streaming`: exportação CSV em fluxo, sem materializar todo o conjunto.
- `entrega-assets`: cache/compressão de assets e critérios de entrega em produção.

### Modified Capabilities

Nenhuma capability existente muda de contrato; os módulos continuam expondo os mesmos filtros e colunas.

## Impact

- **Banco:** migration 35 com índices FULLTEXT.
- **Código:** `server/utils/*` de busca, endpoints de exportação CSV, `nuxt.config.ts`/proxy e scripts de validação.
- **Contratos:** `?exportar=1&formato=csv` passa a responder `text/csv` em fluxo; o JSON atual pode permanecer para compatibilidade/PDF.
- **Fora de escopo:** substituir o PDF client-side por geração assíncrona; FULLTEXT em todas as tabelas; CDN gerenciado.
