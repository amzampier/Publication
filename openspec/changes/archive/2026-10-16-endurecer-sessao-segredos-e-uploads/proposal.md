# Proposal

## Why

A auditoria RL02 (Etapa 3) apontou falhas de segurança altas/médias ainda abertas: a senha SMTP de todos os usuários é devolvida em texto claro pela API (`A-01`); o upload valida só o MIME declarado e serve HTML/JS na mesma origem (`A-02`); o rate limit/auditoria confiam em `X-Forwarded-For` forjável (`A-03`); logout/desativação/exclusão **não** revogam a sessão de acesso no servidor (`A-04`/`A-05`); a recuperação de senha grava o hash antes de entregar o e-mail (`A-06`); o login revela existência por tempo de resposta (`M-07`); a senha provisória usa `Math.random()` (`M-08`); e os links de e-mail usam o `Host` recebido (`M-09`). São vetores de exposição de credenciais, XSS e revogação ineficaz que precisam ser fechados antes de produção.

## What Changes

- **Senha SMTP (`A-01`):** as APIs deixam de devolver `smtp.senha` (passam a indicar apenas se há senha cadastrada); os valores passam a ser gravados **cifrados** (AES-256-GCM, chave em `SMTP_ENC_KEY`) e os valores legados em texto são migrados no boot; senha vazia no formulário preserva a existente.
- **Uploads (`A-02`):** `POST /api/uploads` valida o **conteúdo real** (magic bytes) contra os tipos de imagem aceitos, rejeitando HTML/SVG e afins; `/uploads/**` passa a ser servido com `X-Content-Type-Options: nosniff`.
- **IP do cliente (`A-03`):** o IP do rate limit e da auditoria passa a ser o do socket, e o `X-Forwarded-For` só é considerado quando uma lista de proxies confiáveis estiver configurada.
- **Revogação de sessão (`A-04`/`A-05`):** nova capability `revogacao-sessao` — o access passa a carregar uma **versão de token**; logout, desativação e exclusão a incrementam/removem a conta e o middleware valida, por requisição, que a sessão continua válida (`401` caso contrário).
- **Recuperação de senha (`A-06`, `M-07`):** a senha provisória só é gravada **após** o e-mail ser entregue; login e recuperação passam a ter resposta de tempo uniforme (sem revelar existência).
- **Fortificação (`M-08`, `M-09`):** senha provisória gerada por CSPRNG; links de e-mail usam a origem configurada (`APP_URL`), não o `Host` recebido.
- **BREAKING:** `smtp.senha` deixa de vir na API (substituído por um indicador); sessões passam a ser revogadas de imediato; uploads não-imagem passam a ser recusados.

## Capabilities

### New Capabilities
- `revogacao-sessao`: revogação server-side da sessão de acesso — logout, desativação e exclusão deixam de autenticar imediatamente, via versão de token validada pelo middleware.

### Modified Capabilities
- `login`: limite de requisições por IP confiável (sem `X-Forwarded-For` forjável); recuperação que só altera a senha após a entrega do e-mail; resposta de tempo uniforme para existente/inexistente; links de e-mail na origem configurada.
- `gestao-usuarios`: as APIs não expõem a senha SMTP (indicador de existência no lugar do valor).
- `meu-perfil`: a API do próprio registro não devolve a senha SMTP.
- `uploads`: valida o conteúdo real (magic bytes) e serve os arquivos com `nosniff`.
- `auditoria`: o IP de origem registrado é o do socket, salvo proxy confiável configurado.

## Impact

- **Backend:** `server/utils/auth.ts` (claim de versão, helpers de sessão), `server/middleware/auth-api.ts` (validação de sessão por requisição), `server/api/auth/logout`, `server/utils/usuarios.ts` (revogação na desativação/exclusão; cifra/serialização da senha SMTP), `server/utils/crypto.ts` (novo — AES-GCM), `server/utils/rateLimit.ts` e `server/utils/auth.ts` (IP confiável), `server/api/uploads` (magic bytes) + servimento, `server/api/auth/esqueci-senha` (ordem + tempo uniforme), `shared/utils/emails.ts` (CSPRNG + origem fixa), `server/plugins` (migração da senha SMTP no boot).
- **Banco:** nova coluna `usuarios.token_version` (migration) e a coluna `senha_smtp` passa a guardar ciphertext (sem mudança de tipo).
- **Config:** nova variável `SMTP_ENC_KEY` (chave AES) e `APP_URL` (origem dos links) / proxies confiáveis — documentadas em `.env.example`.
- **Frontend:** indicador "senha cadastrada" no lugar do valor em `CamposSmtp`/AbaEmail e no modal de usuário.
- **Documentação:** `docs/08`, `docs/RL02` (Etapa 3).
- **Dependências:** nenhuma nova (usa `node:crypto`).
