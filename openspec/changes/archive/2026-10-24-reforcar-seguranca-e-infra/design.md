# Design

## Context

`/api/usuarios` já é paginada, mas não existe uma consulta dedicada de e-mails. Os headers de
segurança cobrem apenas `/uploads/**` em `nuxt.config.ts`. O rate limit de `server/utils/rateLimit.ts`
é um `Map` por processo e reinicia com o servidor. A autenticação usa cookies `HttpOnly` com
`SameSite=Lax`, mas não há validação CSRF explícita. Ver `proposal.md` e os delta specs.

## Goals / Non-Goals

**Goals:**

- Reduzir a exposição da lista de usuários no autocomplete de e-mails.
- Adicionar headers globais e CSRF sem quebrar TipTap, login ou clientes de API.
- Persistir contadores de rate limit com comportamento atômico e compartilhado.
- Manter fallback seguro quando o banco estiver indisponível.

**Non-Goals:**

- Trocar `SameSite=Lax` por `Strict` ou redesenhar a sessão.
- Implementar WAF, CAPTCHA ou rate limit distribuído por Redis.
- Alterar o catálogo RBAC além da nova rota.

## Decisions

### 1. Endpoint dedicado de e-mails com consulta prefixada

`GET /api/usuarios/emails` recebe `q` (mín. 2), `pagina` e `porPagina` (máx. 20). A consulta usa
`email_corporativo LIKE CONCAT(?, '%') OR nome_completo LIKE CONCAT(?, '%')`, ordenada por e-mail,
com `LIMIT/OFFSET`. O retorno é `{ itens: [{ id, email, nome }], total, pagina, porPagina }`.
Permissão: `gestao-usuarios`/`visualizar`; com `q`, também `buscar`. Sem `q`, `400` — não existe
listagem total por essa rota. Alternativa descartada: reutilizar `/api/usuarios`, que carrega
perfil/situação/timestamps e amplia a superfície de dados.

### 2. Headers em `routeRules` global

Adicionar `routeRules['/**'].headers` com `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `X-Frame-Options` e CSP. A CSP usa `default-src 'self'`, `script-src 'self'`
(com o que o Nuxt exigir em dev), `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:`,
`font-src 'self' https://fonts.gstatic.com`, `connect-src 'self'`, `frame-ancestors 'none'`.
HSTS é adicionado apenas quando `NODE_ENV=production` e a origem é HTTPS. `routeRules` específicas
de `/uploads/**` continuam prevalecendo.

### 3. CSRF por Origin/Referer + duplo envio

Middleware Nitro para métodos inseguros sob `/api/**`, exceto `/api/auth/login`,
`/api/auth/refresh`, `/api/auth/esqueci-senha` e `/api/configuracoes/identidade`. Aceita:
(a) `Origin`/`Referer` equal à origem de `APP_URL`/host da requisição; ou
(b) `X-CSRF-Token` igual ao cookie `csrf_token` (duplo envio). Em falha, `403` antes do handler.
O cookie CSRF é emitido por `GET /api/auth/csrf` (não HttpOnly, `SameSite=Lax`). O cliente passa a
enviar `X-CSRF-Token` nas escritas via `useApiFetch`. Alternativa descartada: só Origin, que quebra
clientes não-browser/curl legítimos.

### 4. Rate limit persistente com UPSERT atômico

Migration 34 cria `rate_limit_contadores` (`chave` PK, `janela_inicio DATETIME(6)`, `contagem INT`,
`atualizado_em`). A chave é `${ip}|${rota}`. A cada requisição:

1. `INSERT ... ON DUPLICATE KEY UPDATE` reinicia a contagem quando a janela venceu, senão incrementa;
2. `SELECT` da linha para comparar com o limite configurado;
3. `429` quando `contagem > limite`.

Tudo em uma transação curta ou em uma única instrução atômica com `LAST_INSERT_ID` quando possível.
Limpeza oportunista de linhas com `atualizado_em` antigo (ex.: > 1 dia). Fallback: em erro de banco,
usar o `Map` atual (fail-open para autenticação, mas mantendo o limite local). O cache de limite de
60 s continua.

### 5. Testes

- Endpoint: termo curto, permissão, limite de página, retorno mínimo.
- CSRF: origem cruzada, same-origin, token, GET isento, auth isenta.
- Headers: presença global e HSTS condicional.
- Rate limit: incremento, janela, restart simulado (nova instância lê o banco), concorrência e fallback.

## Risks / Trade-offs

- **CSP quebra recurso inline** → testar TipTap, fontes e estilos; liberar só o necessário.
- **CSRF quebra cliente antigo** → usar Origin/Referer e token; documentar clientes de API.
- **UPSERT concorrente** → usar operação atômica e teste com N chamadas paralelas.
- **Crescimento da tabela** → limpeza oportunista e índice em `atualizado_em`.

## Migration Plan

1. Aplicar a migration 34 e validar a tabela/índice.
2. Ativar headers/CSRF em ambiente de teste e percorrer login, CRUD e editor rico.
3. Ativar o rate limit persistente e testar restart/duas instâncias.
4. Rollback: remover middleware/routeRules e a tabela; o fallback em memória continua funcionando.
