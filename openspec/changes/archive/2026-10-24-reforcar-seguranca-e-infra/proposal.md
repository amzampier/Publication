# Proposal

## Why

Antes de expor a Área Pública, faltam três proteções de base: uma busca de e-mails que não carregue a lista inteira de usuários, headers/CSRF globais para as rotas com cookie e um rate limit que sobreviva a restart e seja compartilhado entre instâncias. Hoje o rate limit é um `Map` por processo e os headers de segurança cobrem apenas `/uploads/**`.

## What Changes

- Criar `GET /api/usuarios/emails` dedicado a autocomplete: consulta mínima (`q` com 2+ caracteres), paginação limitada, retorno somente de `id`/`email`/`nome` e RBAC de `gestao-usuarios`.
- Adicionar headers globais de segurança (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`) e CSRF para métodos de escrita autenticados por cookie.
- Persistir o rate limit em banco, com contador atômico por IP/rota, janela deslizante/fixa documentada, limpeza e fallback seguro quando o banco estiver indisponível.
- Atualizar specs, docs e testes; nenhuma mudança de UI além do consumo do endpoint de e-mails.

## Capabilities

### New Capabilities

- `seguranca-http`: headers globais e proteção CSRF para a aplicação.

### Modified Capabilities

- `gestao-usuarios`: busca dedicada e paginada de e-mails para autocomplete.
- `login`: rate limit persistente e compartilhado entre processos/instâncias.
- `autorizacao-rbac`: a nova rota de e-mails entra no catálogo com a permissão de Gestão de Usuários.

## Impact

- **Código:** `server/api/usuarios/emails.get.ts`, `server/utils/usuarios.ts`, `server/utils/rateLimit.ts`, `server/middleware/` (CSRF), `nuxt.config.ts` (headers), `app/components/usuarios/` (consumo do autocomplete).
- **Banco:** migration 34 com tabela de contadores de rate limit e índice/TTL.
- **Contratos:** nova rota `GET /api/usuarios/emails`; headers de resposta adicionais; requisições de escrita passam a exigir validação CSRF.
- **Fora de escopo:** FULLTEXT/export streaming/CDN e validação de produção (change `escalar-busca-e-entrega`).
