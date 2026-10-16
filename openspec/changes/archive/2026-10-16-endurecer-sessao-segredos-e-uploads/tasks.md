# Tasks

## 1. Revogação de sessão

- [x] 1.1 Criar `server/migration/09_add_token_version.sql` adicionando `usuarios.token_version INT NOT NULL DEFAULT 0` (com rollback comentado). Verificado: a coluna existe após o boot (migration aplicada) e a migration não apaga dados.
- [x] 1.2 `server/utils/auth.ts`: claim `tv` em `emitirAccessToken`/`validarAccessToken` e leitura da versão em `login`/`renovarSessao`. Verificado por build e E2E (login emite a versão).
- [x] 1.3 `server/middleware/auth-api.ts`: valida por requisição (query por PK) conta existente/Ativa + versão do token; senão `401`; memoiza em `event.context`. Verificado no E2E: token válido segue; token revogado → `401`.
- [x] 1.4 `logout` e a desativação incrementam `token_version`; a exclusão remove a linha. Verificado no E2E: access capturado após logout → `401`; usuário desativado com sessão vigente → `401`.

## 2. Segredo SMTP

- [x] 2.1 `server/utils/crypto.ts` (AES-256-GCM; `cifrar`/`decifrar`) + fail-fast de `SMTP_ENC_KEY` no boot + `.env.example`. Verificado: build ok; boot sem a chave falharia (plugin `auth-config`).
- [x] 2.2 `server/utils/usuarios.ts`: `montarUsuario` devolve `temSenha` (nunca a senha); criar/editar cifram a senha nova e preservam a existente quando vazia. Verificado no E2E: `smtp.senha` vazio e `temSenha` presente.
- [x] 2.3 Backfill no boot (após as migrations) que cifra `senha_smtp` legado, idempotente. Verificado por build/inspeção (não havia linhas legadas no ambiente).
- [x] 2.4 Cliente: placeholder "senha cadastrada" no `CamposSmtp`. Verificado por build.

## 3. Uploads

- [x] 3.1 `ehImagemReal` (magic bytes PNG/JPEG/GIF/WebP) e endpoint recusando conteúdo não-imagem. Verificado no E2E: `.html` como `image/png` → `400`; PNG real → `200`.
- [x] 3.2 Servir `/uploads/**` com `X-Content-Type-Options: nosniff` (via `nitro.routeRules`). Verificado no E2E: cabeçalho presente na resposta do arquivo.

## 4. IP confiável

- [x] 4.1 `ipDoCliente`/`ipDe` usam o IP da conexão por padrão; XFF só com `TRUSTED_PROXIES`; documentado no `.env.example`. Verificado no E2E: `X-Forwarded-For: 10.9.9.9` não aparece na trilha.

## 5. Recuperação e e-mails

- [x] 5.1 `esqueci-senha` envia o e-mail antes de gravar o hash; falha mantém a senha anterior. Verificado no E2E: após a recuperação, a senha antiga continuou autenticando (envio falhou).
- [x] 5.2 `login` e `esqueci-senha` executam trabalho bcrypt equivalente quando a conta não existe. Verificado por build/inspeção (hash fixo de custo 12 no login; hash dummy na recuperação).
- [x] 5.3 `gerarSenhaProvisoria` usa `crypto.getRandomValues` (CSPRNG). Verificado por build/leitura.
- [x] 5.4 Links de e-mail usam `APP_URL` (fallback para a origem) em `esqueci-senha` e `convite`. Verificado por build/leitura.

## 6. Verificação integrada

- [x] 6.1 `npm run build` — sucesso ("Build complete!").
- [x] 6.2 E2E integrado: logout/desativação → `401`; `smtp.senha` vazio + `temSenha`; upload não-imagem → `400` e `nosniff` presente; XFF forjado ausente da trilha; recuperação com falha preservou a senha.
- [x] 6.3 `docs/08` atualizado (recuperação/ordem/APP_URL e revogação no logout) e Etapa 3 registrada no `docs/RL02` (A-01…A-06, M-07, M-08, M-09 → corrigido).
