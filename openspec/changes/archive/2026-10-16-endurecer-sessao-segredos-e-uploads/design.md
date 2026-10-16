# Design

## Context

Ver `proposal.md` — Why. Estado atual que molda a abordagem:

- `getSessionUser` (`server/utils/auth.ts`) valida o access JWT **sem banco** quando ele é válido; o logout só revoga o refresh (`revogarSessao`); desativação/exclusão não tocam o access.
- `server/middleware/auth-api.ts` exige sessão e (change anterior) bloqueia sessão provisória; já guarda a sessão em `event.context.sessaoUsuario`.
- `server/utils/usuarios.ts`: `montarUsuario` devolve `senha: row.senha_smtp`; `criarUsuario`/`atualizarUsuario`/`atualizarProprioRegistro` gravam `smtp.senha` em texto.
- `server/utils/rateLimit.ts` (`ipDoCliente`) e `server/utils/auth.ts` (`ipDe`) usam `getRequestIP(event, { xForwardedFor: true })`.
- `server/api/uploads/index.post.ts` valida só `campoArquivo.type`; `uploads/` é servida por `nitro.publicAssets`.
- `server/api/auth/esqueci-senha/index.post.ts` grava o hash **antes** de `enviarEmail`; conta inexistente responde mais rápido (sem bcrypt); o link usa `getRequestURL(event).origin`.
- `shared/utils/emails.ts` `gerarSenhaProvisoria` usa `Math.random()`.

## Goals / Non-Goals

**Goals:**
- Revogar a sessão no servidor (logout/desativação/exclusão) com validação por requisição.
- Não expor a senha SMTP e cifrá-la em repouso.
- Validar o conteúdo real dos uploads e servi-los com `nosniff`.
- IP confiável no rate limit e na auditoria.
- Recuperação segura (ordem, tempo uniforme) e links/origem confiáveis; senha provisória por CSPRNG.

**Non-Goals:**
- Cifrar a senha de login (bcrypt já é hash), trocar o algoritmo do JWT, ou introduzir bibliotecas de cripto externas.
- Middleware global de security headers (CSP/HSTS/etc.) — roadmap; aqui só o `nosniff` de `/uploads/**`.
- Expurgo de auditoria (M-03) e performance (Etapa 5 do RL02).

## Decisions

### D1 — Revogação por `token_version` + validação no middleware
Nova coluna `usuarios.token_version INT NOT NULL DEFAULT 0` (migration 09). O access JWT ganha o claim `tv`; `login`/`renovarSessao` leem a versão da conta. O middleware `auth-api.ts`, após resolver a sessão, valida em **uma query** que a conta existe, está `Ativo` e `token_version` confere com o claim; senão `401`. `logout` e a mudança para `Inativo` incrementam `token_version`; a exclusão remove a linha (a query falha → `401`). A validação é memoizada em `event.context`.
- **Por quê:** um `jti`/blacklist exigiria uma linha por access e leitura da blacklist; a versão resolve "todos os tokens do usuário" com uma coluna e uma comparação.
- **Trade-off:** volta a haver 1 leitura de banco por requisição autenticada (o access válido antes não tocava o banco). Aceitável — `requirePermission` já lê o banco por rota de módulo, e a query é por PK.
- **Alternativa descartada:** TTL curto só — não revoga de fato no logout.

### D2 — Senha SMTP cifrada (AES-256-GCM) e nunca devolvida
Novo `server/utils/crypto.ts` com `cifrar(texto)`/`decifrar(valor)` (AES-256-GCM; chave de 32 bytes de `SMTP_ENC_KEY`; formato `enc:v1:<base64(iv|tag|ciphertext)>`). `montarUsuario` deixa de devolver `senha` e passa a devolver `temSenha: boolean`. Nas escritas, senha nova (não vazia) é cifrada; senha ausente/vazia **preserva** a existente (a coluna só entra no `SET` quando há valor novo). No boot (plugin de migrations, após as migrations), um backfill idempotente cifra valores legados (não-`enc:v1:`).
- **Por quê:** nenhuma API entrega o segredo; em repouso fica cifrado.
- **Alternativa descartada:** só mascarar (mantém texto no banco); remover o campo (perde a configuração de SMTP corporativo futura).
- `server/plugins/auth-config.ts` passa a exigir `SMTP_ENC_KEY` no boot (fail-fast, como `AUTH_JWT_SECRET`), com a chave documentada no `.env.example`.

### D3 — Uploads: magic bytes + `nosniff`
`server/utils/uploads.ts` ganha `validarConteudoImagem(buffer)` (assinaturas PNG/JPEG/GIF/WebP) — o endpoint passa a exigir que a assinatura confira com o tipo declarado, recusando HTML/SVG e afins. O servimento por `nitro.publicAssets` ganha `X-Content-Type-Options: nosniff` via `nitro.routeRules` para `/uploads/**` (verificação por E2E; se a regra não se aplicar ao asset handler, cai num middleware curto que seta o header).
- **Por quê:** fecha o XSS armazenado na origem sem depender de o cliente declarar o tipo.

### D4 — IP confiável
`ipDoCliente`/`ipDe` passam a usar o IP do socket por padrão (`getRequestIP(event)` sem `xForwardedFor`); o `X-Forwarded-For` só é considerado quando `TRUSTED_PROXIES` (env) lista IPs/CIDRs confiáveis.
- **Por quê:** impede forjar o IP do rate limit e da trilha.

### D5 — Recuperação, tempo uniforme, origem e CSPRNG
`esqueci-senha`: envia o e-mail **primeiro** e só grava o novo hash se o envio retornar sucesso (falha mantém a senha anterior). `login` e `esqueci-senha` executam uma operação bcrypt de custo equivalente mesmo quando a conta não existe (uniformiza o tempo). `gerarSenhaProvisoria` passa a usar `crypto.randomInt`. Os links de e-mail usam `runtimeConfig.public.appUrl` (env `APP_URL`), com fallback para a origem da requisição só se `APP_URL` não estiver configurada.
- **Por quê:** elimina enumeração por tempo, mantém a conta acessível em falha de e-mail e impede phishing por `Host` forjado.

## Risks / Trade-offs

- **Leitura extra por requisição (D1):** +1 query por chamada autenticada → mitigação: query por PK e memoização por request.
- **Edição da UI da senha SMTP:** o formulário passa a mostrar "senha cadastrada" em vez do valor → atualizar `CamposSmtp`/AbaEmail e o modal de usuário; enviar vazio preserva.
- **`SMTP_ENC_KEY` ausente:** fail-fast no boot (documentado). Rotação de chave não é tratada nesta etapa (non-goal).
- **`nosniff` via routeRules:** se a regra não atingir o asset handler, usar o middleware de fallback — coberto pela verificação E2E.

## Migration Plan

- **Schema:** nova migration `09_add_token_version.sql` (aditiva; `CREATE`/`ALTER ... ADD COLUMN` idempotente por tolerância a 1060).
- **Dados:** backfill de `senha_smtp` em texto → ciphertext no boot (idempotente).
- **Config:** `.env.example` ganha `SMTP_ENC_KEY`, `APP_URL` e `TRUSTED_PROXIES` (vazio = nenhum proxy confiável).
- **Rollback:** reverter o commit; a coluna `token_version` fica (inócua) e valores cifrados permanecem cifrados (reverter exige decifrar via script — documentado no rollback da migration).
- **Verificação:** `npm run build` + E2E (logout/desativação → `401`; `smtp.senha` ausente + `temSenha`; upload `.html` → `400`; `nosniff` presente; `X-Forwarded-For` não contorna; recuperação com falha preserva a senha).

## Open Questions

Nenhuma pendente — as quatro decisões de escopo foram resolvidas com o usuário.
